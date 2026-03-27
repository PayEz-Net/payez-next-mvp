/**
 * Session Viability Check API Handler for `@payez/next-mvp`
 *
 * This API route is called by the middleware to securely check if a session is valid.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession as getRedisSession } from '../../lib/session-store';
import { getSession } from '../../server/auth';
import { isInitializationFailed, ensureInitialized } from '../../lib/startup-init';
import { getIDPClientConfig } from '../../lib/idp-client-config';

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

    // Get session from Better Auth
    const betterAuthSession = await getSession(req);

    // Debug logging
    if (!betterAuthSession) {
      console.warn('[VIABILITY] getSession returned null');
    }

    const sessionToken = betterAuthSession?.session?.token as string | undefined;
    if (betterAuthSession && sessionToken) {
      const sessionData = await getRedisSession(sessionToken);
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