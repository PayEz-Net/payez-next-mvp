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
import { getSession as getBetterAuthSession } from '../../server/auth';
import { getSession as getRedisSession, updateSession } from '../../lib/session-store';

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
    const authSession = await getBetterAuthSession(req);

    if (!authSession) {
      console.warn('[SESSION_ROUTE] Better Auth session not found');
      // MUST return empty {} — useSession() treats any non-empty
      // response object as "authenticated", causing redirect loops on login page.
      return NextResponse.json({});
    }

    const redisSessionId = authSession.session?.token;

    console.log('[SESSION_ROUTE] Session found:', {
      userId: authSession.user?.id,
      email: authSession.user?.email,
      name: authSession.user?.name,
      redisSessionId: redisSessionId ? redisSessionId.substring(0, 8) + '...' : 'MISSING',
    });

    // Fetch full session data from Redis
    const session = redisSessionId ? await getRedisSession(redisSessionId) : null;

    console.log('[SESSION_ROUTE] Redis session:', {
      found: !!session,
      userId: session?.userId,
      roles: session?.roles,
      hasAccessToken: !!session?.idpAccessToken,
    });

    // Return session format with Redis data
    // useSession() expects: { user: {...}, expires: "..." }
    // We enrich with all session data from Redis
    return NextResponse.json({
      user: {
        id: session?.userId || authSession.user?.id,
        email: session?.email || authSession.user?.email,
        name: session?.name || authSession.user?.name,
        image: authSession.user?.image || session?.image || null,
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
      expires: authSession.session?.expiresAt
        ? new Date(authSession.session.expiresAt).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
    const authSession = await getBetterAuthSession(req);

    if (!authSession) {
      return NextResponse.json({
        error: 'No session found',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const sessionToken = authSession.session?.token;
    if (!sessionToken) {
      return NextResponse.json({
        error: 'Invalid session',
        code: 'INVALID_SESSION'
      }, { status: 400 });
    }

    const body = await req.json();
    const { metadata, access_token, refresh_token, twoFactorComplete, twoFactorMethod } = body;

    // Get current session from Redis
    const session = await getRedisSession(sessionToken);
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