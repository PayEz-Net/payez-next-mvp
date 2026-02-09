/**
 * Authentication Verify Code / Complete 2FA API Handler
 *
 * Handles 2FA verification and token updates after successful verification.
 * This handler is designed to be imported and used by Next.js applications
 * using the @payez/next-mvp package.
 *
 * @version 2.0
 * @requires Authentication (authenticated endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { updateTokens, mark2FAComplete } from '../../lib/session-store';
import { getJwtCookieName } from '../../lib/app-slug';

interface VerifyCodeRequest {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  refreshTokenExpires?: number;
}

interface VerifyCodeConfig {
  nextAuthSecret: string;
}

/**
 * Creates a verify-code/complete-2FA handler for Next.js API routes
 *
 * @param config Configuration for NextAuth
 * @returns Next.js POST handler function
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/verify-code/route.ts
 * import { createVerifyCodeHandler } from '@payez/next-mvp/api-handlers/auth/verify-code';
 *
 * export const POST = createVerifyCodeHandler({
 *   nextAuthSecret: process.env.NEXTAUTH_SECRET!
 * });
 * ```
 */
export function createVerifyCodeHandler(config: VerifyCodeConfig) {
  const { nextAuthSecret } = config;

  return async function POST(req: NextRequest) {
    try {
      let body: VerifyCodeRequest;

      try {
        body = await req.json();
      } catch (parseError) {
        return NextResponse.json(
          { success: false, message: 'Invalid JSON format' },
          { status: 400 }
        );
      }

      const { accessToken, refreshToken, accessTokenExpires, refreshTokenExpires } = body;

      // Get current session token from JWT
      let token: any = await getToken({ req, secret: nextAuthSecret, cookieName: getJwtCookieName() });

      // The sessionToken is stored in the JWT token object
      // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
      const sessionToken = (token?.sessionToken || token?.redisSessionId) as string;

      if (!sessionToken) {
        console.error('[VERIFY-CODE] No session token found in JWT', {
          hasToken: !!token,
          tokenKeys: token ? Object.keys(token) : []
        });
        return NextResponse.json(
          { success: false, message: 'No session found' },
          { status: 401 }
        );
      }

      console.info('[VERIFY-CODE] Updating session with new tokens after 2FA', {
        sessionToken: sessionToken.substring(0, 8) + '...',
        userId: token?.sub,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenLength: accessToken?.length,
        refreshTokenLength: refreshToken?.length
      });

      // Update tokens in Redis
      await updateTokens(
        sessionToken,
        accessToken,
        refreshToken,
        accessTokenExpires,
        refreshTokenExpires
      );

      // Mark 2FA as complete
      await mark2FAComplete(sessionToken);

      console.info('[VERIFY-CODE] 2FA completion successful', {
        sessionToken: sessionToken.substring(0, 8) + '...',
        userId: token?.sub
      });

      return NextResponse.json({
        success: true,
        message: '2FA verification complete'
      });
    } catch (error) {
      console.error('[VERIFY-CODE] Failed to complete 2FA', {
        error: error instanceof Error ? error.message : String(error)
      });

      return NextResponse.json(
        { success: false, message: 'Failed to complete 2FA' },
        { status: 500 }
      );
    }
  };
}

/**
 * Default export for backward compatibility
 * Requires environment variable: NEXTAUTH_SECRET
 */
export const POST = createVerifyCodeHandler({
  nextAuthSecret: process.env.NEXTAUTH_SECRET || ''
});
