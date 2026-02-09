"use strict";
/**
 * Authentication Verify Code / Complete 2FA API Handler
 *
 * Handles 2FA verification and token updates after successful verification.
 * This handler is designed to be imported and used by Next.js applications
 * using the @payez/next-mvp package.
 *
 * @version 2.0
 * @requires Authentication (authenticated endpoint)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
exports.createVerifyCodeHandler = createVerifyCodeHandler;
const server_1 = require("next/server");
const jwt_1 = require("next-auth/jwt");
const session_store_1 = require("../../lib/session-store");
const app_slug_1 = require("../../lib/app-slug");
/**
 * Creates a verify-code/complete-2FA handler for Next.js API routes
 *
 * @param config Configuration for NextAuth
 * @returns Next.js POST handler function
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/verify-code/route.ts
 * import { createVerifyCodeHandler } from '@payez/next-mvp/api-handlers/auth/verify-code';
 *
 * export const POST = createVerifyCodeHandler({
 *   nextAuthSecret: process.env.NEXTAUTH_SECRET!
 * });
 * ```
 */
function createVerifyCodeHandler(config) {
    const { nextAuthSecret } = config;
    return async function POST(req) {
        try {
            let body;
            try {
                body = await req.json();
            }
            catch (parseError) {
                return server_1.NextResponse.json({ success: false, message: 'Invalid JSON format' }, { status: 400 });
            }
            const { accessToken, refreshToken, accessTokenExpires, refreshTokenExpires } = body;
            // Get current session token from JWT
            let token = await (0, jwt_1.getToken)({ req, secret: nextAuthSecret, cookieName: (0, app_slug_1.getJwtCookieName)() });
            // The sessionToken is stored in the JWT token object
            // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
            const sessionToken = (token?.sessionToken || token?.redisSessionId);
            if (!sessionToken) {
                console.error('[VERIFY-CODE] No session token found in JWT', {
                    hasToken: !!token,
                    tokenKeys: token ? Object.keys(token) : []
                });
                return server_1.NextResponse.json({ success: false, message: 'No session found' }, { status: 401 });
            }
            console.info('[VERIFY-CODE] Updating session with new tokens after 2FA', {
                sessionToken: sessionToken.substring(0, 8) + '...',
                userId: token?.sub,
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken,
                accessTokenLength: accessToken?.length,
                refreshTokenLength: refreshToken?.length
            });
            // Update tokens in Redis
            await (0, session_store_1.updateTokens)(sessionToken, accessToken, refreshToken, accessTokenExpires, refreshTokenExpires);
            // Mark 2FA as complete
            await (0, session_store_1.mark2FAComplete)(sessionToken);
            console.info('[VERIFY-CODE] 2FA completion successful', {
                sessionToken: sessionToken.substring(0, 8) + '...',
                userId: token?.sub
            });
            return server_1.NextResponse.json({
                success: true,
                message: '2FA verification complete'
            });
        }
        catch (error) {
            console.error('[VERIFY-CODE] Failed to complete 2FA', {
                error: error instanceof Error ? error.message : String(error)
            });
            return server_1.NextResponse.json({ success: false, message: 'Failed to complete 2FA' }, { status: 500 });
        }
    };
}
/**
 * Default export for backward compatibility
 * Requires environment variable: NEXTAUTH_SECRET
 */
exports.POST = createVerifyCodeHandler({
    nextAuthSecret: process.env.NEXTAUTH_SECRET || ''
});
