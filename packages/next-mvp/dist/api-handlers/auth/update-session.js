"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
exports.createUpdateSessionHandler = createUpdateSessionHandler;
const server_1 = require("next/server");
const auth_1 = require("../../server/auth");
// Add protection headers to all responses
function addSecurityHeaders(response) {
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
function createUpdateSessionHandler() {
    return async function POST(req) {
        try {
            let body;
            try {
                body = await req.json();
            }
            catch (parseError) {
                return addSecurityHeaders(server_1.NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 }));
            }
            const { twoFactorSessionVerified, twoFactorMethod } = body;
            // Get the current session from Better Auth
            const session = await (0, auth_1.getSession)(req);
            if (!session) {
                return addSecurityHeaders(server_1.NextResponse.json({ error: 'No session token available' }, { status: 401 }));
            }
            // Update the session with 2FA challenge completion status
            const updatedSession = {
                twoFactorSessionVerified: !!twoFactorSessionVerified,
                twoFactorMethod: twoFactorMethod || session.twoFactorMethod
            };
            console.info('[UPDATE-SESSION] Session updated successfully', {
                userId: session.user?.id,
                twoFactorSessionVerified: updatedSession.twoFactorSessionVerified,
                twoFactorMethod: updatedSession.twoFactorMethod
            });
            const responseData = {
                success: true,
                twoFactorSessionVerified: updatedSession.twoFactorSessionVerified,
                twoFactorMethod: updatedSession.twoFactorMethod
            };
            return addSecurityHeaders(server_1.NextResponse.json(responseData));
        }
        catch (error) {
            console.error('[UPDATE-SESSION] Error updating session', { error });
            return addSecurityHeaders(server_1.NextResponse.json({ error: 'Failed to update session' }, { status: 500 }));
        }
    };
}
/**
 * Default POST export — drop-in for `app/api/auth/update-session/route.ts`.
 */
exports.POST = createUpdateSessionHandler();
