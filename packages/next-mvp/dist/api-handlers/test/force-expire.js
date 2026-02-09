"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const server_1 = require("next/server");
const jwt_1 = require("next-auth/jwt");
const session_store_1 = require("../../lib/session-store");
const app_slug_1 = require("../../lib/app-slug");
/**
 * Force-expire access token for testing refresh flow.
 *
 * Sets the access token expiry to 2 minutes in the past,
 * which will trigger a refresh on the next API call.
 *
 * Usage in consuming app:
 * ```typescript
 * // app/api/test/force-expire/route.ts
 * export { POST } from '@payez/next-mvp/api-handlers/test/force-expire';
 * ```
 */
const POST = async (req) => {
    try {
        const secret = process.env.NEXTAUTH_SECRET;
        if (!secret) {
            return server_1.NextResponse.json({ success: false, error: 'NEXTAUTH_SECRET not configured' }, { status: 500 });
        }
        const cookieName = (0, app_slug_1.getJwtCookieName)();
        const token = await (0, jwt_1.getToken)({ req, secret, cookieName });
        let sessionToken = token?.redisSessionId;
        if (!sessionToken) {
            const headerSessionToken = req.headers.get('x-session-token') || req.headers.get('X-Session-Token');
            if (headerSessionToken) {
                sessionToken = headerSessionToken;
            }
            else {
                console.warn('[TEST_EXPIRE] No session token in JWT cookie or X-Session-Token header');
                return server_1.NextResponse.json({ success: false, error: 'No session token' }, { status: 401 });
            }
        }
        const session = await (0, session_store_1.getSession)(sessionToken);
        if (!session) {
            return server_1.NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }
        const now = Date.now();
        const forced = now - (2 * 60 * 1000); // two minutes ago
        const prev = session.idpAccessTokenExpires || null;
        await (0, session_store_1.updateSession)(sessionToken, { idpAccessTokenExpires: forced });
        console.log('[TEST_EXPIRE] Forced access token expiry for session', {
            sessionToken: sessionToken.substring(0, 8) + '...',
            previous: prev ? new Date(prev).toISOString() : null,
            newExpiry: new Date(forced).toISOString()
        });
        return server_1.NextResponse.json({
            success: true,
            previous: prev,
            previousIso: prev ? new Date(prev).toISOString() : null,
            newExpiry: forced,
            newExpiryIso: new Date(forced).toISOString()
        });
    }
    catch (e) {
        console.error('[TEST_EXPIRE] Error:', e);
        return server_1.NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
};
exports.POST = POST;
