"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const jwt_1 = require("next-auth/jwt");
const session_store_1 = require("../../lib/session-store");
const app_slug_1 = require("../../lib/app-slug");
const idp_client_config_1 = require("../../lib/idp-client-config");
/**
 * Get NextAuth secret from IDP config (cached).
 * NEVER use process.env.NEXTAUTH_SECRET - it's always loaded from IDP.
 */
async function getNextAuthSecret() {
    const config = await (0, idp_client_config_1.getIDPClientConfig)();
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
async function GET(req) {
    try {
        const secret = await getNextAuthSecret();
        const cookieName = (0, app_slug_1.getJwtCookieName)();
        // Debug logging
        const cookieValue = req.cookies.get(cookieName)?.value;
        console.log('[SESSION_ROUTE] GET called:', {
            cookieName,
            hasCookie: !!cookieValue,
            cookieLength: cookieValue?.length || 0,
            secretLength: secret?.length || 0,
        });
        const token = await (0, jwt_1.getToken)({ req, secret, cookieName });
        if (!token) {
            console.warn('[SESSION_ROUTE] getToken returned null');
            // MUST return empty {} — NextAuth's useSession() treats any non-empty
            // response object as "authenticated", causing redirect loops on login page.
            return server_1.NextResponse.json({});
        }
        // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
        const redisSessionId = token.sessionToken || token.redisSessionId;
        console.log('[SESSION_ROUTE] Token found:', {
            sub: token.sub,
            email: token.email,
            name: token.name,
            hasExp: !!token.exp,
            redisSessionId: redisSessionId ? redisSessionId.substring(0, 8) + '...' : 'MISSING',
        });
        // Fetch full session data from Redis
        const session = redisSessionId ? await (0, session_store_1.getSession)(redisSessionId) : null;
        console.log('[SESSION_ROUTE] Redis session:', {
            found: !!session,
            userId: session?.userId,
            roles: session?.roles,
            hasAccessToken: !!session?.idpAccessToken,
        });
        // Return NextAuth-compatible session format with Redis data
        // useSession() expects: { user: {...}, expires: "..." }
        // We enrich with all session data from Redis
        return server_1.NextResponse.json({
            user: {
                id: session?.userId || token.sub,
                email: session?.email || token.email,
                name: session?.name || token.name,
                image: token.picture || null,
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
            expires: token.exp ? new Date(token.exp * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
    }
    catch (error) {
        console.error('[SESSION_ROUTE] Error checking session:', error);
        return server_1.NextResponse.json({
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
async function POST(req) {
    try {
        const secret = await getNextAuthSecret();
        const token = await (0, jwt_1.getToken)({ req, secret, cookieName: (0, app_slug_1.getJwtCookieName)() });
        if (!token) {
            return server_1.NextResponse.json({
                error: 'No session found',
                code: 'UNAUTHORIZED'
            }, { status: 401 });
        }
        // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
        const sessionToken = token.sessionToken || token.redisSessionId;
        if (!sessionToken) {
            return server_1.NextResponse.json({
                error: 'Invalid session',
                code: 'INVALID_SESSION'
            }, { status: 400 });
        }
        const body = await req.json();
        const { metadata, access_token, refresh_token, twoFactorComplete, twoFactorMethod } = body;
        // Get current session
        const session = await (0, session_store_1.getSession)(sessionToken);
        if (!session) {
            return server_1.NextResponse.json({
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
        await (0, session_store_1.updateSession)(sessionToken, updatedSession);
        return server_1.NextResponse.json({
            success: true,
            message: 'Session updated successfully'
        });
    }
    catch (error) {
        console.error('[SESSION_ROUTE] Error updating session:', error);
        return server_1.NextResponse.json({
            error: 'Failed to update session',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
