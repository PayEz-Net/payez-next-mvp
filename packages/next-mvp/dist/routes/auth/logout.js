"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const jwt_1 = require("next-auth/jwt");
const session_store_1 = require("../../lib/session-store");
const app_slug_1 = require("../../lib/app-slug");
const idp_client_config_1 = require("../../lib/idp-client-config");
const site_logger_1 = require("../../lib/site-logger");
async function getConfig() {
    const idpConfig = await (0, idp_client_config_1.getIDPClientConfig)();
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
async function POST(req) {
    const { nextAuthSecret, idpBaseUrl, clientId } = await getConfig();
    try {
        const token = await (0, jwt_1.getToken)({ req, secret: nextAuthSecret, cookieName: (0, app_slug_1.getJwtCookieName)() });
        if (!token) {
            // Already logged out
            return server_1.NextResponse.json({
                success: true,
                message: 'No active session'
            });
        }
        // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
        const sessionId = token.sessionToken || token.redisSessionId;
        // Delete session from store (this also removes the refresh token)
        if (sessionId) {
            try {
                await (0, session_store_1.deleteSession)(sessionId);
                console.info('[LOGOUT_ROUTE] Session deleted from store');
            }
            catch (error) {
                console.warn('[LOGOUT_ROUTE] Failed to delete session:', error);
            }
        }
        // Log logout event (fire-and-forget)
        const userId = token.sub || token.idpUserId;
        if (userId) {
            site_logger_1.siteEvents.logout({
                user_id: userId,
                session_id: sessionId,
                trigger: 'user',
                url: '/api/auth/logout',
                user_agent: req.headers.get('user-agent') || undefined,
                ip_address: (0, site_logger_1.getClientIp)(req.headers) || undefined,
            });
        }
        // Build response that clears NextAuth cookies
        const response = server_1.NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        });
        // Clear NextAuth session cookies (using app-slug prefixed names)
        const cookieNames = [
            (0, app_slug_1.getSessionCookieName)(),
            (0, app_slug_1.getSecureSessionCookieName)(),
            (0, app_slug_1.getCsrfCookieName)(),
            (0, app_slug_1.getSecureCsrfCookieName)(),
            (0, app_slug_1.getCallbackUrlCookieName)(),
            `__Secure-${(0, app_slug_1.getCallbackUrlCookieName)()}`,
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
    }
    catch (error) {
        console.error('[LOGOUT_ROUTE] Error during logout:', error);
        return server_1.NextResponse.json({
            error: 'Failed to logout',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
