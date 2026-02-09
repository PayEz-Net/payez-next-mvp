/**
 * Session Callback
 *
 * Builds the NextAuth session from Redis session data.
 * The JWT only contains redisSessionId - all user data comes from Redis.
 *
 * FLOW:
 * 1. Extract redisSessionId from JWT token
 * 2. Fetch session data from Redis
 * 3. Build NextAuth session with user info
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */

import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { getSession } from '../../lib/session-store';
// NOTE: Using SessionData from models until Phase 3 normalizes names
import type { SessionData } from '../../models/SessionModel';

// ============================================================================
// TYPES
// ============================================================================

interface SessionCallbackParams {
  session: Session;
  token: JWT & {
    /** Redis session ID - the key to look up session data */
    redisSessionId?: string;
    error?: string;
  };
}

interface AppSessionUser {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  // MFA status
  twoFactorSessionVerified: boolean;
  requiresTwoFactor: boolean;
  // MFA claims from IDP token
  authenticationMethods?: string[];
  authenticationLevel?: string;
  mfaCompletedAt?: number;
  mfaExpiresAt?: number;
  mfaValidityHours?: number;
  // OAuth provider info
  oauthProvider?: string;
  // Multi-tenant IDP info
  idpClientId?: string;
  merchantId?: string;
  // JWT signing key (from header, NOT client_id from payload)
  bearerKeyId?: string;
}

interface AppSession extends Omit<Session, 'user'> {
  user: AppSessionUser;
  sessionToken?: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  error?: string;
}

// ============================================================================
// SESSION CALLBACK
// ============================================================================

/**
 * Session callback - builds NextAuth session from Redis.
 *
 * This callback is called whenever getSession() or useSession() is used.
 * It fetches the full session from Redis and exposes it to the client.
 *
 * @param params - Session callback parameters from NextAuth
 * @returns AppSession with user data from Redis
 */
export async function sessionCallback({
  session,
  token,
}: SessionCallbackParams): Promise<AppSession> {
  // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
  const redisSessionId = (token as any)?.sessionToken || token?.redisSessionId;

  console.log('[SESSION_CALLBACK] Entry:', {
    hasToken: !!token,
    redisSessionId: redisSessionId || 'MISSING',
    tokenError: token?.error || 'none',
    tokenKeys: token ? Object.keys(token) : [],
  });

  // -------------------------------------------------------------------------
  // Handle Token Errors
  // -------------------------------------------------------------------------

  if (token.error) {
    console.log('[SESSION_CALLBACK] Token has error:', token.error);
    // Special case: MFA expired - return partial session for step-up flow
    if (token.error === 'MfaExpired' && redisSessionId) {
      const sessionData = await safeGetSession(redisSessionId as string);
      if (sessionData) {
        return {
          ...session,
          user: {
            id: sessionData.userId,
            email: sessionData.email,
            name: sessionData.name,
            roles: sessionData.roles || [],
            twoFactorSessionVerified: false,
            requiresTwoFactor: true,
            authenticationMethods: sessionData.authenticationMethods,
            authenticationLevel: sessionData.authenticationLevel,
            mfaExpiresAt: sessionData.mfaExpiresAt,
          },
          sessionToken: redisSessionId as string,
          accessToken: sessionData.idpAccessToken,
          refreshToken: sessionData.idpRefreshToken,
          error: 'MfaExpired',
        };
      }
    }

    // For other errors, try to recover session data if possible
    if (redisSessionId) {
      const sessionData = await safeGetSession(redisSessionId as string);
      if (sessionData) {
        return buildSessionFromRedis(session, redisSessionId as string, sessionData);
      }
    }

    // No recovery possible - return error session
    return buildErrorSession(session, token.error);
  }

  // -------------------------------------------------------------------------
  // Validate Session Token
  // -------------------------------------------------------------------------

  if (!redisSessionId) {
    console.log('[SESSION_CALLBACK] No redisSessionId - returning error session');
    return buildErrorSession(session, 'NoSessionToken');
  }

  // -------------------------------------------------------------------------
  // Fetch Session from Redis
  // -------------------------------------------------------------------------

  const sessionData = await safeGetSession(redisSessionId as string);

  if (!sessionData) {
    console.log('[SESSION_CALLBACK] Redis session not found for:', redisSessionId);
    return buildErrorSession(session, 'SessionNotFound');
  }

  console.log('[SESSION_CALLBACK] Redis session found:', {
    userId: sessionData.userId,
    email: sessionData.email,
    roles: sessionData.roles,
    hasAccessToken: !!sessionData.idpAccessToken,
  });

  const result = buildSessionFromRedis(session, redisSessionId as string, sessionData);
  console.log('[SESSION_CALLBACK] Returning:', {
    userId: result.user.id,
    roles: result.user.roles,
    hasAccessToken: !!result.accessToken,
  });
  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely fetch session from Redis, returning null on error.
 */
async function safeGetSession(
  sessionId: string
): Promise<SessionData | null> {
  try {
    return await getSession(sessionId);
  } catch {
    return null;
  }
}

/**
 * Build complete session from Redis data.
 * Uses normalized field names from SessionData.
 */
function buildSessionFromRedis(
  session: Session,
  sessionId: string,
  data: SessionData
): AppSession {
  return {
    ...session,
    user: {
      id: data.userId,
      email: data.email,
      name: data.name,
      roles: data.roles || [],
      // MFA state (normalized field name)
      twoFactorSessionVerified: data.mfaVerified,
      requiresTwoFactor: !data.mfaVerified,
      authenticationMethods: data.authenticationMethods,
      authenticationLevel: data.authenticationLevel,
      mfaCompletedAt: data.mfaCompletedAt,
      mfaExpiresAt: data.mfaExpiresAt,
      mfaValidityHours: data.mfaValidityHours,
      oauthProvider: data.oauthProvider,
      idpClientId: data.idpClientId,
      merchantId: data.merchantId,
      // Bearer key ID from JWT header (may be undefined for old sessions)
      bearerKeyId: data.bearerKeyId,
    },
    sessionToken: sessionId,
    // IDP tokens (normalized field names)
    accessToken: data.idpAccessToken,
    refreshToken: data.idpRefreshToken,
    accessTokenExpires: data.idpAccessTokenExpires,
  };
}

/**
 * Build error session with empty user.
 */
function buildErrorSession(session: Session, error: string): AppSession {
  return {
    ...session,
    user: {
      id: '',
      email: '',
      roles: [],
      twoFactorSessionVerified: false,
      requiresTwoFactor: false,
    },
    error,
  };
}
