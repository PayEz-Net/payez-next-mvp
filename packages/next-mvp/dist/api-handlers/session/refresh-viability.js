"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const session_store_1 = require("../../lib/session-store");
const refresh_token_validator_1 = require("../../lib/refresh-token-validator");
const test_aware_get_token_1 = require("../../lib/test-aware-get-token");
const logger_1 = require("../../config/logger");
async function GET(req) {
    try {
        const sessionToken = req.nextUrl.searchParams.get('token');
        let finalSessionToken = sessionToken;
        if (!finalSessionToken) {
            const token = await (0, test_aware_get_token_1.getTokenTestAware)(req);
            // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
            finalSessionToken = (token?.sessionToken || token?.redisSessionId);
        }
        if (!finalSessionToken) {
            return server_1.NextResponse.json({ canRefresh: false, reason: 'not_logged_in', sessionToken: null }, { status: 200 });
        }
        const refreshInProgress = await (0, session_store_1.isRefreshInProgress)(finalSessionToken);
        if (refreshInProgress) {
            // Still need to get session data for twoFactorComplete even when refresh is in progress
            const sessionData = await (0, session_store_1.getSession)(finalSessionToken);
            logger_1.logger.info('[REFRESH-VIABILITY] Refresh already in progress, telling middleware to wait', { sessionToken: finalSessionToken.substring(0, 8) + '...' });
            return server_1.NextResponse.json({ canRefresh: true, reason: 'refresh_in_progress', refreshInProgress: true, sessionToken: finalSessionToken, twoFactorComplete: sessionData?.mfaVerified ?? sessionData?.twoFactorComplete ?? false }, { status: 200 });
        }
        const sessionData = await (0, session_store_1.getSession)(finalSessionToken);
        if (!sessionData) {
            return server_1.NextResponse.json({ canRefresh: false, reason: 'session_not_found', sessionToken: finalSessionToken }, { status: 200 });
        }
        const viabilityCheck = (0, refresh_token_validator_1.checkRefreshViability)(sessionData);
        return server_1.NextResponse.json({ canRefresh: viabilityCheck.canRefresh, reason: viabilityCheck.reason, timeRemaining: viabilityCheck.timeRemaining, expiresAt: viabilityCheck.expiresAt, accessTokenExpired: viabilityCheck.accessTokenExpired, accessTokenTimeRemaining: viabilityCheck.accessTokenTimeRemaining, sessionToken: finalSessionToken, twoFactorComplete: sessionData.mfaVerified ?? sessionData.twoFactorComplete ?? false, userId: sessionData.userId, refreshInProgress: false });
    }
    catch (error) {
        logger_1.logger.error('[REFRESH-VIABILITY] Error checking refresh viability', { error: error instanceof Error ? error.message : String(error) });
        return server_1.NextResponse.json({ canRefresh: false, reason: 'check_error', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
