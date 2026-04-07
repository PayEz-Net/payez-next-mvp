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
const auth_1 = require("../../server/auth");
const session_store_1 = require("../../lib/session-store");
/**
 * Creates a verify-code/complete-2FA handler for Next.js API routes.
 *
 * Better Auth resolves its session from cookies, so this handler takes no
 * configuration. Use the default `POST` export below for typical usage.
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/verify-code/route.ts
 * export { POST } from '@payez/next-mvp/api-handlers/auth/verify-code';
 * ```
 */
function createVerifyCodeHandler() {
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
            // Get current session from Better Auth
            const betterAuthSession = await (0, auth_1.getSession)(req);
            const sessionToken = betterAuthSession?.session?.token;
            if (!sessionToken) {
                console.error('[VERIFY-CODE] No session token found', {
                    hasSession: !!betterAuthSession,
                });
                return server_1.NextResponse.json({ success: false, message: 'No session found' }, { status: 401 });
            }
            console.info('[VERIFY-CODE] Updating session with new tokens after 2FA', {
                sessionToken: sessionToken.substring(0, 8) + '...',
                userId: betterAuthSession?.user?.id,
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
                userId: betterAuthSession?.user?.id
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
 * Default POST export — drop-in for `app/api/auth/verify-code/route.ts`.
 */
exports.POST = createVerifyCodeHandler();
