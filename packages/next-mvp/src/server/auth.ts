/**
 * Server-side auth utilities for Better Auth.
 *
 * All server-side auth flows go through the Better Auth instance returned by
 * getAuthInstance(); use getSession(req) for the request-scoped session.
 */

import 'server-only';
import { createBetterAuthInstance } from '../auth/better-auth';
import { getIDPClientConfig } from '../lib/idp-client-config';
import {
  getSession as getRedisSession,
  getBetterAuthSession as getBetterAuthRedisSession,
  type SessionData,
} from '../lib/session-store';

let authInstance: ReturnType<typeof createBetterAuthInstance> | null = null;
let authInitPromise: Promise<ReturnType<typeof createBetterAuthInstance>> | null = null;

export type IdpTokenResult =
  | { success: true; accessToken: string; sessionData: SessionData }
  | { success: false; error: 'NO_SESSION' | 'NO_TOKEN'; terminal: true };

function buildSessionDataFromAuthSession(session: any): SessionData | null {
  const user = session?.user;
  if (!user?.id && !user?.email) {
    return null;
  }

  const expiresAt = session?.session?.expiresAt
    ? new Date(session.session.expiresAt).getTime()
    : Date.now() + 24 * 60 * 60 * 1000;

  return {
    userId: user.userId || user.id || '',
    email: user.email || '',
    name: user.name || undefined,
    image: user.image || undefined,
    roles: Array.isArray(user.roles) ? user.roles : [],
    idpAccessToken: user.idpAccessToken,
    idpRefreshToken: user.idpRefreshToken,
    idpAccessTokenExpires: user.idpAccessTokenExpires || expiresAt,
    mfaVerified: user.mfaVerified ?? user.twoFactorSessionVerified ?? false,
    oauthProvider: user.oauthProvider,
    idpClientId: user.idpClientId,
    merchantId: user.merchantId,
  };
}

function attachSessionData(session: any, sessionData: SessionData | null, sessionToken?: string) {
  if (!sessionData) {
    return session;
  }

  const enrichedSessionData = {
    ...sessionData,
    ...(sessionToken ? { sessionToken } : {}),
  };

  (session as any).sessionData = enrichedSessionData;

  if (session?.user) {
    const user = session.user as any;
    user.userId = enrichedSessionData.userId || user.userId;
    user.email = enrichedSessionData.email || user.email;
    user.name = enrichedSessionData.name || user.name;
    user.image = enrichedSessionData.image || user.image;
    user.roles = enrichedSessionData.roles || user.roles || [];
    user.idpAccessToken = enrichedSessionData.idpAccessToken;
    user.idpRefreshToken = enrichedSessionData.idpRefreshToken;
    user.idpAccessTokenExpires = enrichedSessionData.idpAccessTokenExpires;
    user.mfaVerified = enrichedSessionData.mfaVerified;
    user.twoFactorSessionVerified =
      enrichedSessionData.mfaVerified ?? user.twoFactorSessionVerified;
    user.oauthProvider = enrichedSessionData.oauthProvider || user.oauthProvider;
    user.idpClientId = enrichedSessionData.idpClientId || user.idpClientId;
    user.merchantId = enrichedSessionData.merchantId || user.merchantId;
  }

  return session;
}

/**
 * Get the initialized Better Auth instance (singleton).
 */
export async function getAuthInstance() {
  if (authInstance) return authInstance;
  if (!authInitPromise) {
    authInitPromise = getIDPClientConfig(true).then(config => {
      authInstance = createBetterAuthInstance(config);
      return authInstance;
    });
  }
  return authInitPromise;
}

/**
 * Get the current session from a request.
 * Replaces getToken() and getServerSession().
 *
 * Returns the session object or null if not authenticated.
 */
export async function getSession(request?: Request): Promise<any> {
  const auth = await getAuthInstance();
  if (!request) return null;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.session?.token || !session?.user) return session;

    const sessionToken = session.session.token as string;
    let sessionData: SessionData | null = null;

    // Prefer the app's normalized Redis session. Fall back to Better Auth's
    // secondary storage record, then finally to whatever Better Auth already
    // put on the request session object.
    try {
      sessionData = await getRedisSession(sessionToken);
      if (!sessionData) {
        sessionData = await getBetterAuthRedisSession(sessionToken);
      }
    } catch { /* Redis unavailable */ }

    if (!sessionData) {
      sessionData = buildSessionDataFromAuthSession(session);
    }

    return attachSessionData(session, sessionData, sessionToken);
  } catch {
    return null;
  }
}

/**
 * Get normalized session data for the current request.
 *
 * This prefers the app's Redis session because it carries the canonical
 * IDP token, roles, and tenant-specific user identity used by app routes.
 */
export async function getSessionData(request?: Request): Promise<SessionData | null> {
  const session = await getSession(request);
  const sessionData =
    ((session as any)?.sessionData as SessionData | undefined) ||
    buildSessionDataFromAuthSession(session);

  if (!sessionData) {
    return null;
  }

  const sessionToken = session?.session?.token as string | undefined;
  return sessionToken
    ? { ...sessionData, sessionToken }
    : sessionData;
}

/**
 * Get the current request's IDP access token without triggering a refresh.
 *
 * Use this for routes that only need the currently-issued bearer token and
 * should fail closed instead of performing token lifecycle work. For backend
 * proxy routes that forward the token to a downstream API, prefer
 * `getFreshIdpToken` — it preflights expiry and refreshes single-flight, so
 * the proxy never sends a credential it already knows is invalid.
 */
export async function getIdpToken(request?: Request): Promise<IdpTokenResult> {
  const sessionData = await getSessionData(request);
  if (!sessionData) {
    return { success: false, error: 'NO_SESSION', terminal: true };
  }

  const accessToken = sessionData.idpAccessToken || (sessionData as any).accessToken;
  if (!accessToken) {
    return { success: false, error: 'NO_TOKEN', terminal: true };
  }

  return {
    success: true,
    accessToken,
    sessionData,
  };
}

export type FreshIdpTokenResult =
  | { success: true; accessToken: string; sessionData: SessionData; refreshed: boolean }
  | {
      success: false;
      error: string;
      status: number;
      terminal?: boolean;
      discardToken?: boolean;
      retryable?: boolean;
      resolution?: string;
    };

export interface FreshIdpTokenConfig {
  idpBaseUrl: string;
  clientId: string;
  refreshEndpoint?: string;
  /** Refresh if the access token is within this many ms of expiry. Default 60_000. */
  safetyWindowMs?: number;
}

/**
 * Get the current request's IDP access token, preflight-refreshing if it is
 * expired or within the safety window. Single-flight via Redis lock, so
 * concurrent calls on the same session share one IDP round-trip and one
 * single-use refresh-token consumption.
 *
 * Use this in proxy routes. The returned `accessToken` is safe to forward to
 * a downstream API without expecting a 401. If `success` is false, surface a
 * 401/redirect — there is no recoverable token for this session.
 */
export async function getFreshIdpToken(
  request: Request | undefined,
  config: FreshIdpTokenConfig
): Promise<FreshIdpTokenResult> {
  const session = await getSession(request);
  const sessionToken = session?.session?.token as string | undefined;
  if (!sessionToken) {
    return { success: false, error: 'NO_SESSION', status: 401, terminal: true };
  }

  const { ensureFreshAccessToken } = await import('../lib/ensure-fresh-access-token');
  const result = await ensureFreshAccessToken(
    sessionToken,
    {
      idpBaseUrl: config.idpBaseUrl,
      clientId: config.clientId,
      refreshEndpoint: config.refreshEndpoint,
    },
    {
      safetyWindowMs: config.safetyWindowMs,
      requestId: request?.headers?.get('x-request-id') ?? undefined,
    }
  );

  if (!result.ok) {
    return {
      success: false,
      error: result.code,
      status: result.status,
      terminal: result.terminal,
      discardToken: result.discardToken,
      retryable: result.retryable,
      resolution: result.resolution,
    };
  }

  const sessionData = await getRedisSession(sessionToken);
  if (!sessionData) {
    return { success: false, error: 'NO_SESSION', status: 401, terminal: true };
  }

  return {
    success: true,
    accessToken: result.accessToken,
    sessionData,
    refreshed: result.refreshed,
  };
}

/**
 * Get the current session, throwing if not authenticated.
 * Use in API handlers that require auth.
 */
export async function requireSession(request: Request) {
  const session = await getSession(request);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
