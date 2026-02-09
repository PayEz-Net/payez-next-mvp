"use strict";
/**
 * Verify Email 2FA Code Handler
 *
 * Verifies the 2FA email verification code and completes the 2FA flow.
 * Updates the session with new tokens upon successful verification.
 *
 * @package @payez/next-mvp
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const idp_fetch_1 = require("../../lib/idp-fetch");
const env_1 = require("../../config/env");
const test_aware_get_token_1 = require("../../lib/test-aware-get-token");
const session_store_1 = require("../../lib/session-store");
const jwt_decode_1 = require("../../lib/jwt-decode");
async function POST(req) {
    try {
        // Parse request body
        const body = await req.json();
        const verificationCode = body.verificationCode || body.verification_code;
        if (!verificationCode) {
            return server_1.NextResponse.json({
                success: false,
                error: 'Verification code is required',
                code: 'INVALID_REQUEST',
            }, { status: 400 });
        }
        // Call IDP using idpFetchJSON which auto-injects Bearer token from Redis session
        const result = await (0, idp_fetch_1.idpFetchJSON)(req, `${env_1.ENV_CONFIG.IDP_URL}/api/ExternalAuth/twofa/email/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verification_code: verificationCode }),
        });
        if (!result.ok) {
            return server_1.NextResponse.json({
                success: false,
                error: result.json?.message || 'Verification failed',
                code: result.json?.code || 'IDP_ERROR',
                meta: { attemptedRefresh: result.attemptedRefresh },
            }, { status: result.status });
        }
        // Unwrap IDP envelope
        const unwrappedData = result.json?.data || result.json;
        // If we have new tokens, update the session to complete 2FA
        if (unwrappedData.access_token && unwrappedData.refresh_token) {
            // Get session token from NextAuth
            // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
            const token = await (0, test_aware_get_token_1.getTokenTestAware)(req);
            const sessionToken = (token?.sessionToken || token?.redisSessionId);
            if (sessionToken) {
                console.log('[VERIFY_EMAIL] Updating session with new tokens');
                // Decode access token to get actual expiration
                let accessTokenExpires = Date.now() + (15 * 60 * 1000); // Default: 15 minutes
                try {
                    const decoded = (0, jwt_decode_1.jwtDecode)(unwrappedData.access_token);
                    if (decoded?.exp) {
                        accessTokenExpires = decoded.exp * 1000; // Convert to milliseconds
                    }
                }
                catch (err) {
                    console.warn('[VERIFY_EMAIL] Could not decode access token, using default expiration');
                }
                // Decode refresh token to get actual expiration (optional)
                let refreshTokenExpires = Date.now() + (3 * 24 * 60 * 60 * 1000); // Default: 3 days
                try {
                    const decoded = (0, jwt_decode_1.jwtDecode)(unwrappedData.refresh_token);
                    if (decoded?.exp) {
                        refreshTokenExpires = decoded.exp * 1000;
                    }
                }
                catch {
                    // Refresh token may not have exp claim, use default
                }
                // Update session with new tokens and mark 2FA complete
                await (0, session_store_1.transitionTo2FASession)(sessionToken, {
                    accessToken: unwrappedData.access_token,
                    refreshToken: unwrappedData.refresh_token,
                    accessTokenExpires,
                    refreshTokenExpires
                }, 'email' // Store 2FA method for refresh token flow
                );
                console.log('[VERIFY_EMAIL] Session updated successfully', {
                    accessTokenExpires: new Date(accessTokenExpires).toISOString(),
                    refreshTokenExpires: new Date(refreshTokenExpires).toISOString()
                });
            }
        }
        // Return simplified success response (don't expose tokens to client)
        return server_1.NextResponse.json({
            success: true,
            verificationSuccessful: true,
            twoFactorSessionVerified: true,
            message: unwrappedData.message || 'Email code verified successfully'
        }, { status: 200 });
    }
    catch (error) {
        console.error('[VERIFY_EMAIL] Error:', error);
        return server_1.NextResponse.json({
            success: false,
            error: 'Failed to verify code',
            code: 'INTERNAL_ERROR',
        }, { status: 500 });
    }
}
