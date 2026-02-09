/**
 * Ready-to-Use Session Management Route
 *
 * Provides pre-configured session handlers for checking and updating session state.
 *
 * @example
 * ```typescript
 * // app/api/auth/session/route.ts
 * export { GET, POST } from '@payez/next-mvp/routes/auth/session';
 * ```
 *
 * @version 2.0.0
 * @since auth-ready-v2
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSession, updateSession } from '../../lib/session-store';
import { getJwtCookieName } from '../../lib/app-slug';
import { getIDPClientConfig } from '../../lib/idp-client-config';

/**
 * Get NextAuth secret from IDP config (cached).
 * NEVER use process.env.NEXTAUTH_SECRET - it's always loaded from IDP.
 */
async function getNextAuthSecret(): Promise<string> {
  const config = await getIDPClientConfig();
  return config.nextAuthSecret || '';
}

/**
 * GET /api/auth/session - Check current session status
 *
 * Returns the current session information including:
 * - User details
 * - Token expiry status
 * - Session validity
 */
export async function GET(req: NextRequest) {
  try {
    const secret = await getNextAuthSecret();
    const cookieName = getJwtCookieName();

    // Debug logging
    const cookieValue = req.cookies.get(cookieName)?.value;
    console.log('[SESSION_ROUTE] GET called:', {
      cookieName,
      hasCookie: !!cookieValue,
      cookieLength: cookieValue?.length || 0,
      secretLength: secret?.length || 0,
    });

    const token = await getToken({ req, secret, cookieName });

    if (!token) {
      console.warn('[SESSION_ROUTE] getToken returned null');
      return NextResponse.json({
        authenticated: false,
        message: 'No session found'
      }, { status: 200 });
    }

    // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
    const redisSessionId = (token as any).sessionToken || (token as any).redisSessionId;

    console.log('[SESSION_ROUTE] Token found:', {
      sub: token.sub,
      email: token.email,
      name: token.name,
      hasExp: !!token.exp,
      redisSessionId: redisSessionId ? redisSessionId.substring(0, 8) + '...' : 'MISSING',
    });

    // Fetch full session data from Redis
    const session = redisSessionId ? await getSession(redisSessionId) : null;

    console.log('[SESSION_ROUTE] Redis session:', {
      found: !!session,
      userId: session?.userId,
      roles: session?.roles,
      hasAccessToken: !!session?.idpAccessToken,
    });

    // Return NextAuth-compatible session format with Redis data
    // useSession() expects: { user: {...}, expires: "..." }
    // We enrich with all session data from Redis
    return NextResponse.json({
      user: {
        id: session?.userId || token.sub,
        email: session?.email || token.email,
        name: session?.name || token.name,
        image: (token as any).picture || null,
        // Redis session data
        roles: session?.roles || [],
        twoFactorSessionVerified: session?.mfaVerified || false,
        requiresTwoFactor: !session?.mfaVerified,
        authenticationMethods: session?.authenticationMethods,
        authenticationLevel: session?.authenticationLevel,
        mfaCompletedAt: session?.mfaCompletedAt,
        mfaExpiresAt: session?.mfaExpiresAt,
        mfaValidityHours: session?.mfaValidityHours,
        oauthProvider: session?.oauthProvider,
        idpClientId: session?.idpClientId,
        merchantId: session?.merchantId,
      },
      // Session tokens
      sessionToken: redisSessionId,
      accessToken: session?.idpAccessToken,
      refreshToken: session?.idpRefreshToken,
      accessTokenExpires: session?.idpAccessTokenExpires,
      expires: token.exp ? new Date((token.exp as number) * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error('[SESSION_ROUTE] Error checking session:', error);
    return NextResponse.json({
      error: 'Failed to check session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/auth/session - Update session data
 *
 * Allows updating session metadata (not tokens).
 * Token refresh should use the /api/auth/refresh endpoint.
 *
 * Body:
 * - metadata: object - Custom metadata to store in session
 */
export async function POST(req: NextRequest) {
  try {
    const secret = await getNextAuthSecret();
    const token = await getToken({ req, secret, cookieName: getJwtCookieName() });

    if (!token) {
      return NextResponse.json({
        error: 'No session found',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
    const sessionToken = (token as any).sessionToken || (token as any).redisSessionId;
    if (!sessionToken) {
      return NextResponse.json({
        error: 'Invalid session',
        code: 'INVALID_SESSION'
      }, { status: 400 });
    }

    const body = await req.json();
    const { metadata, access_token, refresh_token, twoFactorComplete, twoFactorMethod } = body;

    // Get current session
    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      }, { status: 404 });
    }

    // Update session with new data
    const updatedSession = {
      ...session,
      ...(access_token ? { accessToken: access_token } : {}),
      ...(refresh_token ? { refreshToken: refresh_token } : {}),
      ...(typeof twoFactorComplete === 'boolean' ? { twoFactorComplete } : {}),
      ...(twoFactorMethod ? { twoFactorMethod } : {}),
      ...(metadata ? {
        metadata: {
          ...(session.metadata || {}),
          ...metadata,
          updatedAt: new Date().toISOString()
        }
      } : {})
    };

    await updateSession(sessionToken, updatedSession);

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully'
    });
  } catch (error) {
    console.error('[SESSION_ROUTE] Error updating session:', error);
    return NextResponse.json({
      error: 'Failed to update session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}