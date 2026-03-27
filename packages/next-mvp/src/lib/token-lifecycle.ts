/**
 * Token Lifecycle Management for @payez/next-mvp
 *
 * Ensures tokens are fresh before making API calls.
 * Checks expiration and triggers refresh if needed.
 *
 * Pattern: Check first, refresh if needed, fail gracefully if refresh fails.
 *
 * HANDLES CONCURRENT REFRESH: When multiple API calls arrive simultaneously
 * with expired tokens, only one will actually perform the refresh. Others
 * receive 409 (conflict) and wait for the refresh to complete, then use
 * the freshly refreshed tokens.
 *
 * REQUIRED: Your app must expose the refresh route:
 * ```typescript
 * // app/api/auth/refresh/route.ts
 * export { POST } from '@payez/next-mvp/routes/auth/refresh';
 * ```
 *
 * @version 2.0.0
 */

import { NextRequest } from 'next/server';
import { getSession as getRedisSession, SessionData } from './session-store';
import { getSession as getBetterAuthSession } from '../server/auth';

// 5 minute threshold for "needs refresh" - matches refresh handler pattern
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

// Concurrent refresh handling configuration
const CONCURRENT_REFRESH_POLL_INTERVAL_MS = 200; // How often to poll session during concurrent refresh
const CONCURRENT_REFRESH_MAX_WAIT_MS = 8000;     // Max time to wait for concurrent refresh to complete
const REFRESH_RETRY_DELAY_MS = 500;               // Delay before retrying after failed concurrent refresh
const KEY_PROPAGATION_DELAY_MS = 150;             // Delay after refresh to allow JWKS cache updates in downstream services

export interface TokenResult {
  success: true;
  accessToken: string;
  sessionData: SessionData;
}

export interface TokenError {
  success: false;
  error: 'NO_SESSION' | 'NO_TOKEN' | 'EXPIRED' | 'REFRESH_FAILED' | 'SESSION_EXPIRED_NO_REFRESH';
  message: string;
  terminal?: boolean;  // If true, don't retry - redirect to login
}

export type EnsureFreshTokenResult = TokenResult | TokenError;

/**
 * Check if token needs refresh based on expiration time
 */
function needsRefresh(accessTokenExpires: number | undefined): boolean {
  if (!accessTokenExpires) return true;
  const timeUntilExpiry = accessTokenExpires - Date.now();
  return timeUntilExpiry <= REFRESH_THRESHOLD_MS;
}

/**
 * Helper to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for a concurrent refresh to complete by polling the session.
 * Returns true if session becomes fresh, false if timeout reached.
 */
async function waitForConcurrentRefresh(
  sessionToken: string,
  maxWaitMs: number = CONCURRENT_REFRESH_MAX_WAIT_MS
): Promise<{ success: boolean; sessionData?: SessionData }> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    await delay(CONCURRENT_REFRESH_POLL_INTERVAL_MS);

    const sessionData = await getRedisSession(sessionToken);

    if (!sessionData) {
      return { success: false };
    }

    // Check if token is now fresh
    if (!needsRefresh(sessionData.idpAccessTokenExpires)) {
      return { success: true, sessionData };
    }

    // Check if session has a new access token (even if still within threshold)
    if (sessionData.idpAccessToken && sessionData.idpAccessTokenExpires &&
        sessionData.idpAccessTokenExpires > Date.now()) {
      return { success: true, sessionData };
    }
  }

  return { success: false };
}

/**
 * Get the internal API URL for making internal service calls.
 * INTERNAL_API_URL is REQUIRED - no fallbacks.
 */
function getInternalApiUrl(request: NextRequest): string {
  const internalUrl = process.env.INTERNAL_API_URL;
  if (!internalUrl) {
    throw new Error(
      '[INTERNAL_API_URL] FATAL: INTERNAL_API_URL environment variable is REQUIRED. ' +
      'Set it to this app\'s internal K8s service URL (e.g., http://myapp.namespace.svc.cluster.local:80) ' +
      'or http://localhost:3000 for local development.'
    );
  }
  return internalUrl;
}

/**
 * Result of triggerRefresh - includes terminal flag for unrecoverable errors
 */
interface RefreshResult {
  success: boolean;
  terminal?: boolean;  // If true, session is dead - don't retry, redirect to login
  code?: string;       // Error code from refresh endpoint
}

/**
 * Trigger a token refresh via the refresh API endpoint.
 *
 * HANDLES CONCURRENT REFRESH (409):
 * When another request is already refreshing the token, this function
 * waits for that refresh to complete instead of failing immediately.
 * This prevents race conditions where multiple parallel API calls
 * could cause unnecessary refresh failures.
 *
 * TERMINAL STATES:
 * Returns { success: false, terminal: true } when the session cannot be
 * recovered (e.g., no refresh token). Callers should redirect to login.
 */
async function triggerRefresh(
  request: NextRequest,
  sessionToken: string,
  retryCount: number = 0
): Promise<RefreshResult> {
  const maxRetries = 2;

  try {
    const baseUrl = getInternalApiUrl(request);
    const requestId = `refresh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
        'X-Session-Token': sessionToken,
        'X-Request-Id': requestId,
      },
    });

    // Handle 409 Conflict - another refresh is in progress
    if (response.status === 409) {
      // Wait for the concurrent refresh to complete
      const waitResult = await waitForConcurrentRefresh(sessionToken);

      if (waitResult.success) {
        return { success: true };
      }

      // Concurrent refresh didn't produce a fresh token - try again if we have retries left
      if (retryCount < maxRetries) {
        await delay(REFRESH_RETRY_DELAY_MS);
        return triggerRefresh(request, sessionToken, retryCount + 1);
      }

      return { success: false };
    }

    // Handle other non-OK responses
    if (!response.ok) {
      // Parse response body to check for terminal errors
      let responseData: any = {};
      try {
        responseData = await response.json();
      } catch {
        // Ignore parse errors
      }

      // Log the failure for debugging
      console.warn('[TOKEN_LIFECYCLE] Refresh request failed:', {
        status: response.status,
        statusText: response.statusText,
        baseUrl,
        retryCount,
        code: responseData.code,
        terminal: responseData.terminal
      });

      // CHECK FOR TERMINAL STATE: No refresh token = session is dead
      // Don't retry - user must re-authenticate
      if (responseData.code === 'NO_REFRESH_TOKEN' || responseData.terminal === true) {
        console.error('[TOKEN_LIFECYCLE] TERMINAL: Session has no refresh token - user must re-login');
        return { success: false, terminal: true, code: responseData.code };
      }

      // For other 401s, check if maybe session was refreshed by another request
      if (response.status === 401 && retryCount < maxRetries) {
        await delay(REFRESH_RETRY_DELAY_MS);

        const sessionData = await getRedisSession(sessionToken);
        if (sessionData && !needsRefresh(sessionData.idpAccessTokenExpires)) {
          return { success: true };
        }
      }

      return { success: false, code: responseData.code };
    }

    const result = await response.json();
    const success = result.refreshed === true || result.reason === 'already_fresh';
    return { success };
  } catch (error) {
    // Log network errors for debugging
    console.error('[TOKEN_LIFECYCLE] Refresh network error:', {
      error: error instanceof Error ? error.message : String(error),
      retryCount
    });

    // On network error, check if maybe another request refreshed the token
    if (retryCount < maxRetries) {
      await delay(REFRESH_RETRY_DELAY_MS);
      const sessionData = await getRedisSession(sessionToken);
      if (sessionData && !needsRefresh(sessionData.idpAccessTokenExpires)) {
        return { success: true };
      }
    }

    return { success: false };
  }
}

/**
 * Ensures we have a fresh access token before making API calls.
 *
 * This utility checks token expiration and triggers a refresh if needed,
 * preventing 401 errors from expired tokens being sent to downstream APIs.
 *
 * @param request - The incoming NextRequest
 * @returns TokenResult with accessToken and sessionData, or TokenError
 *
 * @example
 * ```typescript
 * import { ensureFreshToken } from '@payez/next-mvp/lib/token-lifecycle';
 *
 * export async function GET(request: NextRequest) {
 *   const tokenResult = await ensureFreshToken(request);
 *   if (!tokenResult.success) {
 *     return NextResponse.json({ error: tokenResult.error }, { status: 401 });
 *   }
 *
 *   // Use tokenResult.accessToken for downstream API calls
 *   const response = await fetch('https://api.example.com/data', {
 *     headers: { 'Authorization': `Bearer ${tokenResult.accessToken}` }
 *   });
 * }
 * ```
 */
export async function ensureFreshToken(
  request: NextRequest
): Promise<EnsureFreshTokenResult> {
  try {
    // 1. Get Better Auth session to extract sessionToken
    const betterAuthSession = await getBetterAuthSession(request);

    if (!betterAuthSession?.session?.token) {
      console.warn('[TOKEN_LIFECYCLE] NO_SESSION - Better Auth session not found');
      return {
        success: false,
        error: 'NO_SESSION',
        message: 'No session available',
      };
    }

    const sessionToken = betterAuthSession.session.token;

    // 2. Get session data from Redis
    let sessionData = await getRedisSession(sessionToken);

    if (!sessionData) {
      return {
        success: false,
        error: 'NO_SESSION',
        message: 'Session expired or not found',
      };
    }

    // DEBUG: Log session data before refresh check
    const tokenExpiresStr = sessionData.idpAccessTokenExpires
      ? new Date(sessionData.idpAccessTokenExpires).toISOString()
      : 'undefined';
    let needsRefreshNow = needsRefresh(sessionData.idpAccessTokenExpires);

    // VALIDATION: Check if the actual JWT token's exp matches what Redis claims
    // This catches cases where accessTokenExpires was updated but accessToken wasn't
    let tokenMismatch = false;
    if (sessionData.idpAccessToken && !needsRefreshNow) {
      try {
        const tokenParts = sessionData.idpAccessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());
          const jwtExpMs = (payload.exp || 0) * 1000;
          const now = Date.now();

          // If the JWT is actually expired, force a refresh regardless of what Redis says
          if (jwtExpMs < now) {
            console.warn('[TOKEN_LIFECYCLE] Token mismatch detected! JWT expired but Redis claims valid', {
              jwtExp: new Date(jwtExpMs).toISOString(),
              redisAccessTokenExpires: tokenExpiresStr,
              now: new Date(now).toISOString(),
              mismatchMs: sessionData.idpAccessTokenExpires ? sessionData.idpAccessTokenExpires - jwtExpMs : 'N/A'
            });
            needsRefreshNow = true;
            tokenMismatch = true;
          }
        }
      } catch (e) {
        // If we can't decode, proceed with normal logic
        console.warn('[TOKEN_LIFECYCLE] Could not validate JWT exp claim:', e);
      }
    }

    console.log('[TOKEN_LIFECYCLE] ensureFreshToken check:', {
      sessionToken: sessionToken.substring(0, 8) + '...',
      accessTokenExpires: tokenExpiresStr,
      now: new Date().toISOString(),
      needsRefresh: needsRefreshNow,
      tokenMismatch,
      hasRefreshToken: !!sessionData.idpRefreshToken
    });

    // 3. Check if token needs refresh
    if (needsRefreshNow) {
      // 4. Trigger refresh
      console.log('[TOKEN_LIFECYCLE] Triggering refresh...');
      const refreshResult = await triggerRefresh(request, sessionToken);

      if (!refreshResult.success) {
        // Check for terminal state - session cannot be recovered
        if (refreshResult.terminal) {
          console.error('[TOKEN_LIFECYCLE] TERMINAL: Session expired with no refresh token - redirect to login');
          return {
            success: false,
            error: 'SESSION_EXPIRED_NO_REFRESH',
            message: 'Session expired. Please sign in again.',
            terminal: true,
          };
        }

        console.warn('[TOKEN_LIFECYCLE] Refresh failed');
        return {
          success: false,
          error: 'REFRESH_FAILED',
          message: 'Token refresh failed',
        };
      }

      // 5. Re-fetch session data after refresh
      sessionData = await getRedisSession(sessionToken);
      console.log('[TOKEN_LIFECYCLE] After refresh:', {
        hasAccessToken: !!sessionData?.idpAccessToken,
        newAccessTokenExpires: sessionData?.idpAccessTokenExpires
          ? new Date(sessionData.idpAccessTokenExpires).toISOString()
          : 'undefined'
      });

      if (!sessionData?.idpAccessToken) {
        return {
          success: false,
          error: 'REFRESH_FAILED',
          message: 'No access token after refresh',
        };
      }

      // 5.5. Key propagation delay - allow downstream services (like Vibe) to cache new JWKS
      // This is critical when IDP rotates signing keys - the new token's kid may not be
      // immediately available in Vibe's JWKS cache
      await delay(KEY_PROPAGATION_DELAY_MS);
    }

    // 6. Validate we have a token
    if (!sessionData.idpAccessToken) {
      return {
        success: false,
        error: 'NO_TOKEN',
        message: 'No access token available',
      };
    }

    return {
      success: true,
      accessToken: sessionData.idpAccessToken,
      sessionData,
    };
  } catch (error) {
    console.error('[TOKEN_LIFECYCLE] Error:', error);
    return {
      success: false,
      error: 'NO_SESSION',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get authorization header from fresh token.
 * Convenience wrapper for API routes.
 *
 * @param request - The incoming NextRequest
 * @returns Authorization header string or null if token unavailable
 *
 * @example
 * ```typescript
 * const authHeader = await getFreshAuthHeader(request);
 * if (!authHeader) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 */
export async function getFreshAuthHeader(
  request: NextRequest
): Promise<string | null> {
  const result = await ensureFreshToken(request);
  if (!result.success) {
    return null;
  }
  return `Bearer ${result.accessToken}`;
}
