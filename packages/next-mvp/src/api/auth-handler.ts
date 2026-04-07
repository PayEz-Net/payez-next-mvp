/**
 * Enhanced Auth Handler with Coordinated Token Refresh
 *
 * Provides a middleware wrapper that automatically handles token lifecycle:
 * - Checks token expiry before each request
 * - Automatically refreshes expired or near-expired tokens
 * - Uses Redis locks for coordinated refresh (prevents race conditions)
 * - Retries requests on 401 responses with fresh tokens
 *
 * Pattern ported from website-membership simple-api-handler.ts
 *
 * @version 2.1.0
 * @since auth-ready-v2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession as getBetterAuthSession } from '../server/auth';
import { nanoid } from 'nanoid';
import {
  getSession,
  updateSession,
  acquireRefreshLock,
  releaseRefreshLock,
  checkRefreshLock,
  type SessionData
} from '../lib/session-store';


export interface AuthContext {
  token: any;
  accessToken: string;
  userId: string;
  sessionToken: string;
  refreshToken?: string;
}

export interface AuthHandlerOptions {
  /** Whether authentication is required for this route (default: true) */
  requireAuth?: boolean;

  /** Automatically refresh expired or near-expired tokens (default: true) */
  autoRefresh?: boolean;

  /** Buffer time in seconds before token expiry to trigger refresh (default: 300 = 5 minutes) */
  refreshBuffer?: number;

  /** Retry request on 401 response after refreshing token (default: true) */
  retryOn401?: boolean;

  /** Maximum number of retry attempts on 401 (default: 1) */
  maxRetries?: number;

  /** IDP base URL for refresh requests */
  idpBaseUrl?: string;

  /** OAuth client ID */
  clientId?: string;
}

export type HandlerFunction = (
  req: NextRequest,
  context: any,
  auth: AuthContext
) => Promise<NextResponse | Response>;

interface RefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

/**
 * Creates an auth-aware handler with automatic token refresh
 *
 * @example
 * ```typescript
 * import { createAuthHandler } from '@payez/next-mvp/api';
 *
 * const handler = createAuthHandler({ requireAuth: true });
 *
 * export const GET = handler.handle(async (req, context, auth) => {
 *   // auth.accessToken is guaranteed to be fresh
 *   const response = await fetch('https://api.example.com/data', {
 *     headers: { 'Authorization': `Bearer ${auth.accessToken}` }
 *   });
 *   return NextResponse.json(await response.json());
 * });
 * ```
 */
export function createAuthHandler(options: AuthHandlerOptions = {}) {
  const {
    requireAuth = true,
    autoRefresh = true,
    refreshBuffer = 60, // 60 seconds - matches website-membership proven threshold
    retryOn401 = true,
    maxRetries = 1,
    idpBaseUrl = process.env.IDP_URL,
    clientId = process.env.CLIENT_ID || process.env.NEXT_PUBLIC_IDP_CLIENT_ID
  } = options;

  /**
   * Performs coordinated token refresh with Redis locking
   * This prevents multiple concurrent requests from all trying to refresh simultaneously
   */
  async function performCoordinatedRefresh(
    sessionToken: string,
    requestId: string
  ): Promise<RefreshResult> {
    // Check if refresh is already in progress
    const existingLock = await checkRefreshLock(sessionToken);

    if (existingLock) {
      console.info('[AUTH_HANDLER] Refresh already in progress, waiting...', {
        requestId,
        lockOwner: existingLock.acquiredBy,
        lockAge: Date.now() - existingLock.acquiredAt
      });

      // Wait for the refresh to complete
      const waitResult = await waitForRefreshCompletion(sessionToken, requestId, 10000);
      if (waitResult.success) {
        // Get the fresh token from session
        const freshSession = await getSession(sessionToken);
        if (freshSession?.accessToken) {
          return {
            success: true,
            accessToken: freshSession.accessToken,
            refreshToken: freshSession.refreshToken,
            expiresIn: freshSession.accessTokenExpires
              ? Math.floor((freshSession.accessTokenExpires - Date.now()) / 1000)
              : undefined
          };
        }
      }
      return { success: false, error: waitResult.reason || 'Wait for refresh failed' };
    }

    // Try to acquire the refresh lock
    const lockAcquired = await acquireRefreshLock(sessionToken, requestId, 5000);

    if (!lockAcquired) {
      // Another request grabbed the lock, wait for it
      console.info('[AUTH_HANDLER] Failed to acquire lock, waiting for other request', { requestId });
      const waitResult = await waitForRefreshCompletion(sessionToken, requestId, 10000);
      if (waitResult.success) {
        const freshSession = await getSession(sessionToken);
        if (freshSession?.accessToken) {
          return {
            success: true,
            accessToken: freshSession.accessToken,
            refreshToken: freshSession.refreshToken
          };
        }
      }
      return { success: false, error: waitResult.reason || 'Wait for refresh failed' };
    }

    try {
      // Double-check if tokens are still stale after acquiring lock
      const latestSession = await getSession(sessionToken);
      if (latestSession && !tokenNeedsRefresh(latestSession, refreshBuffer)) {
        console.info('[AUTH_HANDLER] Tokens already fresh after acquiring lock, skipping refresh', { requestId });
        return {
          success: true,
          accessToken: latestSession.accessToken,
          refreshToken: latestSession.refreshToken
        };
      }

      // Actually perform the refresh
      return await executeRefresh(sessionToken, latestSession);

    } finally {
      // Always release the lock
      await releaseRefreshLock(sessionToken, requestId);
    }
  }

  /**
   * Wait for an in-progress refresh to complete
   */
  async function waitForRefreshCompletion(
    sessionToken: string,
    requestId: string,
    maxWaitMs: number
  ): Promise<{ success: boolean; reason?: string }> {
    const startTime = Date.now();
    const pollInterval = 100;

    while (Date.now() - startTime < maxWaitMs) {
      const lockExists = await checkRefreshLock(sessionToken);

      if (!lockExists) {
        // Lock released, check if tokens are fresh
        const session = await getSession(sessionToken);
        if (session?.accessToken && !tokenNeedsRefresh(session, refreshBuffer)) {
          return { success: true };
        } else {
          return { success: false, reason: 'Lock released but tokens not fresh' };
        }
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return { success: false, reason: `Timeout waiting for refresh (${maxWaitMs}ms)` };
  }

  /**
   * Check if token needs refresh based on expiry and buffer
   */
  function tokenNeedsRefresh(session: SessionData, bufferSeconds: number): boolean {
    if (!session.accessToken) return true;

    const expires = session.accessTokenExpires || 0;
    const bufferMs = bufferSeconds * 1000;
    const timeUntilExpiry = expires - Date.now();

    return timeUntilExpiry <= bufferMs;
  }

  /**
   * Execute the actual token refresh against IDP
   */
  async function executeRefresh(
    sessionToken: string,
    currentSession: SessionData | null
  ): Promise<RefreshResult> {
    try {
      if (!idpBaseUrl || !clientId) {
        console.error('[AUTH_HANDLER] Missing IDP configuration for refresh');
        return { success: false, error: 'Missing IDP configuration' };
      }

      if (!currentSession) {
        console.error('[AUTH_HANDLER] No session found for refresh');
        return { success: false, error: 'No session found' };
      }

      if (!currentSession.refreshToken) {
        console.error('[AUTH_HANDLER] No refresh token available');
        return { success: false, error: 'No refresh token' };
      }

      // Extract authentication methods from session
      const authMethods = (currentSession as any).authMethods ||
                         ((currentSession as any).token?.amr ? JSON.parse((currentSession as any).token.amr) : ['pwd', 'mfa']);
      const authLevel = String((currentSession as any).authenticationLevel || (currentSession as any).token?.acr || '2');
      const twoFactorMethod = (currentSession as any).twoFactorMethod || 'authenticator';

      // Build refresh request body
      const refreshRequestBody: any = {
        refresh_token: currentSession.refreshToken,
        amr: authMethods,
        acr: authLevel
      };

      if ((currentSession as any).twoFactorComplete) {
        refreshRequestBody.two_factor_verified = true;
      }
      if (twoFactorMethod) {
        refreshRequestBody.two_factor_method = twoFactorMethod;
      }
      if ((currentSession as any).mfaCompletedAt) {
        refreshRequestBody.two_factor_completed_at = new Date((currentSession as any).mfaCompletedAt).toISOString();
      }

      console.info('[AUTH_HANDLER] Executing refresh against IDP', {
        sessionToken: sessionToken.substring(0, 8) + '...',
        hasRefreshToken: true
      });

      const response = await fetch(`${idpBaseUrl}/api/ExternalAuth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': clientId,
        },
        body: JSON.stringify(refreshRequestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('[AUTH_HANDLER] Refresh failed:', response.status, errorText);
        return { success: false, error: `Refresh failed: ${response.status}` };
      }

      const data = await response.json();

      if (data.success === false) {
        return { success: false, error: data.error?.message || data.message || 'Refresh failed' };
      }

      const tokenData = data.data || data;

      if (!tokenData.access_token) {
        console.error('[AUTH_HANDLER] No access token in refresh response');
        return { success: false, error: 'No access token received' };
      }

      // Update session with new tokens
      const updatedSession = {
        ...currentSession,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || currentSession.refreshToken,
        accessTokenExpires: tokenData.expires_in
          ? Date.now() + (tokenData.expires_in * 1000)
          : Date.now() + (3600 * 1000),
      };

      await updateSession(sessionToken, updatedSession);

      console.info('[AUTH_HANDLER] Token refresh successful', {
        newExpiry: new Date(updatedSession.accessTokenExpires).toISOString()
      });

      return {
        success: true,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
      };
    } catch (error) {
      console.error('[AUTH_HANDLER] Refresh exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Refresh failed' };
    }
  }

  /**
   * Checks if auth context token needs refresh based on expiry and buffer
   */
  function needsRefresh(auth: AuthContext): boolean {
    if (!autoRefresh) return false;
    // No refresh token = nothing to refresh with, skip entirely
    if (!auth.refreshToken) return false;

    // Check if we have token expiry information
    const token = auth.token as any;
    const expiresAt = token.accessTokenExpires || token.exp;

    if (!expiresAt) {
      // No expiry info, can't determine if refresh needed
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const expiryTime = typeof expiresAt === 'number' && expiresAt > 1000000000000
      ? Math.floor(expiresAt / 1000) // Convert milliseconds to seconds
      : expiresAt;

    // Check if token expires within the buffer period
    return (expiryTime - now) <= refreshBuffer;
  }

  /**
   * Generate a unique request ID for coordinated refresh
   */
  function generateRequestId(): string {
    return nanoid();
  }

  /**
   * Main handler wrapper
   */
  return {
    handle: (handler: HandlerFunction) => {
      return async (req: NextRequest, context: any = {}) => {
        // Extract session from Better Auth
        const betterAuthSession = await getBetterAuthSession(req);
        const token = betterAuthSession ? { ...betterAuthSession.user, ...betterAuthSession.session } as any : null;

        // Check if auth is required
        if (requireAuth && !betterAuthSession) {
          return NextResponse.json(
            { error: 'Authentication required', code: 'UNAUTHORIZED' },
            { status: 401 }
          );
        }

        // If no session and auth not required, call handler without auth context
        if (!betterAuthSession) {
          return handler(req, context, null as any);
        }

        // Validate client_slug (token confusion attack prevention)
        // SECURITY: Fail closed - require configuration to be explicitly set
        const expectedClientSlug = process.env.NEXT_PUBLIC_EXPECTED_CLIENT_SLUG;

        if (!expectedClientSlug) {
          console.error('[AUTH_HANDLER] SECURITY MISCONFIGURATION: NEXT_PUBLIC_EXPECTED_CLIENT_SLUG not set');
          return NextResponse.json(
            {
              error: 'Server configuration error',
              code: 'SECURITY_CONFIGURATION_MISSING'
            },
            { status: 500 }
          );
        }

        // Extract client_slug from token (normalize property name)
        const tokenClientSlug = (token as any).client_slug || (token as any).clientSlug;

        // SECURITY: Require client_slug claim in all tokens (no backward compat)
        if (!tokenClientSlug) {
          console.warn('[AUTH_HANDLER] Token missing required client_slug claim');
          return NextResponse.json(
            {
              error: 'Token missing required claim',
              code: 'TOKEN_MISSING_CLIENT_SLUG'
            },
            { status: 401 }
          );
        }

        // SECURITY: Case-insensitive comparison to avoid casing attacks
        if (tokenClientSlug.toLowerCase() !== expectedClientSlug.toLowerCase()) {
          // Log without exposing sensitive details
          console.warn('[AUTH_HANDLER] Token client mismatch detected');
          return NextResponse.json(
            {
              error: 'Token issued for different client',
              code: 'TOKEN_CLIENT_MISMATCH'
            },
            { status: 401 }
          );
        }

        // Build initial auth context
        let authContext: AuthContext = {
          token,
          accessToken: (token as any).accessToken || '',
          userId: betterAuthSession.user?.id || (token as any).userId || '',
          sessionToken: betterAuthSession.session?.token || '',
          refreshToken: (token as any).refreshToken,
        };

        // Check if token needs refresh
        if (needsRefresh(authContext) && authContext.refreshToken) {
          const requestId = generateRequestId();
          console.info('[AUTH_HANDLER] Token near expiry, initiating coordinated refresh', {
            requestId,
            sessionToken: authContext.sessionToken.substring(0, 8) + '...'
          });

          const refreshResult = await performCoordinatedRefresh(
            authContext.sessionToken,
            requestId
          );

          if (refreshResult.success && refreshResult.accessToken) {
            // Update auth context with fresh token
            authContext.accessToken = refreshResult.accessToken;
            if (refreshResult.refreshToken) {
              authContext.refreshToken = refreshResult.refreshToken;
            }

            // Update token object for future checks
            (authContext.token as any).accessToken = refreshResult.accessToken;
            if (refreshResult.expiresIn) {
              (authContext.token as any).accessTokenExpires = Date.now() + (refreshResult.expiresIn * 1000);
            }

            console.info('[AUTH_HANDLER] Coordinated refresh successful', { requestId });
          } else {
            console.warn('[AUTH_HANDLER] Failed to refresh token:', refreshResult.error);
            // Continue with potentially expired token - handler may still succeed
          }
        }

        // Attach auth context to request for downstream use (following existing pattern)
        // IMPORTANT: Set this ONCE before the retry loop to avoid overwriting with stale data
        (req as any).__authContext = {
          accessToken: authContext.accessToken,
          userId: authContext.userId,
          sessionToken: authContext.sessionToken,
        };

        // Call the actual handler
        let response: NextResponse | Response;
        let retryCount = 0;

        while (retryCount <= maxRetries) {
          try {
            response = await handler(req, context, authContext);

            // Check if we got a 401 and should retry
            if (
              response.status === 401 &&
              retryOn401 &&
              retryCount < maxRetries &&
              authContext.refreshToken
            ) {
              const retryRequestId = generateRequestId();
              console.info('[AUTH_HANDLER] Got 401, attempting coordinated refresh and retry', { retryRequestId });

              const refreshResult = await performCoordinatedRefresh(
                authContext.sessionToken,
                retryRequestId
              );

              if (refreshResult.success && refreshResult.accessToken) {
                console.info('[AUTH_HANDLER] Refresh succeeded, updating tokens', { retryRequestId });

                // Update auth context with fresh token
                authContext.accessToken = refreshResult.accessToken;
                if (refreshResult.refreshToken) {
                  authContext.refreshToken = refreshResult.refreshToken;
                }

                // Update request context
                (req as any).__authContext.accessToken = refreshResult.accessToken;

                console.info('[AUTH_HANDLER] Updated req.__authContext with new token, retrying request', { retryRequestId });

                retryCount++;
                continue; // Retry the request
              } else {
                console.warn('[AUTH_HANDLER] Refresh failed on 401 retry:', refreshResult.error);
                break; // Don't retry if refresh failed
              }
            }

            // Success or non-401 error - return response
            break;
          } catch (error) {
            // Handler threw an error
            console.error('[AUTH_HANDLER] Handler error:', error);
            return NextResponse.json(
              {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
              },
              { status: 500 }
            );
          }
        }

        return response!;
      };
    }
  };
}

/**
 * Default export for convenience
 */
export default createAuthHandler;