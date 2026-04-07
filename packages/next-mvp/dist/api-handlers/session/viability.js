"use strict";
/**
 * Session Viability Check API Handler for `@payez/next-mvp`
 *
 * This API route is called by the middleware to securely check if a session is valid.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const session_store_1 = require("../../lib/session-store");
const auth_1 = require("../../server/auth");
const startup_init_1 = require("../../lib/startup-init");
const idp_client_config_1 = require("../../lib/idp-client-config");
async function GET(req) {
    try {
        // Ensure initialization is complete (auth signing secret resolved from IDP)
        if (!process.env.BETTER_AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
            try {
                await (0, startup_init_1.ensureInitialized)();
            }
            catch (error) {
                // Initialization failed - return 503
                console.error('[API Viability] Initialization failed - returning 503');
                return server_1.NextResponse.json({
                    error: 'Service Unavailable',
                    message: 'Authentication service is not properly configured',
                    code: 'AUTH_NOT_INITIALIZED'
                }, { status: 503 });
            }
        }
        // Double-check after initialization attempt
        if ((0, startup_init_1.isInitializationFailed)()) {
            console.error('[API Viability] Initialization failed - returning 503');
            return server_1.NextResponse.json({
                error: 'Service Unavailable',
                message: 'Authentication service is not properly configured',
                code: 'AUTH_NOT_INITIALIZED'
            }, { status: 503 });
        }
        // Get session from Better Auth
        const betterAuthSession = await (0, auth_1.getSession)(req);
        // Debug logging
        if (!betterAuthSession) {
            console.warn('[VIABILITY] getSession returned null');
        }
        const sessionToken = betterAuthSession?.session?.token;
        if (betterAuthSession && sessionToken) {
            // Try legacy session store first, then Better Auth format
            let sessionData = await (0, session_store_1.getSession)(sessionToken);
            if (!sessionData) {
                // Better Auth stores sessions with ba:{appSlug}:{token} prefix
                sessionData = await (0, session_store_1.getBetterAuthSession)(sessionToken);
                if (sessionData) {
                    console.log('[VIABILITY] Found session in Better Auth store');
                }
            }
            if (sessionData) {
                // The session exists in Redis
                // Check if access token is expired (for middleware decision-making)
                const accessTokenExpires = sessionData.idpAccessTokenExpires || 0;
                const accessTokenExpired = accessTokenExpires < Date.now();
                // Get requires2FA from cached client config (not session)
                // This is a client-wide setting from the broker handshake
                let requires2FA = true; // Default to true for security
                try {
                    const cachedConfig = await (0, idp_client_config_1.getIDPClientConfig)();
                    requires2FA = cachedConfig.authSettings?.require2FA ?? true;
                }
                catch (e) {
                    console.warn('[API Viability] Could not get client config, defaulting requires2FA to true');
                }
                // CRITICAL: Check if MFA has expired (2FA TTL enforcement)
                // The session may have mfaVerified=true from days ago, but if mfaExpiresAt
                // has passed, we must treat 2FA as incomplete to force re-verification.
                const mfaExpiresAt = sessionData.mfaExpiresAt || 0;
                const mfaExpired = mfaExpiresAt > 0 && mfaExpiresAt < Date.now();
                // Check both field names for compatibility (mfaVerified is the normalized name)
                const sessionMfaComplete = sessionData.mfaVerified ?? sessionData.twoFactorComplete ?? false;
                const effectiveTwoFactorComplete = sessionMfaComplete && !mfaExpired;
                console.log('[VIABILITY] Session 2FA check:', {
                    sessionToken: sessionToken.substring(0, 8) + '...',
                    mfaVerified: sessionData.mfaVerified,
                    twoFactorComplete: sessionData.twoFactorComplete,
                    sessionMfaComplete,
                    mfaExpired,
                    effectiveTwoFactorComplete,
                });
                if (mfaExpired && sessionMfaComplete) {
                    console.warn('[API Viability] MFA expired - forcing 2FA re-verification', {
                        mfaExpiresAt: new Date(mfaExpiresAt).toISOString(),
                        now: new Date().toISOString(),
                        hoursExpiredAgo: ((Date.now() - mfaExpiresAt) / (1000 * 60 * 60)).toFixed(1)
                    });
                }
                const response = {
                    authenticated: true,
                    sessionToken, // Include token for middleware tracking
                    // 2FA fields - critical for middleware redirect logic
                    requires2FA, // From cached client config (client-wide setting)
                    twoFactorComplete: effectiveTwoFactorComplete, // From session, BUT respects MFA TTL
                    // Token status for refresh decisions
                    accessTokenExpired,
                    hasRefreshToken: !!sessionData.idpRefreshToken
                };
                return server_1.NextResponse.json(response);
            }
            // CRITICAL: Cookie exists but Redis session is missing (stale cookie state)
            // Return sessionToken so middleware can detect this and clear the stale cookie
            console.warn('[VIABILITY] Stale cookie detected - session not in Redis');
            return server_1.NextResponse.json({
                authenticated: false,
                sessionToken // Include token to enable stale cookie detection
            });
        }
        // If there's no token at all, it's not authenticated
        return server_1.NextResponse.json({ authenticated: false });
    }
    catch (error) {
        console.error('[API Viability] Error checking session viability:', error);
        return server_1.NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
