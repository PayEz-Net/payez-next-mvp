/**
 * Authentication Signout API Handler
 *
 * Handles user session termination and cookie cleanup.
 * This handler is designed to be imported and used by Next.js applications
 * using the @payez/next-mvp package.
 *
 * @version 2.0
 * @requires No authentication (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '../../lib/session-store';
import { getSession } from '../../server/auth';
import {
  getSessionCookieName,
  getSecureSessionCookieName,
  getCsrfCookieName,
  getSecureCsrfCookieName,
  getCallbackUrlCookieName,
  getJwtCookieName
} from '../../lib/app-slug';

// JWT decode helper - simple base64 decode without verification
function jwtDecode(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

// Add protection headers to all responses
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");
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

interface SignoutResponse {
  success: boolean;
  message: string;
  sessionDeleted?: boolean;
  chunkCookiesDeleted?: number;
}

interface SignoutConfig {
  nextAuthSecret: string;
}

/**
 * Creates a signout handler for Next.js API routes
 *
 * @param config Configuration for NextAuth
 * @returns Next.js POST handler function
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/signout/route.ts
 * import { createSignoutHandler } from '@payez/next-mvp/api-handlers/auth/signout';
 *
 * export const POST = createSignoutHandler({
 *   nextAuthSecret: process.env.NEXTAUTH_SECRET!
 * });
 * ```
 */
export function createSignoutHandler(config: SignoutConfig) {
  const { nextAuthSecret } = config;

  return async function POST(req: NextRequest) {
    const cookieStore = await cookies();

    // Get app-slug prefixed cookie names
    const sessionCookieName = getSessionCookieName();
    const secureSessionCookieName = getSecureSessionCookieName();

    // Handle chunked session tokens (for large JWTs)
    let sessionToken: string | undefined;
    const sessionTokenCookie = cookieStore.get(sessionCookieName);

    if (sessionTokenCookie?.value) {
      // Single cookie case
      sessionToken = sessionTokenCookie.value;
    } else {
      // Chunked cookie case - reconstruct from parts
      const chunkCookies = cookieStore.getAll()
        .filter(cookie => cookie.name.startsWith(`${sessionCookieName}.`))
        .sort((a, b) => {
          const aIndex = parseInt(a.name.split('.').pop() || '0');
          const bIndex = parseInt(b.name.split('.').pop() || '0');
          return aIndex - bIndex;
        });

      if (chunkCookies.length > 0) {
        sessionToken = chunkCookies.map(cookie => cookie.value).join('');
      }
    }

    // Get chunk cookies for cleanup count
    const chunkCookies = cookieStore.getAll()
      .filter(cookie => cookie.name.startsWith(`${sessionCookieName}.`));

    // Decode NextAuth JWT to extract the Redis session UUID before deletion
    let redisSessionToken: string | null = null;

    // First attempt: Better Auth getSession
    try {
      const betterAuthSession = await getSession(req);
      redisSessionToken = betterAuthSession?.session?.token || null;
    } catch (e) {
      console.warn('[SIGNOUT] getSession() failed to extract session token (will try manual decode)');
    }

    // Second attempt: manual decode of the session cookie JWT (no verification)
    if (!redisSessionToken && (sessionToken || cookieStore.getAll().some(c => c.name.startsWith(`${sessionCookieName}.`)))) {
      try {
        // Reconstruct raw JWT from chunked cookies if necessary
        let rawJwt: string | null = null;
        const direct = cookieStore.get(sessionCookieName);
        if (direct?.value) {
          rawJwt = direct.value;
        } else {
          const chunks = cookieStore.getAll()
            .filter(c => c.name.startsWith(`${sessionCookieName}.`))
            .sort((a, b) => {
              const ai = parseInt(a.name.split('.').pop() || '0');
              const bi = parseInt(b.name.split('.').pop() || '0');
              return ai - bi;
            })
            .map(c => c.value);
          if (chunks.length > 0) rawJwt = chunks.join('');
        }

        if (rawJwt) {
          const decoded: any = jwtDecode(rawJwt);
          if (decoded && typeof decoded === 'object' && typeof decoded.sessionToken === 'string') {
            redisSessionToken = decoded.sessionToken;
          }
        }
      } catch (e) {
        console.warn('[SIGNOUT] Manual JWT decode failed to extract session token');
      }
    }

    // Delete Redis session if UUID was extracted
    if (redisSessionToken) {
      try {
        await deleteSession(redisSessionToken);
        console.info('[SIGNOUT] Redis session cleanup successful', {
          sessionToken: redisSessionToken.substring(0, 8) + '...'
        });
      } catch (sessionError) {
        // Log error but don't fail the signout process
        console.error('[SIGNOUT] Redis session cleanup failed', { error: sessionError });
      }
    } else {
      console.warn('[SIGNOUT] No Redis session token (UUID) extracted from cookie; skipping Redis deletion');
    }

    // Build response
    const responseData: SignoutResponse = {
      success: true,
      message: sessionToken ? 'Session deleted successfully' : 'No active session found',
      sessionDeleted: !!sessionToken,
      chunkCookiesDeleted: chunkCookies.length
    };

    const response = NextResponse.json(responseData);

    // Always clear cookies, regardless of success/failure (using app-slug prefixed names)
    try {
      response.cookies.delete(sessionCookieName);
      response.cookies.delete(secureSessionCookieName);
      response.cookies.delete(getCsrfCookieName());
      response.cookies.delete(getSecureCsrfCookieName());
      response.cookies.delete(getCallbackUrlCookieName());
      response.cookies.delete(`__Secure-${getCallbackUrlCookieName()}`);
      response.cookies.delete('twoFactorSessionVerified');

      // Delete chunked session cookies
      chunkCookies.forEach(cookie => {
        response.cookies.delete(cookie.name);
      });
    } catch (cookieError) {
      console.error('[SIGNOUT] Cookie cleanup failed:', cookieError);
    }

    return addSecurityHeaders(response);
  };
}

/**
 * Default export for backward compatibility
 * Requires environment variable: NEXTAUTH_SECRET
 */
export const POST = createSignoutHandler({
  nextAuthSecret: process.env.NEXTAUTH_SECRET || ''
});
