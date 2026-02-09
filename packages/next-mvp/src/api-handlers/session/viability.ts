/**
 * Session Viability Check API Handler for `@payez/next-mvp`
 *
 * This API route is called by the middleware to securely check if a session is valid.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../lib/session-store';
import { getToken } from 'next-auth/jwt';
import { isInitializationFailed, ensureInitialized } from '../../lib/startup-init';
import { getJwtCookieName } from '../../lib/app-slug';
import { getIDPClientConfig } from '../../lib/idp-client-config';

/**
 * Get NextAuth secret from IDP config (cached).
 * NEVER use process.env.NEXTAUTH_SECRET directly - it may not be set.
 */
async function getNextAuthSecret(): Promise<string> {
  const config = await getIDPClientConfig();
  return config.nextAuthSecret || '';
}

export async function GET(req: NextRequest) {
  try {
    // Ensure initialization is complete
    if (!process.env.NEXTAUTH_SECRET) {
      try {
        await ensureInitialized();
      } catch (error) {
        // Initialization failed - return 503
        console.error('[API Viability] Initialization failed - returning 503');
        return NextResponse.json(
          {
            error: 'Service Unavailable',
            message: 'Authentication service is not properly configured',
            code: 'AUTH_NOT_INITIALIZED'
          },
          { status: 503 }
        );
      }
    }

    // Double-check after initialization attempt
    if (isInitializationFailed()) {
      console.error('[API Viability] Initialization failed - returning 503');
      return NextResponse.json(
        {
          error: 'Service Unavailable',
          message: 'Authentication service is not properly configured',
          code: 'AUTH_NOT_INITIALIZED'
        },
        { status: 503 }
      );
    }

    // Get secret from IDP config (same source as session.ts and token-lifecycle.ts)
    const secret = await getNextAuthSecret();
    if (!secret) {
      console.error('[API Viability] NEXTAUTH_SECRET not available from IDP config');
      return NextResponse.json(
        {
          error: 'Service Unavailable',
          message: 'Authentication service is not properly configured',
          code: 'AUTH_NOT_INITIALIZED'
        },
        { status: 503 }
      );
    }

    // getToken is the recommended way to get the JWT from a request
    const cookieName = getJwtCookieName();
    const token = await getToken({ req, secret, cookieName });

    // Debug logging to diagnose AKS-specific issues
    if (!token) {
      const cookieHeader = req.headers.get('cookie') || '';
      const hasCookie = cookieHeader.includes(cookieName);
      const cookieMatch = cookieHeader.match(new RegExp(`${cookieName}=([^;]*)`));
      const cookieValue = cookieMatch ? cookieMatch[1] : null;
      console.warn('[VIABILITY] getToken returned null:', {
        cookieName,
        hasCookie,
        cookieValueLength: cookieValue?.length || 0,
        cookieValuePreview: cookieValue ? cookieValue.substring(0, 30) + '...' : 'EMPTY',
        secretLength: secret.length,
        secretPreview: secret ? secret.substring(0, 10) + '...' : 'EMPTY',
      });
    }

    // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
    const sessionToken = (token?.sessionToken || token?.redisSessionId) as string | undefined;
    if (token && sessionToken) {
      const sessionData = await getSession(sessionToken);
      if (sessionData) {
        // The session exists in Redis

        // Check if access token is expired (for middleware decision-making)
        const accessTokenExpires = sessionData.idpAccessTokenExpires || 0;
        const accessTokenExpired = accessTokenExpires < Date.now();

        // Get requires2FA from cached client config (not session)
        // This is a client-wide setting from the broker handshake
        let requires2FA = true; // Default to true for security
        try {
          const cachedConfig = await getIDPClientConfig();
          requires2FA = cachedConfig.authSettings?.require2FA ?? true;
        } catch (e) {
          console.warn('[API Viability] Could not get client config, defaulting requires2FA to true');
        }

        // CRITICAL: Check if MFA has expired (2FA TTL enforcement)
        // The session may have mfaVerified=true from days ago, but if mfaExpiresAt
        // has passed, we must treat 2FA as incomplete to force re-verification.
        const mfaExpiresAt = sessionData.mfaExpiresAt || 0;
        const mfaExpired = mfaExpiresAt > 0 && mfaExpiresAt < Date.now();
        // Check both field names for compatibility (mfaVerified is the normalized name)
        const sessionMfaComplete = sessionData.mfaVerified ?? (sessionData as any).twoFactorComplete ?? false;
        const effectiveTwoFactorComplete = sessionMfaComplete && !mfaExpired;

        console.log('[VIABILITY] Session 2FA check:', {
          sessionToken: sessionToken.substring(0, 8) + '...',
          mfaVerified: sessionData.mfaVerified,
          twoFactorComplete: (sessionData as any).twoFactorComplete,
          sessionMfaComplete,
          mfaExpired,
          effectiveTwoFactorComplete,
        });

        if (mfaExpired && sessionMfaComplete) {
          console.warn('[API Viability] MFA expired - forcing 2FA re-verification', {
            mfaExpiresAt: new Date(mfaExpiresAt).toISOString(),
            now: new Date().toISOString(),
            hoursExpiredAgo: ((Date.now() - mfaExpiresAt) / (1000 * 60 * 60)).toFixed(1)
          });
        }

        const response = {
          authenticated: true,
          sessionToken, // Include token for middleware tracking
          // 2FA fields - critical for middleware redirect logic
          requires2FA, // From cached client config (client-wide setting)
          twoFactorComplete: effectiveTwoFactorComplete, // From session, BUT respects MFA TTL
          // Token status for refresh decisions
          accessTokenExpired,
          hasRefreshToken: !!sessionData.idpRefreshToken
        };
        return NextResponse.json(response);
      }

      // CRITICAL: Cookie exists but Redis session is missing (stale cookie state)
      // Return sessionToken so middleware can detect this and clear the stale cookie
      console.warn('[VIABILITY] Stale cookie detected - session not in Redis');
      return NextResponse.json({
        authenticated: false,
        sessionToken // Include token to enable stale cookie detection
      });
    }

    // If there's no token at all, it's not authenticated
    return NextResponse.json({ authenticated: false });

  } catch (error) {
    console.error('[API Viability] Error checking session viability:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}