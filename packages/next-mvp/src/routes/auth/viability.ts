/**
 * Ready-to-Use Session Viability Route
 *
 * Checks if the current session is viable (valid and not expired).
 * Used by client-side code to determine if a refresh is needed.
 *
 * @example
 * ```typescript
 * // app/api/session/viability/route.ts
 * export { GET } from '@payez/next-mvp/routes/auth/viability';
 * ```
 *
 * @version 2.0.0
 * @since auth-ready-v2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSession } from '../../lib/session-store';
import { getJwtCookieName } from '../../lib/app-slug';
import { getIDPClientConfig } from '../../lib/idp-client-config';

/**
 * Get NextAuth secret from IDP config (cached).
 * NEVER use process.env.NEXTAUTH_SECRET at module level - it may not be set yet.
 */
async function getNextAuthSecret(): Promise<string> {
  const config = await getIDPClientConfig();
  return config.nextAuthSecret || '';
}

/**
 * Get tenant-wide 2FA requirement from cached client config (from broker handshake)
 */
async function getTenantRequiresTwoFactor(): Promise<boolean> {
  try {
    const config = await getIDPClientConfig();
    return config.authSettings?.require2FA ?? true; // Default to true for security
  } catch {
    console.warn('[VIABILITY] Could not get client config, defaulting tenantRequiresTwoFactor to true');
    return true;
  }
}

/**
 * GET /api/session/viability - Check if session is viable
 *
 * Returns:
 * - viable: boolean - Whether the session can be used
 * - needsRefresh: boolean - Whether a refresh is recommended
 * - expiresIn: number - Seconds until token expires
 */
export async function GET(req: NextRequest) {
  try {
    const cookieName = getJwtCookieName();
    const secret = await getNextAuthSecret();
    const token = await getToken({ req, secret, cookieName });

    if (!token) {
      return NextResponse.json({
        viable: false,
        needsRefresh: false,
        authenticated: false,
        reason: 'No session found'
      });
    }

    // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
    const sessionToken = (token as any).sessionToken || (token as any).redisSessionId;
    const session = sessionToken ? await getSession(sessionToken) : null;

    // CRITICAL: Detect stale cookie state (JWT exists but Redis session missing)
    if (sessionToken && !session) {
      console.warn('[VIABILITY] Stale cookie detected - session not in Redis');
      return NextResponse.json({
        viable: false,
        needsRefresh: false,
        authenticated: false,
        sessionToken, // Return sessionToken so middleware can detect and clear stale cookie
        reason: 'Stale session - cookie exists but session not found in Redis'
      });
    }

    // Check access token expiry
    const now = Math.floor(Date.now() / 1000);
    const accessTokenExpires = (token as any).accessTokenExpires || token.exp;

    if (!accessTokenExpires) {
      // No expiry info, assume viable but recommend refresh
      const tenantRequiresTwoFactor = await getTenantRequiresTwoFactor();

      // CRITICAL: Check if MFA has expired (2FA TTL enforcement)
      const mfaExpiresAt = session?.mfaExpiresAt || 0;
      const mfaExpired = mfaExpiresAt > 0 && mfaExpiresAt < Date.now();
      // Check mfaVerified (normalized name) with fallback to twoFactorComplete for compatibility
      const mfaVerifiedInSession = session?.mfaVerified ?? (session as any)?.twoFactorComplete ?? false;

      // User has completed 2FA requirements if: they verified AND it hasn't expired
      const userHasCompletedTenantTwoFactorRequirements = mfaVerifiedInSession && !mfaExpired;

      // userStillNeedsTwoFactor = inverse of completed (matches session callback logic)
      const userStillNeedsTwoFactor = !userHasCompletedTenantTwoFactorRequirements;

      return NextResponse.json({
        viable: true,
        needsRefresh: true,
        authenticated: true,
        sessionToken,
        // Clear names for middleware decision-making
        tenantRequiresTwoFactor,
        userHasCompletedTenantTwoFactorRequirements,
        userStillNeedsTwoFactor,
        // Legacy field names for backwards compatibility
        requires2FA: tenantRequiresTwoFactor,
        twoFactorComplete: userHasCompletedTenantTwoFactorRequirements,
        accessTokenExpired: false,
        reason: 'No expiry information'
      });
    }

    // Convert to seconds if needed
    const expiryTime = accessTokenExpires > 1000000000000
      ? Math.floor(accessTokenExpires / 1000)
      : accessTokenExpires;

    const expiresIn = expiryTime - now;
    const isExpired = expiresIn <= 0;
    const needsRefresh = expiresIn <= 300; // 5 minutes buffer

    // Check if we have refresh capability (check normalized field name first)
    const hasRefreshToken = !!(session?.idpRefreshToken || (session as any)?.refreshToken || (token as any).refreshToken);

    // CLEAR NAMING: Tenant-wide 2FA requirement from client config
    const tenantRequiresTwoFactor = await getTenantRequiresTwoFactor();

    // CRITICAL: Check if MFA has expired (2FA TTL enforcement)
    // The session may have mfaVerified=true from days ago, but if mfaExpiresAt
    // has passed, we must treat 2FA as incomplete to force re-verification.
    const mfaExpiresAt = session?.mfaExpiresAt || 0;
    const mfaExpired = mfaExpiresAt > 0 && mfaExpiresAt < Date.now();
    // Check mfaVerified (normalized name) with fallback to twoFactorComplete for compatibility
    const mfaVerifiedInSession = session?.mfaVerified ?? (session as any)?.twoFactorComplete ?? false;

    // DEBUG: Log what we're reading from the session
    console.log('[VIABILITY] Session 2FA state:', {
      sessionToken: sessionToken?.substring(0, 8) + '...',
      'session.mfaVerified': session?.mfaVerified,
      'session.twoFactorComplete': (session as any)?.twoFactorComplete,
      mfaVerifiedInSession,
      mfaExpiresAt,
      mfaExpired,
      hasRefreshToken,
      'session.idpRefreshToken': !!session?.idpRefreshToken,
      'session.refreshToken': !!(session as any)?.refreshToken,
    });

    // CLEAR NAMING: User has completed 2FA requirements if: they verified AND it hasn't expired
    const userHasCompletedTenantTwoFactorRequirements = mfaVerifiedInSession && !mfaExpired;

    // userStillNeedsTwoFactor = inverse of completed (matches session callback logic)
    const userStillNeedsTwoFactor = !userHasCompletedTenantTwoFactorRequirements;

    if (mfaExpired && mfaVerifiedInSession) {
      console.warn('[VIABILITY] MFA expired - forcing 2FA re-verification');
    }

    if (isExpired) {
      return NextResponse.json({
        viable: false,
        needsRefresh: hasRefreshToken,
        expiresIn: 0,
        hasRefreshToken,
        authenticated: true,
        sessionToken,
        // Clear names
        tenantRequiresTwoFactor,
        userHasCompletedTenantTwoFactorRequirements,
        userStillNeedsTwoFactor,
        // Legacy names for backwards compatibility
        requires2FA: tenantRequiresTwoFactor,
        twoFactorComplete: userHasCompletedTenantTwoFactorRequirements,
        accessTokenExpired: true,
        reason: 'Token expired',
        // RBAC fields
        roles: session?.roles || [],
        clientId: session?.idpClientId || process.env.IDP_CLIENT_ID || '',
      });
    }

    return NextResponse.json({
      viable: true,
      needsRefresh,
      expiresIn,
      hasRefreshToken,
      authenticated: true,
      sessionToken,
      // Clear names
      tenantRequiresTwoFactor,
      userHasCompletedTenantTwoFactorRequirements,
      userStillNeedsTwoFactor,
      // Legacy names for backwards compatibility
      requires2FA: tenantRequiresTwoFactor,
      twoFactorComplete: userHasCompletedTenantTwoFactorRequirements,
      accessTokenExpired: false,
      expiresAt: new Date(expiryTime * 1000).toISOString(),
      // RBAC fields
      roles: session?.roles || [],
      clientId: session?.idpClientId || process.env.IDP_CLIENT_ID || '',
    });
  } catch (error) {
    console.error('[VIABILITY_ROUTE] Error checking session viability:', error);
    return NextResponse.json({
      viable: false,
      needsRefresh: false,
      authenticated: false,
      error: 'Failed to check session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}