/**
 * ensureFreshAccessToken — server-side preflight refresh.
 *
 * Returns a non-expired IDP access token for a given session. Refreshes
 * proactively when the stored token is within the safety window of expiry,
 * using the same Redis lock and IDP wire shape as `createRefreshHandler`.
 *
 * Designed for proxy-route auth helpers that today read the stored token
 * blindly and let the backend reject it with a 401. Calling this instead of
 * `getSession(...).idpAccessToken` means a good token client never sends
 * credentials it already knows are invalid.
 *
 * Single-use refresh-token semantics are preserved via Redis-backed
 * single-flight locking (see `acquireRefreshLock`).
 */
import {
  getSession,
  updateSession,
  acquireRefreshLock,
  releaseRefreshLock,
  checkRefreshLock,
} from './session-store';
import { computeTokenExpiries } from './token-expiry';
import { extractKidFromToken } from '../auth/utils/token-utils';

export interface EnsureFreshConfig {
  idpBaseUrl: string;
  clientId: string;
  refreshEndpoint?: string;
}

export interface EnsureFreshOptions {
  /** Refresh if the access token is within this many ms of expiry. Default 60_000. */
  safetyWindowMs?: number;
  /** Max wait while another caller holds the refresh lock. Default 5000. */
  lockWaitMs?: number;
  /** Optional caller request id for lock attribution. */
  requestId?: string;
}

export type EnsureFreshResult =
  | {
      ok: true;
      accessToken: string;
      accessTokenExpires: number;
      /** True if we refreshed (or a concurrent refresh completed); false if the stored token was already fresh. */
      refreshed: boolean;
    }
  | {
      ok: false;
      code: string;
      message: string;
      status: number;
      terminal?: boolean;
      discardToken?: boolean;
      retryable?: boolean;
      resolution?: string;
    };

const DEFAULT_SAFETY_WINDOW_MS = 60_000;
const DEFAULT_LOCK_WAIT_MS = 5000;

function decodeJwtExp(token: string): number {
  const parts = token.split('.');
  if (parts.length !== 3) return -1;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return (payload.exp || 0) * 1000;
  } catch {
    return -1;
  }
}

export async function ensureFreshAccessToken(
  sessionToken: string,
  config: EnsureFreshConfig,
  options: EnsureFreshOptions = {}
): Promise<EnsureFreshResult> {
  const { idpBaseUrl, clientId, refreshEndpoint = '/api/ExternalAuth/refresh' } = config;
  const safetyWindowMs = options.safetyWindowMs ?? DEFAULT_SAFETY_WINDOW_MS;
  const lockWaitMs = options.lockWaitMs ?? DEFAULT_LOCK_WAIT_MS;
  const requestId = options.requestId ?? `ensure_fresh_${Date.now()}`;

  const session = await getSession(sessionToken);
  if (!session) {
    return { ok: false, code: 'NO_SESSION', message: 'No session for token', status: 401, terminal: true };
  }

  const storedToken = session.idpAccessToken;
  if (!storedToken) {
    return { ok: false, code: 'NO_TOKEN', message: 'No IDP access token in session', status: 401, terminal: true };
  }

  const now = Date.now();
  const redisExpires = session.idpAccessTokenExpires ?? 0;
  const jwtExpires = decodeJwtExp(storedToken);
  // Use the smaller of the two to be conservative — Redis can be stale, JWT exp is authoritative.
  const effectiveExpires = jwtExpires > 0 ? Math.min(redisExpires || jwtExpires, jwtExpires) : redisExpires;
  const msUntilExpiry = effectiveExpires - now;

  if (msUntilExpiry > safetyWindowMs) {
    return { ok: true, accessToken: storedToken, accessTokenExpires: effectiveExpires, refreshed: false };
  }

  if (!session.idpRefreshToken) {
    return {
      ok: false,
      code: 'NO_REFRESH_TOKEN',
      message: 'Access token expired and no refresh token available',
      status: 401,
      terminal: true,
      resolution: 'User must re-authenticate',
    };
  }

  const lock = await acquireRefreshLock(sessionToken, requestId, lockWaitMs);
  let weHoldLock = false;
  let releaseVersion: number | undefined;

  if (!lock.acquired) {
    const existing = await checkRefreshLock(sessionToken);
    if (!existing || existing.acquiredBy !== requestId) {
      const startWait = Date.now();
      while (Date.now() - startWait < lockWaitMs) {
        await new Promise(r => setTimeout(r, 200));
        const stillLocked = await checkRefreshLock(sessionToken);
        if (!stillLocked) {
          const after = await getSession(sessionToken);
          if (after?.idpAccessToken && after.idpAccessTokenExpires) {
            const remaining = after.idpAccessTokenExpires - Date.now();
            if (remaining > safetyWindowMs) {
              return {
                ok: true,
                accessToken: after.idpAccessToken,
                accessTokenExpires: after.idpAccessTokenExpires,
                refreshed: true,
              };
            }
          }
          break;
        }
      }
      return {
        ok: false,
        code: 'CONFLICT',
        message: 'Refresh already in progress',
        status: 409,
        retryable: true,
      };
    }
  } else {
    weHoldLock = true;
    releaseVersion = lock.lockInfo?.lockVersion;
  }

  try {
    // Re-check after lock — another caller may have already refreshed.
    const latest = await getSession(sessionToken);
    if (latest?.idpAccessToken && latest.idpAccessTokenExpires) {
      const latestRemaining = latest.idpAccessTokenExpires - Date.now();
      const latestJwtExp = decodeJwtExp(latest.idpAccessToken);
      const stillStale = latestRemaining <= safetyWindowMs || (latestJwtExp > 0 && latestJwtExp <= Date.now());
      if (!stillStale) {
        return {
          ok: true,
          accessToken: latest.idpAccessToken,
          accessTokenExpires: latest.idpAccessTokenExpires,
          refreshed: true,
        };
      }
    }

    // Build refresh request body — wire shape must match what the IDP expects.
    let authMethods: string[] = [];
    if (Array.isArray(session.authenticationMethods)) {
      authMethods = session.authenticationMethods;
    } else if (typeof session.authenticationMethods === 'string') {
      try { authMethods = JSON.parse(session.authenticationMethods); } catch { /* fall through */ }
    }
    const isOAuthSession = !!session.oauthProvider;
    if (authMethods.length === 0 && isOAuthSession) {
      authMethods = ['pwd', 'mfa'];
    }
    const twoFactorMethod =
      authMethods.find(m => ['sms', 'totp', 'email'].includes(m)) ||
      session.mfaMethod ||
      (isOAuthSession ? 'oauth' : null);

    let acrValue = String(session.authenticationLevel ?? '1');
    if (isOAuthSession && session.mfaVerified && acrValue === '1') {
      acrValue = '2';
    }

    const body: Record<string, unknown> = {
      refresh_token: session.idpRefreshToken,
      amr: authMethods,
      acr: acrValue,
    };
    if (session.mfaVerified) body.two_factor_verified = true;
    if (twoFactorMethod) body.two_factor_method = twoFactorMethod;
    if (session.mfaCompletedAt) body.two_factor_completed_at = new Date(session.mfaCompletedAt).toISOString();

    let idpResponse: Response;
    try {
      idpResponse = await fetch(`${idpBaseUrl}${refreshEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Client-Id': clientId },
        body: JSON.stringify(body),
      });
    } catch (err) {
      return {
        ok: false,
        code: 'UPSTREAM_SERVICE_UNAVAILABLE',
        message: err instanceof Error ? err.message : 'IDP unreachable',
        status: 503,
        retryable: true,
      };
    }

    let responseData: any;
    try {
      const text = await idpResponse.text();
      if (!text.trim()) {
        return { ok: false, code: 'UPSTREAM_SERVICE_ERROR', message: 'Empty response from IDP', status: 502, retryable: true };
      }
      responseData = JSON.parse(text);
    } catch (err) {
      return { ok: false, code: 'UPSTREAM_SERVICE_ERROR', message: 'Invalid JSON from IDP', status: 502, retryable: true };
    }

    if (!idpResponse.ok) {
      const idpError = responseData?.error || {};
      const code = idpError.code || 'UNKNOWN_ERROR';
      const discardToken = idpResponse.status === 401 || idpError.discard_token === true;
      const retryable = idpResponse.status !== 401 && idpError.retryable === true;
      if (discardToken) {
        await updateSession(sessionToken, {
          idpRefreshToken: '',
          idpRefreshTokenExpires: undefined,
          refreshTokenClearedAt: Date.now(),
          refreshTokenClearedReason: `IDP_DISCARD_TOKEN:${code}`,
        });
      }
      return {
        ok: false,
        code,
        message: idpError.message || 'Token refresh failed',
        status: idpResponse.status,
        discardToken,
        retryable,
        resolution: idpError.resolution,
        terminal: discardToken,
      };
    }

    // Validate canonical envelope.
    if (
      !responseData ||
      typeof responseData !== 'object' ||
      responseData.success !== true ||
      !responseData.data
    ) {
      return { ok: false, code: 'UPSTREAM_SERVICE_ERROR', message: 'Non-compliant IDP envelope', status: 502, retryable: true };
    }

    const newAccess = responseData.data.access_token;
    const newRefresh = responseData.data.refresh_token;
    if (!newAccess) {
      return { ok: false, code: 'INTERNAL_SERVER_ERROR', message: 'Missing access token in IDP response', status: 500 };
    }

    let accessTokenExpires: number;
    let refreshTokenExpires: number | undefined;
    let decoded: any;
    try {
      const r = computeTokenExpiries({ accessToken: newAccess, refreshToken: newRefresh, preferJwt: true });
      decoded = r.decodedAccessToken;
      accessTokenExpires = r.accessTokenExpires;
      refreshTokenExpires = r.refreshTokenExpires;
    } catch {
      return { ok: false, code: 'INTERNAL_SERVER_ERROR', message: 'Failed to decode new tokens', status: 500 };
    }

    let amrClaims: string[] = [];
    if (decoded?.amr) {
      try {
        amrClaims = typeof decoded.amr === 'string' ? JSON.parse(decoded.amr) : decoded.amr;
      } catch {
        amrClaims = session.authenticationMethods || [];
      }
    } else {
      amrClaims = session.authenticationMethods || [];
    }
    const acrLevel = String(decoded?.acr || session.authenticationLevel || '1');
    const hasNewRefresh = typeof newRefresh === 'string' && newRefresh.length > 0;
    const newKid = extractKidFromToken(newAccess);

    await updateSession(sessionToken, {
      ...session,
      idpAccessToken: newAccess,
      idpAccessTokenExpires: accessTokenExpires,
      idpRefreshToken: hasNewRefresh ? newRefresh : session.idpRefreshToken,
      idpRefreshTokenExpires: hasNewRefresh ? refreshTokenExpires : session.idpRefreshTokenExpires,
      decodedAccessToken: decoded,
      bearerKeyId: newKid || session.bearerKeyId,
      authenticationMethods: amrClaims,
      authenticationLevel: acrLevel,
      mfaVerified: amrClaims.includes('mfa') || session.mfaVerified,
      mfaCompletedAt: decoded?.mfa_time ? parseInt(decoded.mfa_time) * 1000 : session.mfaCompletedAt,
      mfaExpiresAt: decoded?.mfa_expires ? parseInt(decoded.mfa_expires) * 1000 : session.mfaExpiresAt,
      mfaValidityHours: decoded?.mfa_validity_hours ? parseInt(decoded.mfa_validity_hours) : session.mfaValidityHours,
    });

    return { ok: true, accessToken: newAccess, accessTokenExpires, refreshed: true };
  } finally {
    if (weHoldLock) {
      await releaseRefreshLock(sessionToken, requestId, releaseVersion);
    }
  }
}
