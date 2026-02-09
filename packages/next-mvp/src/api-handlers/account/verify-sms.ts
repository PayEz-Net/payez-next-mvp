/**
 * Verify SMS 2FA Code Handler
 *
 * Verifies the 2FA SMS verification code and completes the 2FA flow.
 * Updates the session with new tokens upon successful verification.
 *
 * @package @payez/next-mvp
 */

import { NextRequest, NextResponse } from 'next/server';
import { idpFetchJSON } from '../../lib/idp-fetch';
import { ENV_CONFIG } from '../../config/env';
import { getTokenTestAware } from '../../lib/test-aware-get-token';
import { transitionTo2FASession } from '../../lib/session-store';
import { jwtDecode } from '../../lib/jwt-decode';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const verificationCode = body.verificationCode || body.verification_code;

    if (!verificationCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification code is required',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    // Call IDP using idpFetchJSON which auto-injects Bearer token from Redis session
    const result = await idpFetchJSON(req, `${ENV_CONFIG.IDP_URL}/api/ExternalAuth/twofa/sms/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification_code: verificationCode }),
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.json?.message || 'Verification failed',
          code: result.json?.code || 'IDP_ERROR',
          meta: { attemptedRefresh: result.attemptedRefresh },
        },
        { status: result.status }
      );
    }

    // Unwrap IDP envelope
    const unwrappedData = result.json?.data || result.json;

    // If we have new tokens, update the session to complete 2FA
    if (unwrappedData.access_token && unwrappedData.refresh_token) {
      // Get session token from NextAuth
      // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
      const token = await getTokenTestAware(req);
      const sessionToken = (token?.sessionToken || token?.redisSessionId) as string | undefined;

      if (sessionToken) {
        console.log('[VERIFY_SMS] Updating session with new tokens');

        // Decode access token to get actual expiration
        let accessTokenExpires = Date.now() + (15 * 60 * 1000); // Default: 15 minutes
        try {
          const decoded = jwtDecode<{ exp?: number }>(unwrappedData.access_token);
          if (decoded?.exp) {
            accessTokenExpires = decoded.exp * 1000; // Convert to milliseconds
          }
        } catch (err) {
          console.warn('[VERIFY_SMS] Could not decode access token, using default expiration');
        }

        // Decode refresh token to get actual expiration (optional)
        let refreshTokenExpires = Date.now() + (3 * 24 * 60 * 60 * 1000); // Default: 3 days
        try {
          const decoded = jwtDecode<{ exp?: number }>(unwrappedData.refresh_token);
          if (decoded?.exp) {
            refreshTokenExpires = decoded.exp * 1000;
          }
        } catch {
          // Refresh token may not have exp claim, use default
        }

        // Update session with new tokens and mark 2FA complete
        await transitionTo2FASession(
          sessionToken,
          {
            accessToken: unwrappedData.access_token,
            refreshToken: unwrappedData.refresh_token,
            accessTokenExpires,
            refreshTokenExpires
          },
          'sms' // Store 2FA method for refresh token flow
        );

        console.log('[VERIFY_SMS] Session updated successfully', {
          accessTokenExpires: new Date(accessTokenExpires).toISOString(),
          refreshTokenExpires: new Date(refreshTokenExpires).toISOString()
        });
      }
    }

    // Return simplified success response (don't expose tokens to client)
    return NextResponse.json({
      success: true,
      verificationSuccessful: true,
      twoFactorSessionVerified: true,
      message: unwrappedData.message || 'SMS code verified successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('[VERIFY_SMS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify code',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
