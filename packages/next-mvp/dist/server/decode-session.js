"use strict";
/**
 * Server-Side Session Decoder
 *
 * Reads the JWT session cookie, decodes it with jose, and fetches the
 * full session from Redis. Used by authGuard (layouts) and withAuth (API routes).
 *
 * Zero HTTP self-fetches. Direct Redis reads only.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeSession = decodeSession;
require("server-only");
const headers_1 = require("next/headers");
const jose_1 = require("jose");
const session_store_1 = require("../lib/session-store");
const idp_client_config_1 = require("../lib/idp-client-config");
const app_slug_1 = require("../lib/app-slug");
const startup_init_1 = require("../lib/startup-init");
/**
 * Decode the session from cookies and Redis.
 * Returns null if no valid session exists.
 *
 * @param requestCookies Optional cookie getter for API route context (NextRequest.cookies).
 *                       If omitted, uses next/headers cookies() for server components.
 */
async function decodeSession(requestCookies) {
    try {
        // Ensure startup initialization is complete (Redis, IDP config, etc.)
        await (0, startup_init_1.ensureInitialized)();
        // Get the JWT cookie value
        const cookieStore = requestCookies || (await (0, headers_1.cookies)());
        const sessionCookieName = (0, app_slug_1.getSessionCookieName)();
        const secureCookieName = (0, app_slug_1.getSecureSessionCookieName)();
        const cookieValue = cookieStore.get(secureCookieName)?.value ||
            cookieStore.get(sessionCookieName)?.value;
        if (!cookieValue) {
            return null;
        }
        // Get the NextAuth secret from IDP config
        const config = await (0, idp_client_config_1.getIDPClientConfig)();
        const secret = config.nextAuthSecret;
        if (!secret) {
            console.error('[DECODE-SESSION] No nextAuthSecret available from IDP config');
            return null;
        }
        // Decode the JWT (same pattern as test-aware-get-token.ts)
        const secretKey = new TextEncoder().encode(secret);
        let payload;
        try {
            const result = await (0, jose_1.jwtVerify)(cookieValue, secretKey);
            payload = result.payload;
        }
        catch (jwtError) {
            // JWT decode failed - cookie may be corrupted or secret rotated
            console.warn('[DECODE-SESSION] JWT verification failed:', jwtError instanceof Error ? jwtError.message : String(jwtError));
            return null;
        }
        // Extract the Redis session ID from JWT payload
        const sessionToken = payload.sessionToken || payload.redisSessionId;
        if (!sessionToken) {
            console.warn('[DECODE-SESSION] JWT payload missing sessionToken/redisSessionId');
            return null;
        }
        // Fetch session from Redis (direct, no HTTP)
        const sessionData = await (0, session_store_1.getSession)(sessionToken);
        if (!sessionData) {
            return null;
        }
        return {
            sessionData,
            jwtPayload: payload,
        };
    }
    catch (error) {
        console.error('[DECODE-SESSION] Error:', error instanceof Error ? error.message : String(error));
        return null;
    }
}
