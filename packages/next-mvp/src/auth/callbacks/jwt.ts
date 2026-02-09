/**
 * JWT Callback
 *
 * Minimal token strategy - only store redisSessionId in JWT.
 * All session data lives in Redis, not in the browser cookie.
 *
 * HANDLES:
 * - Initial sign-in (credentials): Store redisSessionId from authorize()
 * - Initial sign-in (OAuth): Register with IDP, create session, store redisSessionId
 * - Subsequent requests: Validate session exists, return token
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */

import type { JWT } from 'next-auth/jwt';
import type { User, Account } from 'next-auth';
import { createHmac } from 'crypto';
import { createSession, getSession } from '../../lib/session-store';
import { getIDPClientConfig } from '../../lib/idp-client-config';
import { idpOAuthCallback } from '../utils/idp-client';
import {
  decodeIdpAccessToken,
  extractAmrFromToken,
  expClaimToMs,
  extractKidFromToken,
} from '../utils/token-utils';
// NOTE: Using any for sessionData until Phase 3 normalizes types

// ============================================================================
// VIBE ROLE FETCHING
// ============================================================================

/**
 * Generate HMAC signature for Vibe API request.
 */
function generateVibeSignature(
  endpoint: string,
  clientId: string,
  timestamp: number
): string {
  const signingKey = process.env.VIBE_SIGNING_KEY;
  if (!signingKey) {
    return '';
  }

  const stringToSign = `${timestamp}|GET|${endpoint}|${clientId}`;
  return createHmac('sha256', Buffer.from(signingKey, 'base64'))
    .update(stringToSign)
    .digest('base64');
}

/**
 * Fetch user's roles from Vibe API.
 * Returns empty array on failure (non-blocking).
 * Uses HMAC signature for authentication when signing key is configured.
 */
async function fetchVibeRoles(userId: string, clientId: string): Promise<string[]> {
  const vibeApiUrl = process.env.VIBE_API_URL;
  if (!vibeApiUrl) {
    return [];
  }

  const endpoint = `/api/v1/users/${userId}/roles`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateVibeSignature(endpoint, clientId, timestamp);

  // Build headers with optional signature
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-Client-Id': clientId,
    'X-Vibe-Client-Id': clientId,
  };

  if (signature) {
    headers['X-Vibe-Timestamp'] = String(timestamp);
    headers['X-Vibe-Signature'] = signature;
  }

  try {
    const response = await fetch(
      `${vibeApiUrl}${endpoint}`,
      {
        method: 'GET',
        headers,
        // 2 second timeout
        signal: AbortSignal.timeout(2000),
      }
    );

    if (!response.ok) {
      console.warn('[JWT_CALLBACK] Failed to fetch Vibe roles:', response.status);
      return [];
    }

    const data = await response.json();
    const roles = data.roles?.map((r: any) => r.role_name || r) || [];
    console.log('[JWT_CALLBACK] Fetched Vibe roles:', roles);
    return roles;
  } catch (error) {
    console.warn('[JWT_CALLBACK] Error fetching Vibe roles (continuing with IDP roles only):', error);
    return [];
  }
}

/**
 * Merge IDP roles with Vibe roles, deduplicating.
 */
function mergeRoles(idpRoles: string[], vibeRoles: string[]): string[] {
  return [...new Set([...idpRoles, ...vibeRoles])];
}

// ============================================================================
// TYPES
// ============================================================================

interface JwtCallbackParams {
  token: JWT;
  user?: User | any;
  account?: Account | null;
  trigger?: 'signIn' | 'signUp' | 'update';
}

interface JwtCallbackResult extends JWT {
  /** Redis session ID - the key to look up session data */
  redisSessionId?: string;
  /** User ID from IDP */
  sub: string;
  /** Error code if session validation failed */
  error?: string;
  /** Flag for OAuth users who need immediate 2FA redirect */
  requiresTwoFactorRedirect?: boolean;
}

// ============================================================================
// JWT CALLBACK
// ============================================================================

/**
 * JWT callback - builds the NextAuth JWT token.
 *
 * MINIMAL TOKEN STRATEGY:
 * - Only store redisSessionId (key to Redis session)
 * - All tokens and user data live in Redis
 * - Browser cookie stays small and secure
 *
 * @param params - JWT callback parameters from NextAuth
 * @returns JWT payload to store in browser cookie
 */
export async function jwtCallback({
  token,
  user,
  account,
  trigger,
}: JwtCallbackParams): Promise<JwtCallbackResult> {
  console.log('[JWT_CALLBACK] Called with:', {
    trigger,
    hasAccount: !!account,
    provider: account?.provider,
    hasUser: !!user,
    userEmail: user?.email,
    existingRedisSessionId: token?.redisSessionId ? 'yes' : 'no',
  });

  // -------------------------------------------------------------------------
  // OAuth Sign-In: Register with IDP and create session
  // -------------------------------------------------------------------------

  if (account && account.provider !== 'credentials') {
    console.log('[JWT_CALLBACK] Handling OAuth sign-in for provider:', account.provider);
    return handleOAuthSignIn(token, user, account);
  }

  // -------------------------------------------------------------------------
  // Credentials Sign-In: Session already created in authorize()
  // -------------------------------------------------------------------------

  if (user && (user as any).redisSessionId) {
    // Credentials authorize() returns redisSessionId
    const redisSessionId = (user as any).redisSessionId;

    return {
      ...token,
      redisSessionId,
            sub: user.id || token.sub || 'unknown',
    };
  }

  // -------------------------------------------------------------------------
  // Subsequent Requests: Validate session exists
  // -------------------------------------------------------------------------

  const redisSessionId = (user as any)?.redisSessionId || token?.redisSessionId || token?.redisSessionId;

  if (!redisSessionId) {
    return { ...token, error: 'NoSession', sub: token.sub || 'unknown' };
  }

  // Validate session still exists in Redis
  try {
    const sessionData = await getSession(redisSessionId as string);

    if (!sessionData) {
      // Session expired or deleted
      return { ...token, error: 'SessionNotFound', sub: token.sub || 'unknown' };
    }

    // Check if refresh token has expired (session should be terminated)
    if (sessionData.idpRefreshTokenExpires && Date.now() >= sessionData.idpRefreshTokenExpires) {
      return { ...token, error: 'RefreshTokenExpired', sub: token.sub || 'unknown' };
    }

    // Check if MFA has expired (requires step-up authentication)
    if (sessionData.mfaExpiresAt && Date.now() > sessionData.mfaExpiresAt) {
      return {
        ...token,
        redisSessionId,
                sub: sessionData.userId,
        error: 'MfaExpired',
      };
    }
  } catch (error) {
    console.error('[JWT_CALLBACK] Session validation error:', error);
    return { ...token, error: 'SessionError', sub: token.sub || 'unknown' };
  }

  // Session is valid - return minimal token
  return {
    ...token,
    redisSessionId,
        sub: token.sub || 'unknown',
  };
}

// ============================================================================
// OAUTH SIGN-IN HANDLER
// ============================================================================

/**
 * Handle OAuth sign-in by registering with IDP and creating session.
 */
async function handleOAuthSignIn(
  token: JWT,
  user: User | any,
  account: Account
): Promise<JwtCallbackResult> {
  console.log('[JWT_CALLBACK] handleOAuthSignIn starting for:', {
    provider: account.provider,
    email: user?.email,
    providerAccountId: account.providerAccountId,
  });

  try {
  // Call IDP to register/authenticate OAuth user
  const idpResult = await idpOAuthCallback({
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    email: user?.email || '',
    name: user?.name || '',
    image: user?.image || '',
    accessToken: account.access_token,
    refreshToken: account.refresh_token,
    expiresAt: account.expires_at,
  });

  // Build session data using normalized field names
  let sessionData: any;
  let mfaVerified = false;

  if (idpResult.success && idpResult.data?.accessToken) {
    // IDP integration succeeded - we have IDP tokens
    const decoded = decodeIdpAccessToken(idpResult.data.accessToken);
    const amrClaims = decoded ? extractAmrFromToken(decoded) : [];
    const acrLevel = decoded?.acr || '1';

    // Extract kid from JWT header (CRITICAL: different from client_id in payload)
    const bearerKeyId = extractKidFromToken(idpResult.data.accessToken);
    if (bearerKeyId) {
      console.log('[JWT_CALLBACK] Extracted bearerKeyId (kid) from JWT header:', bearerKeyId);
    } else {
      console.warn('[JWT_CALLBACK] No kid found in JWT header');
    }

    // Check if MFA is required for this client
    try {
      const clientConfig = await getIDPClientConfig();
      const require2FA = clientConfig?.authSettings?.require2FA ?? true;
      mfaVerified = !require2FA; // If MFA not required, mark as verified
    } catch {
      // Default to requiring MFA if config unavailable
      mfaVerified = false;
    }

    sessionData = {
      userId: idpResult.data.user?.userId?.toString() || account.providerAccountId,
      email: idpResult.data.user?.email || user?.email || '',
      name: idpResult.data.user?.fullName || user?.name || '',
      roles: idpResult.data.user?.roles || [],
      // IDP tokens (normalized names)
      idpAccessToken: idpResult.data.accessToken,
      idpRefreshToken: idpResult.data.refreshToken,
      idpAccessTokenExpires: decoded?.exp ? expClaimToMs(decoded.exp) : Date.now() + 3600000,
      decodedAccessToken: decoded || undefined,
      // Bearer key ID from JWT header (NOT client_id from payload)
      bearerKeyId,
      // MFA state (normalized names)
      mfaVerified,
      authenticationMethods: amrClaims,
      authenticationLevel: acrLevel,
      // OAuth provider info (normalized names)
      oauthProvider: account.provider,
      oauthProviderToken: account.access_token,
      oauthProviderRefreshToken: account.refresh_token,
      // Multi-tenant info
      idpClientId: decoded?.client_id,
      merchantId: decoded?.merchant_id,
    };
  } else {
    // IDP integration failed - create OAuth-only session
    // This allows OAuth login to work even if IDP is unavailable
    mfaVerified = true; // OAuth IS multi-factor (Google/Microsoft handle MFA)
    sessionData = {
      userId: account.providerAccountId,
      email: user?.email || '',
      name: user?.name || '',
      roles: [],
      mfaVerified: true, // OAuth IS multi-factor
      oauthProvider: account.provider,
      oauthProviderToken: account.access_token,
      oauthProviderRefreshToken: account.refresh_token,
      idpAccessTokenExpires: account.expires_at
        ? account.expires_at * 1000
        : Date.now() + 3600000,
    };
  }

  // -------------------------------------------------------------------------
  // ROLE MERGING: Fetch Vibe roles and merge with IDP roles
  // -------------------------------------------------------------------------
  const clientId = sessionData.idpClientId || process.env.IDP_CLIENT_ID || '';
  if (clientId && sessionData.userId) {
    const vibeRoles = await fetchVibeRoles(sessionData.userId, clientId);
    // SECURITY: Filter out protected IDP-level role prefixes to prevent injection
    const safeVibeRoles = vibeRoles.filter(r => !r.startsWith('payez_'));
    const idpRoles = sessionData.roles || [];
    sessionData.roles = mergeRoles(idpRoles, safeVibeRoles);
    console.log('[JWT_CALLBACK] Merged roles:', {
      idpRoles,
      vibeRoles,
      safeVibeRoles,
      merged: sessionData.roles,
    });
  }

  // Create Redis session
  console.log('[JWT_CALLBACK] Creating Redis session for:', {
    userId: sessionData.userId,
    email: sessionData.email,
    mfaVerified: sessionData.mfaVerified,
    roles: sessionData.roles,
  });

  const redisSessionId = await createSession(sessionData);

  console.log('[JWT_CALLBACK] Redis session created:', {
    redisSessionId: redisSessionId ? redisSessionId.substring(0, 8) + '...' : 'NONE',
  });

  // Check if immediate MFA redirect is needed
  const needsImmediateTwoFactor = !mfaVerified;

  return {
    ...token,
    redisSessionId,
        sub: sessionData.userId,
    requiresTwoFactorRedirect: needsImmediateTwoFactor,
  };
  } catch (error) {
    console.error('[JWT_CALLBACK] handleOAuthSignIn FAILED:', error);
    return { ...token, error: 'OAuthSignInFailed', sub: token.sub || 'unknown' };
  }
}
