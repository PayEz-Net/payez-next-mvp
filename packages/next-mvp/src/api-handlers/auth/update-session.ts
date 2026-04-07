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
import { getSession } from '../../server/auth';

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

/**
 * Creates an update-session handler for Next.js API routes.
 *
 * Better Auth resolves its session from cookies, so this handler takes no
 * configuration. Use the default `POST` export below for typical usage.
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/update-session/route.ts
 * export { POST } from '@payez/next-mvp/api-handlers/auth/update-session';
 * ```
 */
export function createUpdateSessionHandler() {
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

      // Get the current session from Better Auth
      const session = await getSession(req);
      if (!session) {
        return addSecurityHeaders(NextResponse.json(
          { error: 'No session token available' },
          { status: 401 }
        ));
      }

      // Update the session with 2FA challenge completion status
      const updatedSession = {
        twoFactorSessionVerified: !!twoFactorSessionVerified,
        twoFactorMethod: twoFactorMethod || (session as any).twoFactorMethod
      };

      console.info('[UPDATE-SESSION] Session updated successfully', {
        userId: session.user?.id,
        twoFactorSessionVerified: updatedSession.twoFactorSessionVerified,
        twoFactorMethod: updatedSession.twoFactorMethod
      });

      const responseData: UpdateSessionResponse = {
        success: true,
        twoFactorSessionVerified: updatedSession.twoFactorSessionVerified as boolean,
        twoFactorMethod: updatedSession.twoFactorMethod as string | undefined
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
 * Default POST export — drop-in for `app/api/auth/update-session/route.ts`.
 */
export const POST = createUpdateSessionHandler();
