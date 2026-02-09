/**
 * Authentication Update Session API Handler
 *
 * Handles session updates, particularly for 2FA status changes.
 * This handler is designed to be imported and used by Next.js applications
 * using the @payez/next-mvp package.
 *
 * @version 2.0
 * @requires Authentication (authenticated endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getJwtCookieName } from '../../lib/app-slug';

// Add protection headers to all responses
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}

interface UpdateSessionRequest {
  twoFactorSessionVerified?: boolean;
  twoFactorMethod?: string;
}

interface UpdateSessionResponse {
  success: boolean;
  twoFactorSessionVerified: boolean;
  twoFactorMethod?: string;
}

interface UpdateSessionConfig {
  nextAuthSecret: string;
}

/**
 * Creates an update-session handler for Next.js API routes
 *
 * @param config Configuration for NextAuth
 * @returns Next.js POST handler function
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/update-session/route.ts
 * import { createUpdateSessionHandler } from '@payez/next-mvp/api-handlers/auth/update-session';
 *
 * export const POST = createUpdateSessionHandler({
 *   nextAuthSecret: process.env.NEXTAUTH_SECRET!
 * });
 * ```
 */
export function createUpdateSessionHandler(config: UpdateSessionConfig) {
  const { nextAuthSecret } = config;

  return async function POST(req: NextRequest) {
    try {
      let body: UpdateSessionRequest;

      try {
        body = await req.json();
      } catch (parseError) {
        return addSecurityHeaders(NextResponse.json(
          { error: 'Invalid JSON format' },
          { status: 400 }
        ));
      }

      const { twoFactorSessionVerified, twoFactorMethod } = body;

      // Get the current token
      const token = await getToken({ req, secret: nextAuthSecret, cookieName: getJwtCookieName() });
      if (!token) {
        return addSecurityHeaders(NextResponse.json(
          { error: 'No session token available' },
          { status: 401 }
        ));
      }

      // Update the token with 2FA challenge completion status
      const updatedToken = {
        ...token,
        twoFactorSessionVerified: !!twoFactorSessionVerified,
        twoFactorMethod: twoFactorMethod || token.twoFactorMethod
      };

      console.info('[UPDATE-SESSION] Session updated successfully', {
        userId: token.sub,
        twoFactorSessionVerified: updatedToken.twoFactorSessionVerified,
        twoFactorMethod: updatedToken.twoFactorMethod
      });

      const responseData: UpdateSessionResponse = {
        success: true,
        twoFactorSessionVerified: updatedToken.twoFactorSessionVerified as boolean,
        twoFactorMethod: updatedToken.twoFactorMethod as string | undefined
      };

      return addSecurityHeaders(NextResponse.json(responseData));
    } catch (error) {
      console.error('[UPDATE-SESSION] Error updating session', { error });
      return addSecurityHeaders(NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      ));
    }
  };
}

/**
 * Default export for backward compatibility
 * Requires environment variable: NEXTAUTH_SECRET
 */
export const POST = createUpdateSessionHandler({
  nextAuthSecret: process.env.NEXTAUTH_SECRET || ''
});
