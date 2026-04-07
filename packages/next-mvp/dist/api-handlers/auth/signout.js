"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
exports.createSignoutHandler = createSignoutHandler;
const server_1 = require("next/server");
const headers_1 = require("next/headers");
const session_store_1 = require("../../lib/session-store");
const auth_1 = require("../../server/auth");
const app_slug_1 = require("../../lib/app-slug");
// JWT decode helper - simple base64 decode without verification
function jwtDecode(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const payload = parts[1];
        const decoded = Buffer.from(payload, 'base64').toString('utf-8');
        return JSON.parse(decoded);
    }
    catch (e) {
        return null;
    }
}
// Add protection headers to all responses
function addSecurityHeaders(response) {
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
/**
 * Creates a signout handler for Next.js API routes.
 *
 * Better Auth resolves its session from cookies, so this handler takes no
 * configuration. Use the default `POST` export below for typical usage.
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/signout/route.ts
 * export { POST } from '@payez/next-mvp/api-handlers/auth/signout';
 * ```
 */
function createSignoutHandler() {
    return async function POST(req) {
        const cookieStore = await (0, headers_1.cookies)();
        // Get app-slug prefixed cookie names
        const sessionCookieName = (0, app_slug_1.getSessionCookieName)();
        const secureSessionCookieName = (0, app_slug_1.getSecureSessionCookieName)();
        // Handle chunked session tokens (for large JWTs)
        let sessionToken;
        const sessionTokenCookie = cookieStore.get(sessionCookieName);
        if (sessionTokenCookie?.value) {
            // Single cookie case
            sessionToken = sessionTokenCookie.value;
        }
        else {
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
        // Decode the Better Auth session JWT to extract the Redis session UUID
        // before deletion.
        let redisSessionToken = null;
        // First attempt: Better Auth getSession
        try {
            const betterAuthSession = await (0, auth_1.getSession)(req);
            redisSessionToken = betterAuthSession?.session?.token || null;
        }
        catch (e) {
            console.warn('[SIGNOUT] getSession() failed to extract session token (will try manual decode)');
        }
        // Second attempt: manual decode of the session cookie JWT (no verification)
        if (!redisSessionToken && (sessionToken || cookieStore.getAll().some(c => c.name.startsWith(`${sessionCookieName}.`)))) {
            try {
                // Reconstruct raw JWT from chunked cookies if necessary
                let rawJwt = null;
                const direct = cookieStore.get(sessionCookieName);
                if (direct?.value) {
                    rawJwt = direct.value;
                }
                else {
                    const chunks = cookieStore.getAll()
                        .filter(c => c.name.startsWith(`${sessionCookieName}.`))
                        .sort((a, b) => {
                        const ai = parseInt(a.name.split('.').pop() || '0');
                        const bi = parseInt(b.name.split('.').pop() || '0');
                        return ai - bi;
                    })
                        .map(c => c.value);
                    if (chunks.length > 0)
                        rawJwt = chunks.join('');
                }
                if (rawJwt) {
                    const decoded = jwtDecode(rawJwt);
                    if (decoded && typeof decoded === 'object' && typeof decoded.sessionToken === 'string') {
                        redisSessionToken = decoded.sessionToken;
                    }
                }
            }
            catch (e) {
                console.warn('[SIGNOUT] Manual JWT decode failed to extract session token');
            }
        }
        // Delete Redis session if UUID was extracted
        if (redisSessionToken) {
            try {
                await (0, session_store_1.deleteSession)(redisSessionToken);
                console.info('[SIGNOUT] Redis session cleanup successful', {
                    sessionToken: redisSessionToken.substring(0, 8) + '...'
                });
            }
            catch (sessionError) {
                // Log error but don't fail the signout process
                console.error('[SIGNOUT] Redis session cleanup failed', { error: sessionError });
            }
        }
        else {
            console.warn('[SIGNOUT] No Redis session token (UUID) extracted from cookie; skipping Redis deletion');
        }
        // Build response
        const responseData = {
            success: true,
            message: sessionToken ? 'Session deleted successfully' : 'No active session found',
            sessionDeleted: !!sessionToken,
            chunkCookiesDeleted: chunkCookies.length
        };
        const response = server_1.NextResponse.json(responseData);
        // Always clear cookies, regardless of success/failure (using app-slug prefixed names)
        try {
            response.cookies.delete(sessionCookieName);
            response.cookies.delete(secureSessionCookieName);
            response.cookies.delete((0, app_slug_1.getCsrfCookieName)());
            response.cookies.delete((0, app_slug_1.getSecureCsrfCookieName)());
            response.cookies.delete((0, app_slug_1.getCallbackUrlCookieName)());
            response.cookies.delete(`__Secure-${(0, app_slug_1.getCallbackUrlCookieName)()}`);
            response.cookies.delete('twoFactorSessionVerified');
            // Delete chunked session cookies
            chunkCookies.forEach(cookie => {
                response.cookies.delete(cookie.name);
            });
        }
        catch (cookieError) {
            console.error('[SIGNOUT] Cookie cleanup failed:', cookieError);
        }
        return addSecurityHeaders(response);
    };
}
/**
 * Default POST export — drop-in for `app/api/auth/signout/route.ts`.
 */
exports.POST = createSignoutHandler();
