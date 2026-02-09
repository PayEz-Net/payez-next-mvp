"use strict";
"use client";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.standardizedApi = exports.ApiNetworkError = exports.ApiValidationError = exports.ApiBusinessLogicError = exports.ApiResponseFormatError = void 0;
exports.isApiSuccess = isApiSuccess;
exports.isApiPagedSuccess = isApiPagedSuccess;
exports.isApiError = isApiError;
exports.extractApiData = extractApiData;
exports.extractApiItems = extractApiItems;
// ========================================================================================
// BULLETPROOF STANDARDIZED CLIENT API - ZERO TOLERANCE FOR BAD RESPONSES
// ========================================================================================
// This client API ENFORCES the standardized response format
// It will BREAK if APIs don't return the expected structure
// NO MORE GUESSING data.data.data.data - EVER AGAIN!
// ========================================================================================
const react_1 = require("next-auth/react");
const api_responses_1 = require("./types/api-responses");
// ========================================================================================
// CLIENT API ERROR TYPES
// ========================================================================================
/**
 * ERROR THROWN WHEN API RESPONSE FORMAT IS INVALID
 * This means the API is NOT following our standardized format
 */
class ApiResponseFormatError extends Error {
    endpoint;
    rawResponse;
    constructor(message, endpoint, rawResponse) {
        super(`API_FORMAT_ERROR: ${message}`);
        this.endpoint = endpoint;
        this.rawResponse = rawResponse;
        this.name = 'ApiResponseFormatError';
    }
}
exports.ApiResponseFormatError = ApiResponseFormatError;
/**
 * ERROR THROWN WHEN API RETURNS A STANDARDIZED ERROR RESPONSE
 * This is a properly formatted error from the API
 */
class ApiBusinessLogicError extends Error {
    errorCode;
    operation;
    details;
    constructor(errorCode, message, operation, details) {
        super(message);
        this.errorCode = errorCode;
        this.operation = operation;
        this.details = details;
        this.name = 'ApiBusinessLogicError';
    }
}
exports.ApiBusinessLogicError = ApiBusinessLogicError;
/**
 * ERROR THROWN WHEN VALIDATION FAILS
 * This is a properly formatted validation error from the API
 */
class ApiValidationError extends Error {
    operation;
    validationErrors;
    invalidValue;
    primaryField;
    constructor(message, operation, validationErrors, invalidValue, primaryField) {
        super(message);
        this.operation = operation;
        this.validationErrors = validationErrors;
        this.invalidValue = invalidValue;
        this.primaryField = primaryField;
        this.name = 'ApiValidationError';
    }
}
exports.ApiValidationError = ApiValidationError;
/**
 * ERROR THROWN WHEN NETWORK/HTTP ISSUES OCCUR
 */
class ApiNetworkError extends Error {
    status;
    endpoint;
    constructor(message, status, endpoint) {
        super(`NETWORK_ERROR: ${message}`);
        this.status = status;
        this.endpoint = endpoint;
        this.name = 'ApiNetworkError';
    }
}
exports.ApiNetworkError = ApiNetworkError;
// ========================================================================================
// AUTHENTICATION STATE MANAGEMENT
// ========================================================================================
// Coordinate client-side refresh to avoid duplicate refresh calls racing with
// server-side middleware or other tabs. Only one refresh runs at a time.
let refreshInFlight = null;
// Enhanced redirect logic with grace period and retry attempts
let authRedirectScheduled = false;
let lastAuthFailureTime = 0;
let consecutiveAuthFailures = 0;
const AUTH_FAILURE_GRACE_PERIOD = 2000; // 2 seconds grace period
const MAX_AUTH_FAILURES_BEFORE_REDIRECT = 2; // Allow 2 failures before redirect
const AUTH_FAILURE_RESET_WINDOW = 30000; // Reset failure count after 30 seconds
// Helper: detect pre-2FA session (session exists, requires 2FA and not completed)
function isPreTwoFactorSession(session) {
    return !!(session?.user?.requiresTwoFactor && !session?.user?.twoFactorSessionVerified);
}
// Reset auth failure state on successful requests
function resetAuthFailureState() {
    if (consecutiveAuthFailures > 0) {
        console.log(`✅ Resetting auth failure state (was ${consecutiveAuthFailures} failures)`);
        consecutiveAuthFailures = 0;
        lastAuthFailureTime = 0;
        authRedirectScheduled = false;
    }
}
function scheduleLoginRedirect(isImmediate = false) {
    if (authRedirectScheduled)
        return;
    const now = Date.now();
    // Reset consecutive failures if enough time has passed
    if (now - lastAuthFailureTime > AUTH_FAILURE_RESET_WINDOW) {
        consecutiveAuthFailures = 0;
    }
    consecutiveAuthFailures++;
    lastAuthFailureTime = now;
    console.warn(`🔴 Auth failure #${consecutiveAuthFailures}, immediate: ${isImmediate}`);
    // Only redirect if we've had multiple failures or if explicitly requested
    if (!isImmediate && consecutiveAuthFailures < MAX_AUTH_FAILURES_BEFORE_REDIRECT) {
        console.log(`⏳ Delaying redirect - only ${consecutiveAuthFailures} failures so far`);
        return;
    }
    authRedirectScheduled = true;
    const redirectFunction = () => {
        try {
            const returnUrl = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
            console.warn(`🔄 Redirecting to login with return URL: ${returnUrl}`);
            window.location.href = `/account-auth/login?returnUrl=${returnUrl}`;
        }
        catch (error) {
            console.error('❌ Error during login redirect:', error);
            // Final fallback
            try {
                window.location.href = '/account-auth/login';
            }
            catch {
                // no-op if window is not available
            }
        }
    };
    if (isImmediate) {
        // Immediate redirect for critical auth failures
        redirectFunction();
    }
    else {
        // Small delay to allow any pending requests to complete
        console.log(`⏳ Scheduling redirect with ${AUTH_FAILURE_GRACE_PERIOD}ms grace period`);
        setTimeout(redirectFunction, AUTH_FAILURE_GRACE_PERIOD);
    }
}
// ========================================================================================
// BULLETPROOF CLIENT API SERVICE
// ========================================================================================
class StandardizedClientApiService {
    baseUrl;
    constructor() {
        this.baseUrl = '';
    }
    /**
     * MAKES HTTP REQUEST AND VALIDATES RESPONSE FORMAT
     * This method ENFORCES standardized response format compliance
     * Will throw ApiResponseFormatError if format is invalid
     */
    async makeRequest(endpoint, options = {}, sessionToken) {
        const fullEndpoint = `${this.baseUrl}${endpoint}`;
        try {
            // Use provided token or get from NextAuth session
            const currentSession = await (0, react_1.getSession)();
            let token = sessionToken || currentSession?.accessToken;
            // Preflight freshness check: if token is near expiry, coordinate refresh BEFORE making request
            const pre2FA = isPreTwoFactorSession(currentSession);
            const hasRefresh = !!currentSession?.refreshToken;
            if (!pre2FA && hasRefresh) {
                try {
                    let timeLeft = null;
                    if (currentSession?.accessTokenExpires) {
                        timeLeft = currentSession.accessTokenExpires - Date.now();
                    }
                    else if (token) {
                        // Fallback decode only if session did not include expiry
                        const { jwtDecode } = await Promise.resolve().then(() => __importStar(require('./jwt-decode-client')));
                        const decoded = jwtDecode(token);
                        const expMs = decoded?.exp ? decoded.exp * 1000 : 0;
                        timeLeft = expMs - Date.now();
                    }
                    // Refresh if <= 60s remaining (or already expired)
                    if (timeLeft !== null && !Number.isNaN(timeLeft) && timeLeft <= 60000) {
                        console.log(`⏳ Access token expiring soon (${Math.floor(timeLeft / 1000)}s). Coordinating refresh before request...`);
                        if (!refreshInFlight) {
                            refreshInFlight = (async () => {
                                const reqId = crypto.randomUUID();
                                const rr = await fetch('/api/auth/refresh', {
                                    method: 'POST',
                                    credentials: 'include',
                                    headers: { 'X-Request-ID': reqId },
                                });
                                if (rr.ok || rr.status === 409) {
                                    // ok or in-progress; give it a beat in case of 409
                                    if (rr.status === 409)
                                        await new Promise(r => setTimeout(r, 1200));
                                    return true;
                                }
                                if (rr.status === 401 || rr.status === 403) {
                                    scheduleLoginRedirect();
                                    throw new ApiNetworkError('Authentication failed - unable to refresh session', rr.status, endpoint);
                                }
                                const et = await rr.text();
                                throw new ApiNetworkError(et || 'Token refresh failed', rr.status, endpoint);
                            })().finally(() => { refreshInFlight = null; });
                        }
                        await refreshInFlight;
                        const newSessionAfter = await (0, react_1.getSession)();
                        token = newSessionAfter?.accessToken || token;
                    }
                }
                catch (preErr) {
                    console.warn('Preflight token freshness check failed (continuing to attempt request):', preErr);
                }
            }
            else {
                // Elegantly skip preflight refresh in pre-2FA window or when no refresh token exists
                if (pre2FA) {
                    console.log('⏭️ Skipping preflight refresh: 2FA not complete (no refresh allowed yet)');
                }
                else if (!hasRefresh) {
                    console.log('⏭️ Skipping preflight refresh: no refresh token present');
                }
            }
            const config = {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                    ...options.headers,
                },
            };
            console.log(`🔄 API Request: ${options.method || 'GET'} ${fullEndpoint}`);
            const response = await fetch(fullEndpoint, config);
            if (!response.ok) {
                // Handle coordination blocking (503) with auto-retry
                if (response.status === 503) {
                    console.log('🔄 Got 503 Service Unavailable, attempting auto-retry for coordination...');
                    // Parse Retry-After header (in seconds)
                    const retryAfterHeader = response.headers.get('Retry-After');
                    let retryAfterSeconds = 1; // Default to 1 second
                    if (retryAfterHeader && /^\d+$/.test(retryAfterHeader)) {
                        retryAfterSeconds = parseInt(retryAfterHeader, 10);
                    }
                    const baseDelayMs = retryAfterSeconds * 1000;
                    const maxRetries = 3;
                    for (let attempt = 1; attempt <= maxRetries; attempt++) {
                        // Add jitter to prevent thundering herd
                        const jitterMs = Math.floor(Math.random() * 300) - 150; // ±150ms jitter
                        const exponentialBackoff = Math.pow(1.5, attempt - 1); // Mild exponential backoff
                        const delayMs = Math.max(100, baseDelayMs * exponentialBackoff + jitterMs);
                        console.log(`🔄 503 retry attempt ${attempt}/${maxRetries}, waiting ${delayMs}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                        try {
                            const retryResponse = await fetch(fullEndpoint, config);
                            if (retryResponse.ok) {
                                console.log(`✅ 503 retry attempt ${attempt} succeeded`);
                                const rawData = await retryResponse.json();
                                resetAuthFailureState();
                                // COMPATIBILITY MODE: Handle both formats
                                if (rawData && typeof rawData === 'object' && 'success' in rawData) {
                                    const validatedResponse = (0, api_responses_1.validateStandardizedResponse)(rawData, endpoint);
                                    return this.convertToApiResult(validatedResponse);
                                }
                                else {
                                    // New format - raw data
                                    const wrappedResponse = {
                                        success: true,
                                        data: rawData,
                                        message: 'Success',
                                        operation_code: 'RAW_RESPONSE',
                                        timestamp: new Date().toISOString()
                                    };
                                    return wrappedResponse;
                                }
                            }
                            // If we get another 503, continue retrying
                            if (retryResponse.status === 503) {
                                console.log(`🔄 503 retry attempt ${attempt} got another 503, will retry...`);
                                continue;
                            }
                            // If we get a different error, break and handle it normally
                            console.log(`❌ 503 retry attempt ${attempt} got ${retryResponse.status}, stopping retries`);
                            // Fall through to handle the retry response error
                            const errorText = await retryResponse.text();
                            let errorData;
                            try {
                                errorData = JSON.parse(errorText);
                                if (errorData && typeof errorData === 'object' && 'success' in errorData) {
                                    // Detect PayEz canonical error envelope and map accordingly
                                    if (errorData.error && typeof errorData.error === 'object') {
                                        const reqIdHeader = retryResponse.headers.get('X-Request-ID') || retryResponse.headers.get('X-Correlation-ID');
                                        const reqIdBody = errorData?.request_id || errorData?.requestId;
                                        const errorResult = {
                                            success: false,
                                            error_code: errorData?.error?.code || errorData?.error_code || errorData?.code || `HTTP_${retryResponse.status}`,
                                            message: errorData?.error?.message || errorData?.message || `Request failed with status ${retryResponse.status}`,
                                            operation: endpoint,
                                            details: (errorData?.error?.details ?? errorData?.details) || undefined,
                                            ...(reqIdBody || reqIdHeader ? { request_id: (reqIdBody || reqIdHeader) } : {})
                                        };
                                        return errorResult;
                                    }
                                    // Otherwise attempt to validate as our standardized error shape
                                    const validatedError = (0, api_responses_1.validateStandardizedResponse)(errorData, endpoint);
                                    return this.convertToApiResult(validatedError);
                                }
                                else {
                                    // New/unknown error format - best-effort mapping
                                    const reqIdHeader = retryResponse.headers.get('X-Request-ID') || retryResponse.headers.get('X-Correlation-ID');
                                    const reqIdBody = errorData?.request_id || errorData?.requestId;
                                    const errorResult = {
                                        success: false,
                                        error_code: errorData?.error_code || errorData?.code || `HTTP_${retryResponse.status}`,
                                        message: errorData?.message || (typeof errorData?.error === 'string' ? errorData.error : errorData?.error?.message) || errorText || `Request failed with status ${retryResponse.status}`,
                                        operation: endpoint,
                                        details: (errorData?.error?.details ?? errorData?.details) || undefined,
                                        ...(reqIdBody || reqIdHeader ? { request_id: (reqIdBody || reqIdHeader) } : {})
                                    };
                                    return errorResult;
                                }
                            }
                            catch {
                                const reqIdHeader2 = retryResponse.headers.get('X-Request-ID') || retryResponse.headers.get('X-Correlation-ID');
                                const errorResult = {
                                    success: false,
                                    error_code: `HTTP_${retryResponse.status}`,
                                    message: errorText || `Request failed with status ${retryResponse.status}`,
                                    operation: endpoint,
                                    ...(reqIdHeader2 ? { request_id: reqIdHeader2 } : {})
                                };
                                return errorResult;
                            }
                        }
                        catch (retryError) {
                            console.log(`❌ 503 retry attempt ${attempt} failed with network error:`, retryError);
                            if (attempt === maxRetries) {
                                // If all retries failed with network errors, throw the original error
                                throw new ApiNetworkError('Service temporarily unavailable after retries', 503, endpoint);
                            }
                            continue;
                        }
                    }
                    // If we got here, all retries failed - fall through to normal error handling
                    console.log('❌ All 503 retry attempts exhausted, treating as error');
                }
                // Handle authentication errors with a single refresh+retry
                if (response.status === 401) {
                    console.log('🔑 Got 401, checking if we have a session to refresh...');
                    // CRITICAL FIX: Check if we actually have a session before attempting refresh
                    const currentSession = await (0, react_1.getSession)();
                    if (!currentSession || !currentSession.accessToken) {
                        console.log('🚫 No valid session found, redirecting to login instead of refresh');
                        scheduleLoginRedirect(true); // Immediate redirect
                        throw new ApiNetworkError('Authentication required - no valid session', 401, endpoint);
                    }
                    // Elegantly gate refresh during pre-2FA or when no refresh token exists
                    const pre2FA_now = isPreTwoFactorSession(currentSession);
                    const hasRefresh_now = !!currentSession?.refreshToken;
                    if (pre2FA_now || !hasRefresh_now) {
                        console.log('⏭️ Skipping 401-driven refresh:', {
                            reason: pre2FA_now ? 'pre-2FA session' : 'no refresh token',
                            requiresTwoFactor: currentSession?.user?.requiresTwoFactor,
                            twoFactorVerified: currentSession?.user?.twoFactorSessionVerified,
                            hasRefreshToken: hasRefresh_now
                        });
                        // CRITICAL: Redirect to login immediately if refresh is impossible
                        console.log('🚫 Cannot refresh session, redirecting to login');
                        scheduleLoginRedirect(true); // Immediate redirect
                        throw new ApiNetworkError(pre2FA_now
                            ? 'Two-factor authentication required'
                            : 'Session expired - refresh token unavailable', 401, endpoint);
                    }
                    console.log('🔑 Valid session found, attempting token refresh...');
                    // Try to refresh the token, but coordinate to avoid double refresh
                    if (!refreshInFlight) {
                        refreshInFlight = (async () => {
                            const reqId = crypto.randomUUID();
                            const refreshResponse = await fetch('/api/auth/refresh', {
                                method: 'POST',
                                credentials: 'include',
                                headers: { 'X-Request-ID': reqId },
                            });
                            if (refreshResponse.ok) {
                                console.log('✅ Token refreshed successfully (client-side coordinator)');
                                return true;
                            }
                            // If refresh is already in progress server-side, wait briefly and allow retry
                            if (refreshResponse.status === 409) {
                                console.log('↪️ Refresh in progress server-side (409). Waiting for completion...');
                                await new Promise(r => setTimeout(r, 1500));
                                return true;
                            }
                            // For auth failures, schedule redirect; for others, throw
                            if (refreshResponse.status === 401 || refreshResponse.status === 403) {
                                scheduleLoginRedirect();
                                throw new ApiNetworkError('Authentication failed - unable to refresh session', refreshResponse.status, endpoint);
                            }
                            const errorText = await refreshResponse.text();
                            throw new ApiNetworkError(errorText || 'Token refresh failed', refreshResponse.status, endpoint);
                        })().finally(() => { refreshInFlight = null; });
                    }
                    try {
                        await refreshInFlight;
                    }
                    catch (e) {
                        throw e; // bubble up to caller handling
                    }
                    console.log('🔁 Retrying original request after coordinated refresh...');
                    // Get the new session and retry the original request
                    const newSession = await (0, react_1.getSession)();
                    const newToken = newSession?.accessToken;
                    const retryConfig = {
                        ...options,
                        headers: {
                            'Content-Type': 'application/json',
                            ...(newToken && { 'Authorization': `Bearer ${newToken}` }),
                            ...options.headers,
                        },
                    };
                    const retryResponse = await fetch(fullEndpoint, retryConfig);
                    if (retryResponse.ok) {
                        const rawData = await retryResponse.json();
                        // Reset auth failure state on successful retry
                        resetAuthFailureState();
                        // COMPATIBILITY MODE: Handle both formats in retry as well
                        if (rawData && typeof rawData === 'object' && 'success' in rawData) {
                            const validatedResponse = (0, api_responses_1.validateStandardizedResponse)(rawData, endpoint);
                            return this.convertToApiResult(validatedResponse);
                        }
                        else {
                            // New format - raw data
                            console.log(`🔄 Converting raw retry response to standardized format for ${endpoint}`);
                            const wrappedResponse = {
                                success: true,
                                data: rawData,
                                message: 'Success',
                                operation_code: 'RAW_RESPONSE',
                                timestamp: new Date().toISOString()
                            };
                            return wrappedResponse;
                        }
                    }
                    else {
                        // If retry still 401, schedule redirect
                        if (retryResponse.status === 401) {
                            scheduleLoginRedirect();
                        }
                        const errorText = await retryResponse.text();
                        let errorData;
                        try {
                            errorData = JSON.parse(errorText);
                            // Check if it has the success field (old format)
                            if (errorData && typeof errorData === 'object' && 'success' in errorData) {
                                // Detect PayEz canonical error envelope and map accordingly
                                if (errorData.error && typeof errorData.error === 'object') {
                                    const reqIdHeader = retryResponse.headers.get('X-Request-ID') || retryResponse.headers.get('X-Correlation-ID');
                                    const reqIdBody = errorData?.request_id || errorData?.requestId;
                                    const errorResult = {
                                        success: false,
                                        error_code: errorData?.error?.code || errorData?.error_code || errorData?.code || `HTTP_${retryResponse.status}`,
                                        message: errorData?.error?.message || errorData?.message || `Request failed with status ${retryResponse.status}`,
                                        operation: endpoint,
                                        details: (errorData?.error?.details ?? errorData?.details) || undefined,
                                        ...(reqIdBody || reqIdHeader ? { request_id: (reqIdBody || reqIdHeader) } : {})
                                    };
                                    return errorResult;
                                }
                                const validatedError = (0, api_responses_1.validateStandardizedResponse)(errorData, endpoint);
                                return this.convertToApiResult(validatedError);
                            }
                            else {
                                // New format - convert raw error to standardized format
                                const reqIdHeader = retryResponse.headers.get('X-Request-ID') || retryResponse.headers.get('X-Correlation-ID');
                                const reqIdBody = errorData?.request_id || errorData?.requestId;
                                const errorResult = {
                                    success: false,
                                    error_code: errorData?.error_code || errorData?.code || `HTTP_${retryResponse.status}`,
                                    message: errorData?.message || (typeof errorData?.error === 'string' ? errorData.error : errorData?.error?.message) || errorText || `Request failed with status ${retryResponse.status}`,
                                    operation: endpoint,
                                    details: (errorData?.error?.details ?? errorData?.details) || undefined,
                                    ...(reqIdBody || reqIdHeader ? { request_id: (reqIdBody || reqIdHeader) } : {})
                                };
                                return errorResult;
                            }
                        }
                        catch {
                            // If we can't parse the error, create a generic error response
                            const reqIdHeader = retryResponse.headers.get('X-Request-ID') || retryResponse.headers.get('X-Correlation-ID');
                            const errorResult = {
                                success: false,
                                error_code: `HTTP_${retryResponse.status}`,
                                message: errorText || `Request failed with status ${retryResponse.status}`,
                                operation: endpoint,
                                ...(reqIdHeader ? { request_id: reqIdHeader } : {})
                            };
                            return errorResult;
                        }
                    }
                }
                // Non-401 error: try to parse as standardized error response
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                    // Check if it has the success field (old format)
                    if (errorData && typeof errorData === 'object' && 'success' in errorData) {
                        // Detect PayEz canonical error envelope and map accordingly
                        if (errorData.error && typeof errorData.error === 'object') {
                            const reqIdHeader = response.headers.get('X-Request-ID') || response.headers.get('X-Correlation-ID');
                            const reqIdBody = errorData?.request_id || errorData?.requestId;
                            const errorResult = {
                                success: false,
                                error_code: errorData?.error?.code || errorData?.error_code || errorData?.code || `HTTP_${response.status}`,
                                message: errorData?.error?.message || errorData?.message || `Request failed with status ${response.status}`,
                                operation: endpoint,
                                details: (errorData?.error?.details ?? errorData?.details) || undefined,
                                validation_errors: errorData?.validation_errors || undefined,
                                ...(reqIdBody || reqIdHeader ? { request_id: (reqIdBody || reqIdHeader) } : {})
                            };
                            return errorResult;
                        }
                        const validatedError = (0, api_responses_1.validateStandardizedResponse)(errorData, endpoint);
                        return this.convertToApiResult(validatedError);
                    }
                    else {
                        // New format - convert raw error to standardized format
                        const reqIdHeader = response.headers.get('X-Request-ID') || response.headers.get('X-Correlation-ID');
                        const reqIdBody = errorData?.request_id || errorData?.requestId;
                        const errorResult = {
                            success: false,
                            error_code: errorData?.error_code || errorData?.code || `HTTP_${response.status}`,
                            message: errorData?.message || (typeof errorData?.error === 'string' ? errorData.error : errorData?.error?.message) || errorText || `Request failed with status ${response.status}`,
                            operation: endpoint,
                            details: (errorData?.error?.details ?? errorData?.details) || undefined,
                            validation_errors: errorData?.validation_errors || undefined,
                            ...(reqIdBody || reqIdHeader ? { request_id: (reqIdBody || reqIdHeader) } : {})
                        };
                        return errorResult;
                    }
                }
                catch (parseError) {
                    // If we can't parse the error, create a generic error response
                    const reqIdHeader = response.headers.get('X-Request-ID') || response.headers.get('X-Correlation-ID');
                    const errorResult = {
                        success: false,
                        error_code: `HTTP_${response.status}`,
                        message: errorText || `Request failed with status ${response.status}`,
                        operation: endpoint,
                        details: undefined,
                        ...(reqIdHeader ? { request_id: reqIdHeader } : {})
                    };
                    return errorResult;
                }
            }
            // SUCCESS PATH: Parse and validate response
            const rawData = await response.json();
            // Reset auth failure state on successful request
            resetAuthFailureState();
            // COMPATIBILITY MODE: Handle both old envelope format and new raw format
            try {
                // First check if it's the old standardized format with success field
                if (rawData && typeof rawData === 'object' && 'success' in rawData) {
                    // Old format - validate as standardized response
                    const validatedResponse = (0, api_responses_1.validateStandardizedResponse)(rawData, endpoint);
                    return this.convertToApiResult(validatedResponse);
                }
                else {
                    // New format - raw data, wrap it in success envelope for compatibility
                    console.log(`🔄 Converting raw response to standardized format for ${endpoint}`);
                    const wrappedResponse = {
                        success: true,
                        data: rawData,
                        message: 'Success',
                        operation_code: 'RAW_RESPONSE',
                        timestamp: new Date().toISOString()
                    };
                    return wrappedResponse;
                }
            }
            catch (validationError) {
                // If response format is invalid, this is a CRITICAL error
                throw new ApiResponseFormatError(validationError instanceof Error ? validationError.message : 'Response format validation failed', endpoint, rawData);
            }
        }
        catch (error) {
            // Re-throw our custom errors as-is
            if (error instanceof ApiResponseFormatError ||
                error instanceof ApiBusinessLogicError ||
                error instanceof ApiValidationError ||
                error instanceof ApiNetworkError) {
                throw error;
            }
            // Wrap unknown errors as network errors
            console.error('❌ API request failed:', error);
            throw new ApiNetworkError(error instanceof Error ? error.message : 'Network error', 0, endpoint);
        }
    }
    /**
     * CONVERTS VALIDATED STANDARDIZED RESPONSE TO CLIENT RESULT
     * This normalizes the response for client consumption
     */
    convertToApiResult(validatedResponse) {
        if ((0, api_responses_1.isSuccessResponse)(validatedResponse)) {
            return {
                success: true,
                data: validatedResponse.data,
                message: validatedResponse.message,
                operation_code: validatedResponse.operation_code,
                timestamp: validatedResponse.timestamp
            };
        }
        if ((0, api_responses_1.isPagedResponse)(validatedResponse)) {
            return {
                success: true,
                items: validatedResponse.data,
                message: validatedResponse.message,
                operation_code: validatedResponse.operation_code,
                pagination: validatedResponse.pagination,
                timestamp: validatedResponse.timestamp
            };
        }
        if ((0, api_responses_1.isErrorResponse)(validatedResponse)) {
            const reqId = validatedResponse?.request_id || validatedResponse?.requestId;
            if (validatedResponse.error_code === 'VALIDATION_ERROR') {
                // Handle validation error
                const valError = validatedResponse;
                return {
                    success: false,
                    error_code: validatedResponse.error_code,
                    message: validatedResponse.message,
                    operation: validatedResponse.operation,
                    details: validatedResponse.details,
                    validation_errors: valError.payload?.validation_errors,
                    ...(reqId ? { request_id: reqId } : {})
                };
            }
            else {
                // Handle regular error
                return {
                    success: false,
                    error_code: validatedResponse.error_code,
                    message: validatedResponse.message,
                    operation: validatedResponse.operation,
                    details: validatedResponse.details,
                    ...(reqId ? { request_id: reqId } : {})
                };
            }
        }
        // This should never happen due to validation, but TypeScript requires it
        throw new ApiResponseFormatError('Unknown response type after validation', 'unknown', validatedResponse);
    }
    // ========================================================================================
    // HTTP METHOD WRAPPERS - PUBLIC API
    // ========================================================================================
    /**
     * GET REQUEST - Returns typed result with direct data access
     */
    async get(endpoint, sessionToken) {
        return this.makeRequest(endpoint, { method: 'GET' }, sessionToken);
    }
    /**
     * POST REQUEST - Returns typed result with direct data access
     */
    async post(endpoint, data, sessionToken) {
        return this.makeRequest(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        }, sessionToken);
    }
    /**
     * PUT REQUEST - Returns typed result with direct data access
     */
    async put(endpoint, data, sessionToken) {
        return this.makeRequest(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        }, sessionToken);
    }
    /**
     * DELETE REQUEST - Returns typed result with direct data access
     */
    async delete(endpoint) {
        return this.makeRequest(endpoint, { method: 'DELETE' });
    }
}
// ========================================================================================
// SINGLETON INSTANCE - READY TO USE
// ========================================================================================
exports.standardizedApi = new StandardizedClientApiService();
// ========================================================================================
// CONVENIENCE HELPER FUNCTIONS
// ========================================================================================
/**
 * TYPE-SAFE SUCCESS CHECK
 * Use this to check if API call was successful with proper type narrowing
 */
function isApiSuccess(result) {
    return result.success === true && 'data' in result;
}
/**
 * TYPE-SAFE PAGED SUCCESS CHECK
 * Use this to check if API call was successful paged response with proper type narrowing
 */
function isApiPagedSuccess(result) {
    return result.success === true && 'items' in result;
}
/**
 * TYPE-SAFE ERROR CHECK
 * Use this to check if API call failed with proper type narrowing
 */
function isApiError(result) {
    return result.success === false;
}
/**
 * EXTRACT DATA FROM SUCCESS RESULT
 * Use this to get the data from a successful API call
 * Will throw if result is not successful
 */
function extractApiData(result) {
    if (isApiSuccess(result)) {
        return result.data;
    }
    if (isApiPagedSuccess(result)) {
        return result.items;
    }
    throw new ApiBusinessLogicError(result.error_code, result.message, result.operation, result.details);
}
/**
 * EXTRACT ITEMS FROM PAGED SUCCESS RESULT
 * Use this to get the items array from a successful paged API call
 * Will throw if result is not successful paged response
 */
function extractApiItems(result) {
    if (isApiPagedSuccess(result)) {
        return result.items;
    }
    if (isApiSuccess(result)) {
        // If it's a regular success but expected paged, data should be array
        return result.data;
    }
    throw new ApiBusinessLogicError(result.error_code, result.message, result.operation, result.details);
}
