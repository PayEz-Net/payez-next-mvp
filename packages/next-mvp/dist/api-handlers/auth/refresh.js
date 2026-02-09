"use strict";
/**
 * CRITICAL REFRESH TOKEN API HANDLER
 *
 * ASK BEFORE EDITING - TESTED AND WORKING SYSTEM
 *
 * This handler manages the server-side refresh token cycle with:
 * - NextAuth JWT token extraction
 * - Session token fallback for internal calls
 * - PayEz IDP refresh token exchange
 * - Session state updates with new tokens
 * - Proper error handling and logging
 * - Single-use semantics enforcement
 *
 * @version 2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
exports.createRefreshHandler = createRefreshHandler;
const server_1 = require("next/server");
const jwt_1 = require("next-auth/jwt");
const session_store_1 = require("../../lib/session-store");
const token_expiry_1 = require("../../lib/token-expiry");
const app_slug_1 = require("../../lib/app-slug");
const token_utils_1 = require("../../auth/utils/token-utils");
/**
 * Creates a refresh token handler for Next.js API routes
 *
 * @param config Configuration for IDP connection and NextAuth
 * @returns Next.js POST handler function
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/refresh/route.ts
 * import { createRefreshHandler } from '@payez/next-mvp/api-handlers/auth/refresh';
 *
 * export const POST = createRefreshHandler({
 *   idpBaseUrl: process.env.IDP_URL!,
 *   clientId: process.env.CLIENT_ID!,
 *   nextAuthSecret: process.env.NEXTAUTH_SECRET!,
 *   refreshEndpoint: '/api/ExternalAuth/refresh'
 * });
 * ```
 */
function createRefreshHandler(config) {
    const { idpBaseUrl, clientId, nextAuthSecret, refreshEndpoint = '/api/ExternalAuth/refresh' } = config;
    return async function POST(req) {
        try {
            // Extract session token from NextAuth JWT
            const token = await (0, jwt_1.getToken)({ req, secret: nextAuthSecret, cookieName: (0, app_slug_1.getJwtCookieName)() });
            // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
            let sessionToken = (token?.sessionToken || token?.redisSessionId);
            let userId = token?.sub;
            if (!sessionToken) {
                // Fallback: check for session token in header (for internal server-to-server calls)
                const headerSessionToken = req.headers.get('x-session-token');
                if (headerSessionToken) {
                    sessionToken = headerSessionToken;
                    const currentSession = await (0, session_store_1.getSession)(sessionToken);
                    userId = currentSession?.userId || currentSession?.email;
                }
            }
            if (!sessionToken || !userId) {
                console.warn('[AUTH_REFRESH] Missing sessionToken or user id on token');
                return server_1.NextResponse.json({
                    error: 'No session available for refresh',
                    code: 'UNAUTHORIZED'
                }, { status: 401 });
            }
            // Get current session
            const currentSession = await (0, session_store_1.getSession)(sessionToken);
            // NOTE: Field is idpRefreshToken (not refreshToken) per normalized naming convention
            if (!currentSession?.idpRefreshToken) {
                console.warn('[AUTH_REFRESH] No refresh token available', { userId });
                return server_1.NextResponse.json({
                    error: 'No refresh token available',
                    code: 'NO_REFRESH_TOKEN', // Terminal state - session cannot be refreshed
                    terminal: true, // Signal to frontend: don't retry, redirect to login
                    resolution: 'User must re-authenticate'
                }, { status: 401 });
            }
            // ============================================================================
            // HIGH VISIBILITY: PRE-FLIGHT REFRESH DIAGNOSTICS
            // ============================================================================
            const now = Date.now();
            const refreshTokenAge = currentSession.idpRefreshTokenIssuedAt
                ? Math.round((now - currentSession.idpRefreshTokenIssuedAt) / 1000)
                : 'unknown';
            const refreshTokenExpiresIn = currentSession.idpRefreshTokenExpires
                ? Math.round((currentSession.idpRefreshTokenExpires - now) / 1000)
                : 'unknown';
            const accessTokenExpiresIn = currentSession.idpAccessTokenExpires
                ? Math.round((currentSession.idpAccessTokenExpires - now) / 1000)
                : 'unknown';
            console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
            console.log('║                    REFRESH TOKEN ATTEMPT - PRE-FLIGHT                        ║');
            console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
            console.log(`║ User: ${(userId || 'unknown').substring(0, 50).padEnd(50)}                   ║`);
            console.log(`║ Session: ${sessionToken.substring(0, 8)}...                                                        ║`);
            console.log('╠──────────────────────────────────────────────────────────────────────────────╣');
            console.log(`║ Access Token Expires In:  ${String(accessTokenExpiresIn).padEnd(10)} seconds                            ║`);
            console.log(`║ Refresh Token Age:        ${String(refreshTokenAge).padEnd(10)} seconds                            ║`);
            console.log(`║ Refresh Token Expires In: ${String(refreshTokenExpiresIn).padEnd(10)} seconds                            ║`);
            console.log(`║ Refresh Token Length:     ${String(currentSession.idpRefreshToken?.length || 0).padEnd(10)} chars                              ║`);
            console.log(`║ 2FA Complete:             ${String(!!currentSession.mfaVerified).padEnd(10)}                                   ║`);
            console.log(`║ Auth Level (ACR):         ${String(currentSession.authenticationLevel || '1').padEnd(10)}                                   ║`);
            console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
            // Try to acquire refresh lock to prevent concurrent refresh attempts
            const requestId = req.headers.get('x-request-id') ?? `refresh_${Date.now()}`;
            const lockAcquired = await (0, session_store_1.acquireRefreshLock)(sessionToken, requestId, 5000);
            let weAcquiredLock = false;
            let releaseLockVersion;
            if (!lockAcquired.acquired) {
                const existingLock = await (0, session_store_1.checkRefreshLock)(sessionToken);
                if (existingLock && existingLock.acquiredBy === requestId) {
                    console.info('[AUTH_REFRESH] Proceeding under existing caller-held lock', { requestId });
                }
                else {
                    // Wait for the lock to release, then check if token is now fresh
                    console.info('[AUTH_REFRESH] Refresh in progress by another request, waiting for completion...', { requestId });
                    const maxWaitMs = 5000;
                    const checkIntervalMs = 200;
                    const startWait = Date.now();
                    while (Date.now() - startWait < maxWaitMs) {
                        await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
                        // Check if lock was released
                        const lockCheck = await (0, session_store_1.checkRefreshLock)(sessionToken);
                        if (!lockCheck) {
                            // Lock released - check if token is now fresh
                            const refreshedSession = await (0, session_store_1.getSession)(sessionToken);
                            if (refreshedSession?.idpAccessToken && refreshedSession?.idpAccessTokenExpires) {
                                const timeUntilExpiry = refreshedSession.idpAccessTokenExpires - Date.now();
                                const fiveMinutes = 5 * 60 * 1000;
                                if (timeUntilExpiry > fiveMinutes) {
                                    console.info('[AUTH_REFRESH] Lock released, token is fresh - returning success', {
                                        requestId,
                                        accessTokenExpires: new Date(refreshedSession.idpAccessTokenExpires).toISOString(),
                                        waitedMs: Date.now() - startWait,
                                    });
                                    return server_1.NextResponse.json({
                                        refreshed: true,
                                        reason: 'completed_by_concurrent_request',
                                        accessTokenExpires: refreshedSession.idpAccessTokenExpires,
                                        hasRefreshToken: !!refreshedSession.idpRefreshToken,
                                    });
                                }
                            }
                            // Lock released but token not fresh - try to acquire lock ourselves
                            break;
                        }
                    }
                    // Still locked after waiting - return 409
                    console.warn('[AUTH_REFRESH] Refresh still in progress after waiting', { requestId, waitedMs: Date.now() - startWait });
                    return server_1.NextResponse.json({
                        error: 'Refresh already in progress',
                        code: 'CONFLICT'
                    }, { status: 409 });
                }
            }
            else {
                weAcquiredLock = true;
                releaseLockVersion = lockAcquired.lockInfo?.lockVersion;
            }
            // Before performing network refresh, re-check if tokens are already fresh
            const latestAfterLock = await (0, session_store_1.getSession)(sessionToken);
            const fiveMinutes = 5 * 60 * 1000;
            const timeUntilExpiry = latestAfterLock?.idpAccessTokenExpires
                ? latestAfterLock.idpAccessTokenExpires - Date.now()
                : -1;
            // CRITICAL: Also check the actual JWT's exp claim - Redis might have stale data
            let actualJwtExpMs = -1;
            let tokenMismatch = false;
            if (latestAfterLock?.idpAccessToken) {
                try {
                    const tokenParts = latestAfterLock.idpAccessToken.split('.');
                    if (tokenParts.length === 3) {
                        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());
                        actualJwtExpMs = (payload.exp || 0) * 1000;
                        const now = Date.now();
                        // If the actual JWT is expired, we MUST refresh regardless of what Redis says
                        if (actualJwtExpMs < now) {
                            tokenMismatch = true;
                        }
                    }
                }
                catch (e) {
                    // If we can't decode, proceed with normal logic
                }
            }
            console.log('[AUTH_REFRESH] Pre-refresh check:', {
                userId,
                hasAccessToken: !!latestAfterLock?.idpAccessToken,
                accessTokenExpires: latestAfterLock?.idpAccessTokenExpires
                    ? new Date(latestAfterLock.idpAccessTokenExpires).toISOString()
                    : 'undefined',
                actualJwtExp: actualJwtExpMs > 0 ? new Date(actualJwtExpMs).toISOString() : 'unknown',
                now: new Date().toISOString(),
                timeUntilExpiryMs: timeUntilExpiry,
                tokenMismatch,
                willRefresh: timeUntilExpiry <= fiveMinutes || tokenMismatch
            });
            // Only skip refresh if BOTH Redis says fresh AND the actual JWT is not expired
            if (latestAfterLock?.idpAccessToken && latestAfterLock?.idpAccessTokenExpires &&
                timeUntilExpiry > fiveMinutes && !tokenMismatch) {
                console.info('[AUTH_REFRESH] Skipping refresh: tokens already fresh', { userId, timeUntilExpiryMs: timeUntilExpiry });
                if (weAcquiredLock) {
                    await (0, session_store_1.releaseRefreshLock)(sessionToken, requestId, releaseLockVersion);
                    weAcquiredLock = false;
                }
                return server_1.NextResponse.json({
                    refreshed: false,
                    reason: 'already_fresh',
                    accessTokenExpires: latestAfterLock.idpAccessTokenExpires,
                    hasRefreshToken: !!latestAfterLock.idpRefreshToken,
                });
            }
            // If we detected a token mismatch, log it prominently
            if (tokenMismatch) {
                console.warn('[AUTH_REFRESH] Token mismatch detected - forcing refresh despite Redis claiming fresh', {
                    userId,
                    redisExpires: latestAfterLock?.idpAccessTokenExpires ? new Date(latestAfterLock.idpAccessTokenExpires).toISOString() : 'N/A',
                    actualJwtExp: new Date(actualJwtExpMs).toISOString()
                });
            }
            // Copy refresh token for use in IDP call
            // Note: Token is NOT cleared preemptively - it will be replaced on success.
            // The lock mechanism prevents concurrent refresh attempts within the same session.
            // If IDP call fails, user can retry with the same token.
            const originalRefreshToken = currentSession.idpRefreshToken;
            try {
                // Extract 2FA claims from current session
                let authMethods = [];
                if (currentSession.authenticationMethods) {
                    if (typeof currentSession.authenticationMethods === 'string') {
                        try {
                            authMethods = JSON.parse(currentSession.authenticationMethods);
                        }
                        catch (e) {
                            console.warn('[AUTH_REFRESH] Failed to parse authenticationMethods', { authenticationMethods: currentSession.authenticationMethods });
                        }
                    }
                    else if (Array.isArray(currentSession.authenticationMethods)) {
                        authMethods = currentSession.authenticationMethods;
                    }
                }
                // For OAuth sessions with empty AMR claims, provide defaults
                // OAuth IS a form of multi-factor auth (you authenticated with another provider)
                let isOAuthSession = !!currentSession.oauthProvider;
                if (authMethods.length === 0 && isOAuthSession) {
                    // OAuth sessions get default AMR claims
                    authMethods = ['pwd', 'mfa'];
                    console.log('[AUTH_REFRESH] OAuth session with empty AMR - using defaults:', {
                        oauthProvider: currentSession.oauthProvider,
                        defaultAmr: authMethods
                    });
                }
                // Check authMethods first, then fallback to twoFactorMethod field (set by transitionTo2FASession)
                // For OAuth sessions, use 'oauth' as the 2FA method since OAuth itself is the authentication
                const twoFactorMethod = authMethods.find(m => ['sms', 'totp', 'email'].includes(m))
                    || currentSession.mfaMethod
                    || (isOAuthSession ? 'oauth' : null);
                // DEBUG: Log what we have for 2FA
                console.log('[AUTH_REFRESH] 2FA Debug:', {
                    authMethods,
                    authMethodsRaw: currentSession.authenticationMethods,
                    twoFactorMethodFromSession: currentSession.mfaMethod,
                    twoFactorMethodResolved: twoFactorMethod,
                    twoFactorComplete: currentSession.mfaVerified,
                    sessionKeys: Object.keys(currentSession)
                });
                // Build refresh request body per PayEz wire standard (snake_case)
                // See: 2FA-TOKEN-REFRESH-CONTEXT.md - "The Ninja Shit"
                // For OAuth sessions with 2FA complete, use ACR level 2
                let acrValue = String(currentSession.authenticationLevel ?? '1');
                if (currentSession.oauthProvider && currentSession.mfaVerified && acrValue === '1') {
                    acrValue = '2'; // OAuth with 2FA complete = full authentication
                }
                const refreshRequestBody = {
                    refresh_token: originalRefreshToken,
                    amr: authMethods,
                    acr: acrValue
                };
                // DEBUG: Log exact request body
                console.log('[AUTH_REFRESH] Request body:', JSON.stringify({
                    refresh_token: '***REDACTED***',
                    amr: authMethods,
                    acr: acrValue,
                    acrType: typeof acrValue
                }));
                const twoFactorVerified = !!currentSession.mfaVerified;
                if (twoFactorVerified) {
                    refreshRequestBody.two_factor_verified = true;
                }
                if (twoFactorMethod) {
                    refreshRequestBody.two_factor_method = twoFactorMethod;
                }
                if (currentSession.mfaCompletedAt) {
                    refreshRequestBody.two_factor_completed_at = new Date(currentSession.mfaCompletedAt).toISOString();
                }
                // Log the full request details for debugging
                console.log('[AUTH_REFRESH] Sending refresh request:', {
                    url: `${idpBaseUrl}${refreshEndpoint}`,
                    clientId,
                    hasRefreshToken: !!refreshRequestBody.refresh_token,
                    refreshTokenLength: refreshRequestBody.refresh_token?.length,
                    amr: refreshRequestBody.amr,
                    acr: refreshRequestBody.acr
                });
                let refreshResponse;
                try {
                    refreshResponse = await fetch(`${idpBaseUrl}${refreshEndpoint}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Client-Id': clientId,
                        },
                        body: JSON.stringify(refreshRequestBody),
                    });
                }
                catch (fetchError) {
                    // Network error - IDP unreachable
                    // Note: Lock will be released by finally block
                    console.error('[AUTH_REFRESH] IDP unreachable:', {
                        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
                        idpUrl: idpBaseUrl,
                        userId
                    });
                    return server_1.NextResponse.json({
                        error: 'IDP service unavailable',
                        code: 'UPSTREAM_SERVICE_UNAVAILABLE',
                        retryable: true,
                        discardToken: false
                    }, { status: 503 });
                }
                // Parse response body - handle empty or invalid JSON
                let responseData;
                try {
                    const responseText = await refreshResponse.text();
                    if (!responseText || responseText.trim() === '') {
                        // Note: Lock will be released by finally block
                        console.error('[AUTH_REFRESH] Empty response from IDP:', {
                            status: refreshResponse.status,
                            statusText: refreshResponse.statusText,
                            userId
                        });
                        return server_1.NextResponse.json({
                            error: 'Empty response from IDP',
                            code: 'UPSTREAM_SERVICE_ERROR',
                            retryable: true,
                            discardToken: false
                        }, { status: 502 });
                    }
                    responseData = JSON.parse(responseText);
                }
                catch (parseError) {
                    // Note: Lock will be released by finally block
                    console.error('[AUTH_REFRESH] Failed to parse IDP response:', {
                        error: parseError instanceof Error ? parseError.message : String(parseError),
                        status: refreshResponse.status,
                        userId
                    });
                    return server_1.NextResponse.json({
                        error: 'Invalid response from IDP',
                        code: 'UPSTREAM_SERVICE_ERROR',
                        retryable: true,
                        discardToken: false
                    }, { status: 502 });
                }
                // Handle non-OK responses with structured error format
                if (!refreshResponse.ok) {
                    // Parse structured error from IDP
                    const idpError = responseData?.error || {};
                    const errorCode = idpError.code || 'UNKNOWN_ERROR';
                    const errorMessage = idpError.message || 'Token refresh failed';
                    // CRITICAL: 401 means token is definitively invalid - always discard
                    // This prevents redirect loops where viability check keeps returning canRefresh:true
                    const discardToken = refreshResponse.status === 401 || idpError.discard_token === true;
                    const retryable = refreshResponse.status !== 401 && idpError.retryable === true;
                    const resolution = idpError.resolution || null;
                    // ============================================================================
                    // HIGH VISIBILITY: REFRESH TOKEN FAILURE DIAGNOSTICS
                    // ============================================================================
                    // Translate error codes to human-readable explanations
                    const failureReasons = {
                        'UNAUTHORIZED': 'Token was already used (rotation) OR token is expired OR token was revoked',
                        'INVALID_REFRESH_TOKEN': 'Token format invalid OR token not found in IDP database',
                        'TOKEN_EXPIRED': 'Refresh token exceeded its max lifetime',
                        'TOKEN_REVOKED': 'Token was explicitly revoked (logout, password change, admin action)',
                        'TOKEN_REUSE_DETECTED': 'Same refresh token used twice - possible token theft, all tokens revoked',
                        'UPSTREAM_SERVICE_ERROR': 'IDP internal error - token may have been rotated before failure',
                        'INTERNAL_ERROR': 'IDP internal error - check IDP logs for details',
                        'RATE_LIMITED': 'Too many refresh attempts - try again later',
                    };
                    const whyItFailed = failureReasons[errorCode] || 'Unknown error - check IDP logs';
                    console.error('╔══════════════════════════════════════════════════════════════════════════════╗');
                    console.error('║              ❌ REFRESH TOKEN FAILURE - DIAGNOSTIC REPORT                    ║');
                    console.error('╠══════════════════════════════════════════════════════════════════════════════╣');
                    console.error(`║ HTTP Status:    ${String(refreshResponse.status).padEnd(60)}║`);
                    console.error(`║ Error Code:     ${errorCode.padEnd(60)}║`);
                    console.error(`║ Discard Token:  ${String(discardToken).padEnd(60)}║`);
                    console.error(`║ Retryable:      ${String(retryable).padEnd(60)}║`);
                    console.error('╠──────────────────────────────────────────────────────────────────────────────╣');
                    console.error(`║ WHY IT FAILED:                                                               ║`);
                    console.error(`║ ${whyItFailed.substring(0, 76).padEnd(76)} ║`);
                    console.error('╠──────────────────────────────────────────────────────────────────────────────╣');
                    console.error(`║ User:           ${(userId || 'unknown').substring(0, 60).padEnd(60)}║`);
                    console.error(`║ Session:        ${sessionToken.substring(0, 8)}...                                                     ║`);
                    console.error(`║ Resolution:     ${(resolution || 'Check IDP logs').substring(0, 60).padEnd(60)}║`);
                    console.error('╚══════════════════════════════════════════════════════════════════════════════╝');
                    // Also log the full response for detailed debugging
                    console.error('[AUTH_REFRESH] Full IDP error response:', JSON.stringify(responseData, null, 2).substring(0, 1000));
                    // If IDP signals to discard token, clear it from Redis
                    if (discardToken) {
                        console.error('[AUTH_REFRESH] ⚠️ REFRESH_TOKEN_REMOVAL: IDP signaled discard_token', {
                            reason: 'IDP_DISCARD_TOKEN',
                            errorCode,
                            userId,
                            sessionToken: sessionToken.substring(0, 8) + '...',
                            hadRefreshToken: !!currentSession.idpRefreshToken,
                            stack: new Error().stack
                        });
                        await (0, session_store_1.updateSession)(sessionToken, {
                            idpRefreshToken: '',
                            idpRefreshTokenExpires: undefined,
                            refreshTokenClearedAt: Date.now(),
                            refreshTokenClearedReason: `IDP_DISCARD_TOKEN:${errorCode}`
                        });
                    }
                    return server_1.NextResponse.json({
                        error: errorMessage,
                        code: errorCode,
                        discardToken,
                        retryable,
                        resolution,
                        status: refreshResponse.status
                    }, { status: refreshResponse.status });
                }
                // Validate PayEz canonical envelope for success responses
                const isCompliant = responseData && typeof responseData === 'object' &&
                    Object.prototype.hasOwnProperty.call(responseData, 'success') &&
                    (responseData.success === true ? Object.prototype.hasOwnProperty.call(responseData, 'data') : Object.prototype.hasOwnProperty.call(responseData, 'error')) &&
                    Object.prototype.hasOwnProperty.call(responseData, 'meta');
                if (!isCompliant) {
                    console.error('[AUTH_REFRESH] Upstream non-compliant IDP response', { bodySample: responseData });
                    return server_1.NextResponse.json({
                        error: 'Upstream non-compliance',
                        code: 'UPSTREAM_SERVICE_ERROR',
                        retryable: true,
                        discardToken: false
                    }, { status: 502 });
                }
                if (responseData.success !== true || !responseData.data) {
                    // Handle success:false with structured error
                    const idpError = responseData?.error || {};
                    const errorCode = idpError.code || 'UPSTREAM_VALIDATION_ERROR';
                    const discardToken = idpError.discard_token === true;
                    const retryable = idpError.retryable === true;
                    console.warn('[AUTH_REFRESH] IDP refresh unsuccessful', {
                        code: errorCode,
                        discardToken,
                        body: responseData
                    });
                    if (discardToken) {
                        console.error('[AUTH_REFRESH] ⚠️ REFRESH_TOKEN_REMOVAL: IDP success:false with discard_token', {
                            reason: 'IDP_SUCCESS_FALSE_DISCARD',
                            errorCode,
                            userId,
                            sessionToken: sessionToken.substring(0, 8) + '...',
                            hadRefreshToken: !!currentSession.idpRefreshToken,
                            stack: new Error().stack
                        });
                        await (0, session_store_1.updateSession)(sessionToken, {
                            idpRefreshToken: '',
                            idpRefreshTokenExpires: undefined,
                            refreshTokenClearedAt: Date.now(),
                            refreshTokenClearedReason: `IDP_SUCCESS_FALSE_DISCARD:${errorCode}`
                        });
                    }
                    return server_1.NextResponse.json({
                        error: idpError.message || 'Token refresh failed',
                        code: errorCode,
                        discardToken,
                        retryable,
                        resolution: idpError.resolution || null
                    }, { status: refreshResponse.status || 400 });
                }
                // Extract tokens from response
                const payload = responseData.data;
                const accessToken = payload?.access_token;
                const refreshToken = payload?.refresh_token;
                if (!accessToken) {
                    console.error('[AUTH_REFRESH] Missing access token in IDP response');
                    return server_1.NextResponse.json({
                        error: 'Invalid token response from IDP',
                        code: 'INTERNAL_SERVER_ERROR'
                    }, { status: 500 });
                }
                // Decode and compute token expiries
                let decodedAccessToken;
                let accessTokenExpires;
                let computedRefreshTokenExpires;
                try {
                    const result = (0, token_expiry_1.computeTokenExpiries)({ accessToken, refreshToken, preferJwt: true });
                    decodedAccessToken = result.decodedAccessToken;
                    accessTokenExpires = result.accessTokenExpires;
                    computedRefreshTokenExpires = result.refreshTokenExpires;
                    console.info('[AUTH_REFRESH] Successfully decoded new token pair', {
                        accessTokenExpires: new Date(accessTokenExpires).toISOString(),
                        refreshTokenExpires: computedRefreshTokenExpires ? new Date(computedRefreshTokenExpires).toISOString() : null
                    });
                }
                catch (decodeError) {
                    console.error('[AUTH_REFRESH] Failed to compute token expiries', { error: decodeError });
                    return server_1.NextResponse.json({
                        error: 'Failed to decode JWT tokens',
                        code: 'INTERNAL_SERVER_ERROR'
                    }, { status: 500 });
                }
                // Extract 2FA claims from the new access token
                let amrClaims = [];
                if (decodedAccessToken.amr) {
                    try {
                        amrClaims = typeof decodedAccessToken.amr === 'string'
                            ? JSON.parse(decodedAccessToken.amr)
                            : decodedAccessToken.amr;
                    }
                    catch (e) {
                        console.warn('[AUTH_REFRESH] Failed to parse AMR claims', { amr: decodedAccessToken.amr });
                        amrClaims = currentSession.authenticationMethods || [];
                    }
                }
                else {
                    amrClaims = currentSession.authenticationMethods || [];
                }
                const acrLevel = String(decodedAccessToken.acr || currentSession.authenticationLevel || '1');
                // Extract MFA timing claims
                const mfaTime = decodedAccessToken.mfa_time ? parseInt(decodedAccessToken.mfa_time) * 1000 : currentSession.mfaCompletedAt;
                const mfaExpires = decodedAccessToken.mfa_expires ? parseInt(decodedAccessToken.mfa_expires) * 1000 : currentSession.mfaExpiresAt;
                const mfaValidityHours = decodedAccessToken.mfa_validity_hours ? parseInt(decodedAccessToken.mfa_validity_hours) : currentSession.mfaValidityHours;
                // Update session with new tokens
                const hasNewRefresh = typeof refreshToken === 'string' && refreshToken.length > 0;
                const newRefreshTokenExpires = hasNewRefresh ? computedRefreshTokenExpires : undefined;
                // CRITICAL: Log if we're about to clear the refresh token due to missing new token
                if (!hasNewRefresh && currentSession.idpRefreshToken) {
                    console.error('[AUTH_REFRESH] ⚠️ REFRESH_TOKEN_REMOVAL: No new refresh token in IDP response', {
                        reason: 'NO_NEW_REFRESH_TOKEN_IN_RESPONSE',
                        userId,
                        sessionToken: sessionToken.substring(0, 8) + '...',
                        hadRefreshToken: true,
                        refreshTokenFromResponse: refreshToken,
                        refreshTokenType: typeof refreshToken,
                        payloadKeys: Object.keys(payload || {}),
                        stack: new Error().stack
                    });
                }
                // Keep existing refresh token if IDP doesn't provide a new one
                // Only clear if IDP explicitly signals discard_token=true (handled in error paths)
                // NOTE: Use normalized field names (idp* prefix) per SessionData interface
                // CRITICAL: Extract kid from JWT header - IDP may rotate keys during refresh
                const newBearerKeyId = (0, token_utils_1.extractKidFromToken)(accessToken);
                if (newBearerKeyId) {
                    console.log('[AUTH_REFRESH] Extracted bearerKeyId (kid) from new JWT header:', newBearerKeyId);
                }
                else {
                    console.warn('[AUTH_REFRESH] No kid found in new JWT header');
                }
                const sessionUpdate = {
                    ...currentSession,
                    idpAccessToken: accessToken,
                    idpAccessTokenExpires: accessTokenExpires,
                    idpRefreshToken: hasNewRefresh ? refreshToken : currentSession.idpRefreshToken,
                    idpRefreshTokenExpires: hasNewRefresh ? newRefreshTokenExpires : currentSession.idpRefreshTokenExpires,
                    decodedAccessToken: decodedAccessToken,
                    // Bearer key ID from JWT header (may change on key rotation)
                    bearerKeyId: newBearerKeyId || currentSession.bearerKeyId,
                    authenticationMethods: amrClaims,
                    authenticationLevel: acrLevel,
                    mfaVerified: amrClaims.includes('mfa') || currentSession.mfaVerified,
                    mfaCompletedAt: mfaTime,
                    mfaExpiresAt: mfaExpires,
                    mfaValidityHours: mfaValidityHours
                };
                await (0, session_store_1.updateSession)(sessionToken, sessionUpdate);
                console.info('[AUTH_REFRESH] Token refreshed successfully', {
                    expiresAt: new Date(accessTokenExpires).toISOString(),
                    userId,
                    hasNewRefreshToken: hasNewRefresh,
                    tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'none'
                });
            }
            catch (error) {
                console.error('[AUTH_REFRESH] Error during token refresh', { error });
                return server_1.NextResponse.json({
                    error: 'Token refresh error',
                    code: 'INTERNAL_SERVER_ERROR'
                }, { status: 500 });
            }
            finally {
                if (weAcquiredLock) {
                    await (0, session_store_1.releaseRefreshLock)(sessionToken, requestId, releaseLockVersion);
                }
            }
            // Load the latest session to return basic status
            const latest = await (0, session_store_1.getSession)(sessionToken);
            if (!latest?.idpAccessToken) {
                return server_1.NextResponse.json({
                    error: 'No access token after refresh',
                    code: 'INTERNAL_SERVER_ERROR'
                }, { status: 500 });
            }
            return server_1.NextResponse.json({
                refreshed: true,
                accessTokenExpires: latest.idpAccessTokenExpires,
                hasRefreshToken: !!latest.idpRefreshToken,
            });
        }
        catch (err) {
            console.error('[AUTH_REFRESH] Unexpected error', { error: err?.message || String(err) });
            return server_1.NextResponse.json({
                error: 'Unexpected error during refresh',
                code: 'INTERNAL_SERVER_ERROR'
            }, { status: 500 });
        }
    };
}
/**
 * Default export for backward compatibility
 * Requires environment variables: IDP_URL, CLIENT_ID, NEXTAUTH_SECRET
 */
exports.POST = createRefreshHandler({
    idpBaseUrl: process.env.IDP_URL,
    clientId: process.env.CLIENT_ID || 'payez_default_client',
    nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
    refreshEndpoint: '/api/ExternalAuth/refresh'
});
