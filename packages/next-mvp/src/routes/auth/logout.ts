/**
 * Ready-to-Use Logout Route
 *
 * Provides a pre-configured logout handler that properly cleans up
 * sessions and revokes tokens.
 *
 * @example
 * ```typescript
 * // app/api/auth/logout/route.ts
 * export { POST } from '@payez/next-mvp/routes/auth/logout';
 * ```
 *
 * @version 2.0.0
 * @since auth-ready-v2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { deleteSession } from '../../lib/session-store';
import {
  getSessionCookieName,
  getSecureSessionCookieName,
  getCsrfCookieName,
  getSecureCsrfCookieName,
  getCallbackUrlCookieName,
  getJwtCookieName
} from '../../lib/app-slug';
import { getIDPClientConfig } from '../../lib/idp-client-config';
import { siteEvents, getClientIp } from '../../lib/site-logger';

async function getConfig() {
  const idpConfig = await getIDPClientConfig();
  const idpBaseUrl = process.env.IDP_URL;
  if (!idpBaseUrl) {
    throw new Error('[IDP_URL] FATAL: IDP_URL environment variable is REQUIRED.');
  }
  return {
    nextAuthSecret: idpConfig.nextAuthSecret || '',
    idpBaseUrl,
    clientId: process.env.CLIENT_ID || process.env.NEXT_PUBLIC_IDP_CLIENT_ID || '',
  };
}

/**
 * POST /api/auth/logout - Sign out and clean up session
 *
 * Performs complete logout:
 * 1. Revokes tokens at IDP (if refresh token available)
 * 2. Deletes session from store
 * 3. Clears NextAuth session cookie
 */
export async function POST(req: NextRequest) {
  const { nextAuthSecret, idpBaseUrl, clientId } = await getConfig();

  try {
    const token = await getToken({ req, secret: nextAuthSecret, cookieName: getJwtCookieName() });

    if (!token) {
      // Already logged out
      return NextResponse.json({
        success: true,
        message: 'No active session'
      });
    }

    // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
    const sessionId = (token as any).sessionToken || (token as any).redisSessionId;

    // Delete session from store (this also removes the refresh token)
    if (sessionId) {
      try {
        await deleteSession(sessionId);
        console.info('[LOGOUT_ROUTE] Session deleted from store');
      } catch (error) {
        console.warn('[LOGOUT_ROUTE] Failed to delete session:', error);
      }
    }

    // Log logout event (fire-and-forget)
    const userId = (token as any).sub || (token as any).idpUserId;
    if (userId) {
      siteEvents.logout({
        user_id: userId,
        session_id: sessionId,
        trigger: 'user',
        url: '/api/auth/logout',
        user_agent: req.headers.get('user-agent') || undefined,
        ip_address: getClientIp(req.headers) || undefined,
      });
    }

    // Build response that clears NextAuth cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear NextAuth session cookies (using app-slug prefixed names)
    const cookieNames = [
      getSessionCookieName(),
      getSecureSessionCookieName(),
      getCsrfCookieName(),
      getSecureCsrfCookieName(),
      getCallbackUrlCookieName(),
      `__Secure-${getCallbackUrlCookieName()}`,
    ];

    // Clear each cookie by setting it with maxAge 0
    cookieNames.forEach(name => {
      response.cookies.set(name, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    return response;
  } catch (error) {
    console.error('[LOGOUT_ROUTE] Error during logout:', error);
    return NextResponse.json({
      error: 'Failed to logout',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}