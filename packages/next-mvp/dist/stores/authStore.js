"use strict";
/**
 * 🚀 CENTRALIZED AUTH STORE - THE SINGLE SOURCE OF TRUTH
 *
 * This Zustand store replaces ALL scattered useState patterns for auth-related state.
 * No more prop drilling, no more duplicate loading states, no more auth chaos.
 *
 * Features:
 * - Centralized session, token, and user state
 * - Built-in API calling with auto token refresh
 * - Loading state management for all async operations
 * - Type-safe throughout
 * - Integrates seamlessly with existing NextAuth
 */
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
exports.initializeAuthStore = exports.useAuthStore = void 0;
const zustand_1 = require("zustand");
const middleware_1 = require("zustand/middleware");
const react_1 = require("next-auth/react");
const session_1 = require("../lib/session");
const logger_1 = require("../config/logger");
const signalr_1 = require("@microsoft/signalr");
const signalrActivityService_1 = require("../services/signalrActivityService");
const app_slug_1 = require("../lib/app-slug");
// ===============================
// CACHE CONFIGURATION
// ===============================
const CACHE_DURATION = {
    USER_STATS: 5 * 60 * 1000, // 5 minutes
    CLIENTS: 10 * 60 * 1000, // 10 minutes  
    ROLES: 15 * 60 * 1000, // 15 minutes
    USERS: 5 * 60 * 1000, // 5 minutes (dynamic data)
    USER_DETAILS: 2 * 60 * 1000, // 2 minutes (detailed data)
    ROLE_CATEGORIES: 30 * 60 * 1000, // 30 minutes (stable data)
    USER_ASSIGNMENTS: 2 * 60 * 1000, // 2 minutes (assignment data changes frequently)
};
// ===============================
// ZUSTAND STORE IMPLEMENTATION
// ===============================
exports.useAuthStore = (0, zustand_1.create)()((0, middleware_1.devtools)((set, get) => ({
    // ===============================
    // INITIAL STATE
    // ===============================
    session: null,
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isInitialized: false,
    // Loading States
    isLoading: true,
    isRefreshingToken: false,
    isLoadingUserStats: false,
    isLoadingClients: false,
    isLoadingRoles: false,
    isLoadingUsers: false,
    isLoadingUserDetails: {},
    isLoadingRoleCategories: false,
    isLoadingUserAssignments: {},
    isLoadingClientAuthorizations: {},
    // Error States
    error: null,
    tokenError: null,
    // Cached Data
    userStats: null,
    clients: null,
    roles: null,
    users: null,
    userDetails: {},
    userAssignments: {},
    roleCategories: null,
    clientAuthorizations: {},
    // Cache Timestamps
    userStatsLastFetch: null,
    clientsLastFetch: null,
    rolesLastFetch: null,
    usersLastFetch: null,
    roleCategoriesLastFetch: null,
    // SignalR Connection State
    signalrConnection: null,
    signalrConnectionState: signalr_1.HubConnectionState.Disconnected,
    isConnectedToSignalR: false,
    // ===============================
    // SESSION MANAGEMENT ACTIONS
    // ===============================
    setSession: (session) => {
        // CRITICAL FIX: Validate and sanitize the session before setting it
        // This prevents storing sessions with empty user IDs or other invalid data
        const cleanSession = (0, session_1.sanitizeSession)(session);
        if (!cleanSession) {
            // Session is invalid (empty userId, empty email, or missing accessToken)
            logger_1.authLogger.warn('[AuthStore] Rejecting invalid session', {
                hasSession: false,
                reason: 'invalid_or_partial_session',
                hasIncomingSession: !!session,
                incomingUserId: session?.user?.id || '(empty)',
                incomingUserEmail: session?.user?.email || '(empty)',
                hasAccessToken: !!session?.accessToken
            });
            // Clear the session state completely
            set({
                session: null,
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isInitialized: true,
                isLoading: false,
                error: 'Invalid session data',
            });
            return;
        }
        // Session is valid - proceed with setting it
        logger_1.authLogger.info('[AuthStore] Setting valid session:', {
            hasSession: true,
            userId: cleanSession.user?.id,
            userEmail: cleanSession.user?.email
        });
        const user = {
            id: cleanSession.user?.id || '',
            email: cleanSession.user?.email || '',
            roles: Array.isArray(cleanSession.user?.roles) ? cleanSession.user.roles : [],
            twoFactorSessionVerified: cleanSession.user?.twoFactorSessionVerified || false,
            requiresTwoFactor: cleanSession.user?.requiresTwoFactor || false,
            twoFactorMethod: cleanSession.user?.twoFactorMethod,
            authenticationMethods: cleanSession.user.authenticationMethods,
            authenticationLevel: cleanSession.user.authenticationLevel,
            // Administrative States (with safe defaults)
            isApproved: cleanSession.user.isApproved ?? true,
            isSuspended: cleanSession.user.isSuspended ?? false,
            lockoutEnabled: cleanSession.user.lockoutEnabled ?? false,
            lockoutEnd: cleanSession.user.lockoutEnd ? new Date(cleanSession.user.lockoutEnd) : null,
            // Suspension Metadata
            pausedAt: cleanSession.user.pausedAt ? new Date(cleanSession.user.pausedAt) : null,
            pausedBy: cleanSession.user.pausedBy || null,
            suspensionReason: cleanSession.user.suspensionReason || null,
        };
        set({
            session: cleanSession,
            user,
            accessToken: cleanSession.accessToken || null,
            refreshToken: cleanSession.refreshToken || null,
            // FIXED: Use strict validation - both accessToken AND user.id must be non-empty
            isAuthenticated: true, // Already validated by sanitizeSession
            isInitialized: true,
            isLoading: false,
            error: cleanSession.error || null,
        });
        // Auto-initialize SignalR for authenticated users
        // Use a longer delay and add error handling to prevent login blocking
        setTimeout(async () => {
            try {
                await get().initializeSignalR();
            }
            catch (error) {
                // Don't let SignalR initialization errors block the login process
                logger_1.authLogger.warn('[AuthStore] SignalR initialization failed (non-blocking):', error);
            }
        }, 500); // Longer delay to ensure login flow completes first
    },
    clearSession: () => {
        logger_1.authLogger.debug('[AuthStore] Clearing session');
        // Disconnect SignalR before clearing session
        get().disconnectSignalR();
        set({
            session: null,
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
            tokenError: null,
            // Keep cache data but clear sensitive auth data
        });
    },
    refreshSession: async () => {
        const state = get();
        if (!state.session?.sessionToken || !state.user?.id || state.isRefreshingToken) {
            return;
        }
        set({ isRefreshingToken: true, tokenError: null });
        try {
            // Call refresh endpoint directly (no middleware chaos)
            const stateBefore = get();
            const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-Token': stateBefore.session?.sessionToken || '',
                    'X-Request-Source': 'authStore.refreshSession'
                },
                credentials: 'include'
            });
            if (!refreshResponse.ok) {
                const refreshError = await refreshResponse.json().catch(() => ({ message: 'Token refresh failed' }));
                throw new Error(refreshError.message || 'Token refresh failed');
            }
            // TODO: Get updated session from Redis after successful refresh (temp disabled for client build)
            // For now, assume refresh was successful
            // TODO: Update session with new tokens from Redis (temp disabled)
            // For now, assume session tokens are already updated by the refresh endpoint
            logger_1.authLogger.info('[AuthStore] Token refresh successful via direct /api/session/refresh');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
            logger_1.authLogger.error('[AuthStore] Token refresh failed:', error);
            set({
                tokenError: errorMessage,
                isAuthenticated: false,
            });
            // If refresh fails, sign out
            await get().signOut();
        }
        finally {
            set({ isRefreshingToken: false });
        }
    },
    // ===============================
    // AUTHENTICATION ACTIONS
    // ===============================
    signIn: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            // Use NextAuth signIn - this will trigger our auth callbacks
            const { signIn } = await Promise.resolve().then(() => __importStar(require('next-auth/react')));
            const result = await signIn('credentials', {
                ...credentials,
                redirect: false,
            });
            if (result?.ok) {
                logger_1.authLogger.info('[AuthStore] Sign in successful');
                return true;
            }
            else {
                const errorMessage = result?.error || 'Sign in failed';
                set({ error: errorMessage, isLoading: false });
                return false;
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
            logger_1.authLogger.error('[AuthStore] Sign in error:', error);
            set({ error: errorMessage, isLoading: false });
            return false;
        }
    },
    signOut: async () => {
        logger_1.authLogger.info('[AuthStore] Starting sign out process');
        // Clear local state immediately
        get().clearSession();
        // Clear cached data
        set({
            userStats: null,
            clients: null,
            roles: null,
            userStatsLastFetch: null,
            clientsLastFetch: null,
            rolesLastFetch: null,
        });
        try {
            // Use NextAuth signOut
            await (0, react_1.signOut)({ redirect: false });
            logger_1.authLogger.info('[AuthStore] Sign out completed');
        }
        catch (error) {
            logger_1.authLogger.error('[AuthStore] Sign out error:', error);
            // Even if signOut fails, we've cleared local state
        }
    },
    forceLogoutAndRedirect: async (reason) => {
        const state = get();
        // AGGRESSIVE LOGGING TO TRACK EXECUTION
        console.error('🚨 FORCE LOGOUT INITIATED 🚨', {
            reason,
            userId: state.user?.id,
            sessionToken: state.session?.sessionToken,
            timestamp: new Date().toISOString()
        });
        logger_1.authLogger.error('[AuthStore] Force logout initiated', {
            reason,
            userId: state.user?.id,
            sessionToken: state.session?.sessionToken
        });
        try {
            // TODO: Step 1: Mark session as force-invalidated in Redis (temp disabled for client build)
            // Step 2: Clear local state immediately
            get().clearSession();
            // Step 3: Clear all cached data
            set({
                userStats: null,
                clients: null,
                roles: null,
                userStatsLastFetch: null,
                clientsLastFetch: null,
                rolesLastFetch: null,
            });
            // Step 4: Clear session cache (temp disabled for client build)
            // TODO: Re-enable when session-cache module is available
            // const { SessionCache } = await import('@/lib/session-cache');
            // SessionCache.clearCache();
            // SessionCache.clearServerSessionData();
            // Step 5: AGGRESSIVELY clear NextAuth cookies immediately before signOut (app-slug prefixed)
            if (typeof document !== 'undefined') {
                const cookiesToClear = [
                    (0, app_slug_1.getSessionCookieName)(),
                    (0, app_slug_1.getSecureSessionCookieName)(),
                    (0, app_slug_1.getCsrfCookieName)(),
                    (0, app_slug_1.getSecureCsrfCookieName)()
                ];
                logger_1.authLogger.info('[AuthStore] Aggressively clearing NextAuth cookies immediately');
                cookiesToClear.forEach(cookieName => {
                    try {
                        const expiredDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
                        const clearPatterns = [
                            `${cookieName}=; expires=${expiredDate}; path=/`,
                            `${cookieName}=; expires=${expiredDate}; path=/; domain=${window.location.hostname}`,
                            `${cookieName}=; expires=${expiredDate}; path=/; domain=.${window.location.hostname}`,
                        ];
                        if (window.location.protocol === 'https:') {
                            clearPatterns.push(`${cookieName}=; expires=${expiredDate}; path=/; secure`, `${cookieName}=; expires=${expiredDate}; path=/; domain=${window.location.hostname}; secure`, `${cookieName}=; expires=${expiredDate}; path=/; domain=.${window.location.hostname}; secure`);
                        }
                        clearPatterns.forEach(pattern => {
                            document.cookie = pattern;
                        });
                    }
                    catch (cookieError) {
                        logger_1.authLogger.warn(`Failed to clear cookie ${cookieName}:`, cookieError);
                    }
                });
            }
            // Step 6: Force NextAuth signOut (this should clear the session cookie)
            const { signOut } = await Promise.resolve().then(() => __importStar(require('next-auth/react')));
            await signOut({ redirect: false });
            logger_1.authLogger.info('[AuthStore] Force logout completed, redirecting to login');
            // Step 7: Longer delay to ensure everything is processed
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Step 8: Force redirect with cache busting - use window.location.href for immediate effect
            const loginUrl = `/account-auth/login?error=SessionExpired&reason=${reason}&t=${Date.now()}`;
            logger_1.authLogger.info('[AuthStore] Redirecting to login:', loginUrl);
            // Double redirect approach to ensure it works
            window.location.replace(loginUrl);
            window.location.href = loginUrl;
        }
        catch (error) {
            logger_1.authLogger.error('[AuthStore] Error during force logout:', error);
            // Fallback: still redirect even if cleanup fails
            const loginUrl = `/account-auth/login?error=ForceLogoutError&reason=${reason}&t=${Date.now()}`;
            window.location.replace(loginUrl);
        }
    },
    // ===============================
    // API CALLING WITH AUTO TOKEN REFRESH
    // ===============================
    // Single centralized refresh method with coordinated server-side coordination
    refreshTokens: async () => {
        const state = get();
        // If already refreshing, wait for it to complete
        if (state.isRefreshingToken) {
            logger_1.authLogger.info('[AuthStore] Client-side token refresh already in progress, waiting for completion');
            // Wait for the refresh to complete by polling the flag
            const maxWaitMs = 15000; // 15 seconds max wait
            const startTime = Date.now();
            while (get().isRefreshingToken && (Date.now() - startTime) < maxWaitMs) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            // Check if refresh was successful by verifying we still have a valid session
            const updatedState = get();
            if (updatedState.isRefreshingToken) {
                logger_1.authLogger.warn('[AuthStore] Client-side token refresh timed out');
                throw new Error('Token refresh timed out - another refresh operation is stuck');
            }
            if (!updatedState.isAuthenticated || !updatedState.session) {
                logger_1.authLogger.error('[AuthStore] Token refresh failed - session invalid after refresh');
                throw new Error('Token refresh failed - session invalid after refresh');
            }
            logger_1.authLogger.info('[AuthStore] Token refresh completed by another caller');
            return;
        }
        // Set refreshing flag for client-side coordination
        set({ isRefreshingToken: true });
        logger_1.authLogger.info('[AuthStore] Starting coordinated token refresh');
        try {
            // COORDINATED REFRESH: The server now handles distributed locking
            // We just need to make the refresh call and let the server coordinate
            // Resolve session token for header
            const resolveSessionTokenForHeader = async () => {
                let token = get().session?.sessionToken;
                if (token)
                    return token;
                try {
                    const { getSession } = await Promise.resolve().then(() => __importStar(require('next-auth/react')));
                    for (let attempt = 1; attempt <= 3 && !token; attempt++) {
                        const s = await getSession();
                        token = s?.sessionToken;
                        if (!token) {
                            await new Promise(r => setTimeout(r, 150));
                        }
                    }
                }
                catch {
                    logger_1.authLogger.warn('[AuthStore] Failed to resolve session token from NextAuth during refresh');
                }
                return token;
            };
            const sessionTokenHeader = await resolveSessionTokenForHeader();
            const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Refresh': 'true',
                    'X-Request-Source': 'authStore',
                    ...(sessionTokenHeader ? { 'X-Session-Token': sessionTokenHeader } : {})
                },
                credentials: 'include'
            });
            if (!refreshResponse.ok) {
                if (refreshResponse.status === 429 || refreshResponse.status === 409) {
                    const retryAfter = refreshResponse.headers.get('Retry-After');
                    const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
                    logger_1.authLogger.info('[AuthStore] Server coordinated refresh in progress, waiting and retrying', {
                        status: refreshResponse.status,
                        retryAfterMs: waitMs
                    });
                    await new Promise(resolve => setTimeout(resolve, Math.min(waitMs, 5000)));
                    await get().rehydrateSessionAfterRefresh();
                    logger_1.authLogger.info('[AuthStore] Successfully coordinated with server-side refresh');
                    return;
                }
                const refreshError = await refreshResponse.json().catch(() => ({ message: 'Token refresh failed' }));
                logger_1.authLogger.error('[AuthStore] Token refresh failed:', refreshError);
                set({
                    session: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    user: null
                });
                await get().forceLogoutAndRedirect('TokenRefreshFailed');
                throw new Error(`Token refresh failed: ${refreshError.message}`);
            }
            logger_1.authLogger.info('[AuthStore] Coordinated token refresh successful on backend, rehydrating session');
            await get().rehydrateSessionAfterRefresh();
        }
        catch (error) {
            logger_1.authLogger.error('[AuthStore] Coordinated token refresh exception:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isCoordinationError = errorMessage.includes('coordination') ||
                errorMessage.includes('timeout') ||
                errorMessage.includes('another refresh');
            if (!isCoordinationError) {
                set({
                    session: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    user: null
                });
                await get().forceLogoutAndRedirect('TokenRefreshException');
            }
            throw error;
        }
        finally {
            set({ isRefreshingToken: false });
        }
    },
    // Atomic session rehydration after token refresh
    // This ensures the authStore gets the fresh tokens from the session store
    rehydrateSessionAfterRefresh: async () => {
        const maxRetries = 3;
        const retryDelay = 500; // 500ms between retries
        logger_1.authLogger.info('[AuthStore] Starting session rehydration after token refresh');
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Force NextAuth to reload the session from the session store
                // This triggers the JWT callback which reads fresh data from Redis
                const { getSession } = await Promise.resolve().then(() => __importStar(require('next-auth/react')));
                logger_1.authLogger.debug(`[AuthStore] Rehydration attempt ${attempt}/${maxRetries}`);
                // Force session refresh - this calls NextAuth's session endpoint
                // which triggers JWT callback to read fresh tokens from Redis
                const freshSession = await getSession();
                if (!freshSession) {
                    throw new Error('No session returned from NextAuth after refresh');
                }
                if (!freshSession.accessToken) {
                    throw new Error('Fresh session missing access token');
                }
                // Verify the token is actually fresh (not expired)
                try {
                    const { jwtDecode } = await Promise.resolve().then(() => __importStar(require('@/lib/jwt-decode')));
                    const decoded = jwtDecode(freshSession.accessToken);
                    if (!decoded?.exp) {
                        throw new Error('Fresh token missing expiration claim');
                    }
                    const tokenExpiry = decoded.exp * 1000;
                    const now = Date.now();
                    const timeUntilExpiry = tokenExpiry - now;
                    // Token should be fresh (not expiring in next 5 minutes)
                    if (timeUntilExpiry < (5 * 60 * 1000)) {
                        throw new Error(`Fresh token still expires soon: ${timeUntilExpiry}ms`);
                    }
                    logger_1.authLogger.info('[AuthStore] Session rehydration successful', {
                        attempt,
                        tokenExpiresAt: new Date(tokenExpiry).toISOString(),
                        timeUntilExpiry: `${Math.round(timeUntilExpiry / 1000)}s`,
                        subject: decoded.sub
                    });
                    // Update the authStore with the fresh session atomically
                    get().setSession(freshSession);
                    logger_1.authLogger.info('[AuthStore] AuthStore updated with fresh tokens');
                    return; // Success!
                }
                catch (tokenError) {
                    throw new Error(`Token validation failed: ${tokenError instanceof Error ? tokenError.message : String(tokenError)}`);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger_1.authLogger.warn(`[AuthStore] Rehydration attempt ${attempt} failed:`, errorMessage);
                // If this is the last attempt, throw the error
                if (attempt === maxRetries) {
                    logger_1.authLogger.error('[AuthStore] Session rehydration failed after all retries');
                    throw new Error(`Session rehydration failed after ${maxRetries} attempts: ${errorMessage}`);
                }
                // Wait before retrying
                logger_1.authLogger.debug(`[AuthStore] Waiting ${retryDelay}ms before retry ${attempt + 1}`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    },
    apiCall: async (url, options = {}, maxRetries = 3) => {
        // UNIVERSAL RETRY WRAPPER: Handle 503 retries at the store level
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await get().makeApiCall(url, options, attempt);
            }
            catch (error) {
                const isRetryableError = error.isRetryable || error.message?.includes('Token refresh in progress');
                if (isRetryableError && attempt < maxRetries) {
                    const retryAfter = error.retryAfter || 1;
                    logger_1.authLogger.info(`[AuthStore] API call attempt ${attempt} failed with retryable error, retrying in ${retryAfter}s`, {
                        url,
                        error: error.message,
                        attempt,
                        maxRetries
                    });
                    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                    continue;
                }
                // Not retryable or max attempts reached
                throw error;
            }
        }
        // This should never be reached but TypeScript needs it
        throw new Error('API call failed after all retry attempts');
    },
    makeApiCall: async (url, options = {}, attempt = 1) => {
        const state = get();
        // COORDINATED AUTH: Check authentication and refresh coordination
        if (!state.isAuthenticated || !state.session?.sessionToken || !state.user?.id) {
            throw new Error('Not authenticated');
        }
        // COORDINATED REFRESH: Check if token refresh is in progress
        if (state.isRefreshingToken) {
            logger_1.authLogger.info('[AuthStore] API call detected refresh in progress, waiting for completion', { url, attempt });
            // Wait for refresh to complete before making API call
            const maxWaitMs = 10000; // 10 seconds max wait
            const startTime = Date.now();
            while (get().isRefreshingToken && (Date.now() - startTime) < maxWaitMs) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            const updatedState = get();
            if (updatedState.isRefreshingToken) {
                logger_1.authLogger.warn('[AuthStore] API call timed out waiting for refresh', { url, attempt });
                throw new Error('Request failed - token refresh in progress');
            }
            if (!updatedState.isAuthenticated || !updatedState.session) {
                logger_1.authLogger.error('[AuthStore] Session lost during refresh wait', { url, attempt });
                throw new Error('Authentication lost during token refresh');
            }
            logger_1.authLogger.info('[AuthStore] API call proceeding after refresh completion', { url, attempt });
        }
        // COORDINATED API CALL: Make API call using NextAuth session cookies
        // Server-side handlers will coordinate any needed token refresh
        const response = await fetch(url, {
            ...options,
            credentials: 'include', // Ensure session cookies are sent
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Call': 'true', // Indicate this is a client-initiated call
                'X-Request-Source': 'authStore',
                ...options.headers,
            },
        });
        if (!response.ok) {
            // COORDINATED ERROR HANDLING: Handle various coordination scenarios
            if (response.status === 401) {
                logger_1.authLogger.info('[AuthStore] Received 401, attempting coordinated refresh and retry', { url, attempt });
                // If not currently refreshing and we haven't retried yet, attempt refresh then retry once
                if (!get().isRefreshingToken && (attempt ?? 1) < 2) {
                    try {
                        await get().refreshTokens();
                        logger_1.authLogger.info('[AuthStore] Refresh complete, retrying API call once', { url, nextAttempt: (attempt ?? 1) + 1 });
                        return await get().makeApiCall(url, options, (attempt ?? 1) + 1);
                    }
                    catch (refreshError) {
                        logger_1.authLogger.error('[AuthStore] Refresh attempt failed after 401', refreshError);
                        // fall through to force logout below
                    }
                }
                else if (get().isRefreshingToken) {
                    logger_1.authLogger.info('[AuthStore] 401 received during in-progress refresh - treating as coordination issue');
                }
                // If we reach here, refresh was not attempted or failed; force logout
                await get().forceLogoutAndRedirect('ApiCall401');
                throw new Error('Authentication failed');
            }
            // Handle server coordination responses
            if (response.status === 503) {
                const retryAfter = response.headers.get('Retry-After');
                logger_1.authLogger.info('[AuthStore] Received 503 (service unavailable), likely token refresh in progress', {
                    url,
                    retryAfter
                });
                // This is a retryable condition - let the calling code handle retries
                const error = new Error('Token refresh in progress');
                error.retryAfter = parseInt(retryAfter || '1', 10);
                error.isRetryable = true;
                throw error;
            }
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                logger_1.authLogger.info('[AuthStore] Received 429 (rate limit/coordination), server busy', {
                    url,
                    retryAfter
                });
                throw new Error(`Server busy - retry after ${retryAfter || '1'} second(s)`);
            }
            if (response.status === 409) {
                // Distinguish business conflict (e.g., duplicate email/username) from refresh coordination
                let body = null;
                try {
                    body = await response.clone().json();
                }
                catch { }
                const code = body?.error?.code || body?.code;
                const message = body?.error?.message || body?.message;
                const msgLower = typeof message === 'string' ? message.toLowerCase() : '';
                // PayEz-standard conflicts we want to surface to the UI
                if (code === 'RESOURCE_CONFLICT' ||
                    code === 'USERNAME_ALREADY_EXISTS' ||
                    code === 'EMAIL_ALREADY_EXISTS' ||
                    (msgLower.includes('duplicate') || msgLower.includes('already taken'))) {
                    const err = new Error(message || 'Resource conflict');
                    err.status = 409;
                    err.data = body;
                    throw err;
                }
                // Otherwise treat as coordination conflict (e.g., refresh lock)
                logger_1.authLogger.info('[AuthStore] Received 409 (conflict) without recognizable business code; treating as refresh coordination issue', { url });
                const err = new Error('Request conflict - token refresh in progress on server');
                err.status = 409;
                err.data = body;
                throw err;
            }
            // Handle other HTTP errors: throw an error with details
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || errorData.error || response.statusText || 'Request failed';
            const error = new Error(errorMessage);
            error.status = response.status;
            error.data = errorData;
            throw error;
        }
        return await response.json();
    },
    // ===============================
    // DATA FETCHING ACTIONS
    // ===============================
    fetchUserStats: async (force = false) => {
        const state = get();
        const now = Date.now();
        // Check cache unless forced
        if (!force && state.userStats && state.userStatsLastFetch) {
            const age = now - state.userStatsLastFetch;
            if (age < CACHE_DURATION.USER_STATS) {
                logger_1.authLogger.debug('[AuthStore] Using cached user stats');
                return;
            }
        }
        set({ isLoadingUserStats: true });
        try {
            const data = await get().apiCall('/api/activity/user-stats');
            set({
                userStats: data.data || data,
                userStatsLastFetch: now,
                isLoadingUserStats: false,
            });
            logger_1.authLogger.debug('[AuthStore] User stats fetched successfully');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Don't log errors if we're already signed out (forced logout scenario)
            if (!errorMessage.includes('Session expired') && !errorMessage.includes('Authentication failed')) {
                logger_1.authLogger.error('[AuthStore] Failed to fetch user stats:', error);
            }
            set({ isLoadingUserStats: false });
            // Don't throw if we're in a forced logout scenario
            if (!errorMessage.includes('Session expired') && !errorMessage.includes('Authentication failed')) {
                throw error;
            }
        }
    },
    fetchClients: async (force = false) => {
        const state = get();
        const now = Date.now();
        // Check cache unless forced
        if (!force && state.clients && state.clientsLastFetch) {
            const age = now - state.clientsLastFetch;
            if (age < CACHE_DURATION.CLIENTS) {
                logger_1.authLogger.debug('[AuthStore] Using cached clients');
                return;
            }
        }
        set({ isLoadingClients: true });
        try {
            const data = await get().apiCall('/api/admin/clients');
            // API returns pure array - no envelope
            set({
                clients: Array.isArray(data) ? data : [],
                clientsLastFetch: now,
                isLoadingClients: false,
            });
            logger_1.authLogger.debug('[AuthStore] Clients fetched successfully');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Don't log errors if we're already signed out (forced logout scenario)
            if (!errorMessage.includes('Session expired') && !errorMessage.includes('Authentication failed')) {
                logger_1.authLogger.error('[AuthStore] Failed to fetch clients:', error);
            }
            set({ isLoadingClients: false });
            // Don't throw if we're in a forced logout scenario
            if (!errorMessage.includes('Session expired') && !errorMessage.includes('Authentication failed')) {
                throw error;
            }
        }
    },
    fetchRoles: async (force = false) => {
        const state = get();
        const now = Date.now();
        // Check cache unless forced
        if (!force && state.roles && state.rolesLastFetch) {
            const age = now - state.rolesLastFetch;
            if (age < CACHE_DURATION.ROLES) {
                logger_1.authLogger.debug('[AuthStore] Using cached roles');
                return;
            }
        }
        set({ isLoadingRoles: true });
        try {
            const data = await get().apiCall('/api/admin/roles');
            // API returns pure array - no envelope
            set({
                roles: Array.isArray(data) ? data : [],
                rolesLastFetch: now,
                isLoadingRoles: false,
            });
            logger_1.authLogger.debug('[AuthStore] Roles fetched successfully');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Don't log errors if we're already signed out (forced logout scenario)
            if (!errorMessage.includes('Session expired') && !errorMessage.includes('Authentication failed')) {
                logger_1.authLogger.error('[AuthStore] Failed to fetch roles:', error);
            }
            set({ isLoadingRoles: false });
            // Don't throw if we're in a forced logout scenario
            if (!errorMessage.includes('Session expired') && !errorMessage.includes('Authentication failed')) {
                throw error;
            }
        }
    },
    fetchUsers: async (params = {}, force = false) => {
        const state = get();
        const now = Date.now();
        // Check cache unless forced (users data changes frequently, shorter cache)
        if (!force && state.users && state.usersLastFetch) {
            const age = now - state.usersLastFetch;
            if (age < CACHE_DURATION.USERS) {
                logger_1.authLogger.debug('[AuthStore] Using cached users');
                return;
            }
        }
        set({ isLoadingUsers: true });
        try {
            // Always use POST for /api/admin/users with appropriate payload
            const url = `/api/admin/users`;
            // Build proper UserGridRequest with all required fields
            const gridParams = {
                page_number: params.page || 1,
                page_size: params.pageSize || 25,
                search: "",
                search_field: "",
                sort_field: "",
                sort_order: "",
                status: null,
                merchant_id: "",
                client_assignment_status: null
            };
            const options = { method: 'POST', body: JSON.stringify(gridParams) };
            const data = await get().apiCall(url, options);
            // API returns pure array - no envelope
            const users = Array.isArray(data) ? data : [];
            set({
                users: Array.isArray(users) ? users : [],
                usersLastFetch: now,
                isLoadingUsers: false,
            });
            logger_1.authLogger.debug('[AuthStore] Users fetched successfully');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.authLogger.error('[AuthStore] Failed to fetch users:', error);
            set({ isLoadingUsers: false });
            if (!errorMessage.includes('Session expired') && !errorMessage.includes('Authentication failed')) {
                throw error;
            }
        }
    },
    fetchUserDetails: async (userId, force = false) => {
        const state = get();
        const now = Date.now();
        // Check cache unless forced
        const cacheKey = `user_${userId}`;
        const lastFetch = state.userDetails[`${cacheKey}_lastFetch`];
        if (!force && state.userDetails[userId] && lastFetch) {
            const age = now - lastFetch;
            if (age < CACHE_DURATION.USER_DETAILS) {
                logger_1.authLogger.debug(`[AuthStore] Using cached user details for ${userId}`);
                return;
            }
        }
        set({
            isLoadingUserDetails: { ...state.isLoadingUserDetails, [userId]: true }
        });
        try {
            const data = await get().apiCall(`/api/admin/users/${userId}`);
            set({
                userDetails: {
                    ...state.userDetails,
                    [userId]: data.data || data,
                    [`${cacheKey}_lastFetch`]: now
                },
                isLoadingUserDetails: { ...state.isLoadingUserDetails, [userId]: false }
            });
            logger_1.authLogger.debug(`[AuthStore] User details fetched for ${userId}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.authLogger.error(`[AuthStore] Failed to fetch user details for ${userId}:`, error);
            set({
                isLoadingUserDetails: { ...state.isLoadingUserDetails, [userId]: false }
            });
            if (!errorMessage.includes('Session expired') && !errorMessage.includes('Authentication failed')) {
                throw error;
            }
        }
    },
    fetchUserClientAuthorizations: async (userId, force = false) => {
        const state = get();
        const now = Date.now();
        const cacheKey = `auth_${userId}`;
        // Check if already loading
        if (state.isLoadingClientAuthorizations[userId]) {
            return;
        }
        // Check cache unless forced
        if (!force && state.clientAuthorizations[userId]) {
            logger_1.authLogger.debug(`[AuthStore] Using cached client authorizations for ${userId}`);
            return;
        }
        set({
            isLoadingClientAuthorizations: { ...state.isLoadingClientAuthorizations, [userId]: true }
        });
        try {
            const data = await get().apiCall(`/api/admin/users/client-authorizations?user_id=${userId}`);
            // Handle various response formats
            let authorizations = [];
            if (data.data) {
                authorizations = data.data.authorizations || data.data || [];
            }
            else {
                authorizations = data.authorizations || data || [];
            }
            set({
                clientAuthorizations: {
                    ...state.clientAuthorizations,
                    [userId]: Array.isArray(authorizations) ? authorizations : []
                },
                isLoadingClientAuthorizations: { ...state.isLoadingClientAuthorizations, [userId]: false }
            });
            logger_1.authLogger.debug(`[AuthStore] Client authorizations fetched for ${userId}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.authLogger.error(`[AuthStore] Failed to fetch client authorizations for ${userId}:`, error);
            set({
                clientAuthorizations: {
                    ...state.clientAuthorizations,
                    [userId]: []
                },
                isLoadingClientAuthorizations: { ...state.isLoadingClientAuthorizations, [userId]: false }
            });
            if (!errorMessage.includes('Session expired') && !errorMessage.includes('Authentication failed')) {
                throw error;
            }
        }
    },
    fetchUserRoleAssignments: async (userId, force = false) => {
        const state = get();
        const cacheKey = `assignments_${userId}`;
        if (state.isLoadingUserAssignments[userId]) {
            return;
        }
        if (!force && state.userAssignments[userId]) {
            logger_1.authLogger.debug(`[AuthStore] Using cached role assignments for ${userId}`);
            return;
        }
        set({
            isLoadingUserAssignments: { ...state.isLoadingUserAssignments, [userId]: true }
        });
        try {
            const data = await get().apiCall(`/api/admin/users/role-assignments?user_id=${userId}`);
            let assignments = [];
            if (data.data) {
                assignments = data.data.assignments || data.data || [];
            }
            else {
                assignments = data.assignments || data || [];
            }
            set({
                userAssignments: {
                    ...state.userAssignments,
                    [userId]: Array.isArray(assignments) ? assignments : []
                },
                isLoadingUserAssignments: { ...state.isLoadingUserAssignments, [userId]: false }
            });
            logger_1.authLogger.debug(`[AuthStore] Role assignments fetched for ${userId}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.authLogger.error(`[AuthStore] Failed to fetch role assignments for ${userId}:`, error);
            set({
                userAssignments: {
                    ...state.userAssignments,
                    [userId]: []
                },
                isLoadingUserAssignments: { ...state.isLoadingUserAssignments, [userId]: false }
            });
            if (!errorMessage.includes('Session expired') && !errorMessage.includes('Authentication failed')) {
                throw error;
            }
        }
    },
    fetchRoleCategories: async (force = false) => {
        const state = get();
        const now = Date.now();
        // Check cache unless forced (role categories are fairly stable)
        if (!force && state.roleCategories && state.roleCategoriesLastFetch) {
            const age = now - state.roleCategoriesLastFetch;
            if (age < CACHE_DURATION.ROLE_CATEGORIES) {
                logger_1.authLogger.debug('[AuthStore] Using cached role categories');
                return;
            }
        }
        set({ isLoadingRoleCategories: true });
        try {
            const data = await get().apiCall('/api/admin/roles/categories');
            set({
                roleCategories: Array.isArray(data) ? data : (data.data || []),
                roleCategoriesLastFetch: now,
                isLoadingRoleCategories: false,
            });
            logger_1.authLogger.debug('[AuthStore] Role categories fetched successfully');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger_1.authLogger.error('[AuthStore] Failed to fetch role categories:', error);
            set({ isLoadingRoleCategories: false });
            if (!errorMessage.includes('Session expired') && !errorMessage.includes('Authentication failed')) {
                throw error;
            }
        }
    },
    // ===============================
    // CRUD OPERATIONS
    // ===============================
    createUser: async (userData) => {
        try {
            const result = await get().apiCall('/api/admin/users', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            // Invalidate users cache to force refresh
            set({ usersLastFetch: null });
            logger_1.authLogger.info('[AuthStore] User created successfully');
            return result;
        }
        catch (error) {
            logger_1.authLogger.error('[AuthStore] Failed to create user:', error);
            throw error;
        }
    },
    updateUser: async (userId, updates) => {
        try {
            const result = await get().apiCall(`/api/admin/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            // Invalidate relevant caches
            const state = get();
            set({
                usersLastFetch: null,
                userDetails: {
                    ...state.userDetails,
                    [userId]: undefined // Force refresh of this user's details
                }
            });
            logger_1.authLogger.info(`[AuthStore] User ${userId} updated successfully`);
            return result;
        }
        catch (error) {
            logger_1.authLogger.error(`[AuthStore] Failed to update user ${userId}:`, error);
            throw error;
        }
    },
    deleteUser: async (userId) => {
        try {
            await get().apiCall(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });
            // Clean up all related data for this user
            const state = get();
            const newUserDetails = { ...state.userDetails };
            const newUserAssignments = { ...state.userAssignments };
            const newClientAuthorizations = { ...state.clientAuthorizations };
            delete newUserDetails[userId];
            delete newUserAssignments[userId];
            delete newClientAuthorizations[userId];
            set({
                usersLastFetch: null, // Force refresh
                userDetails: newUserDetails,
                userAssignments: newUserAssignments,
                clientAuthorizations: newClientAuthorizations
            });
            logger_1.authLogger.info(`[AuthStore] User ${userId} deleted successfully`);
        }
        catch (error) {
            logger_1.authLogger.error(`[AuthStore] Failed to delete user ${userId}:`, error);
            throw error;
        }
    },
    createRole: async (roleData) => {
        try {
            const result = await get().apiCall('/api/admin/roles', {
                method: 'POST',
                body: JSON.stringify(roleData)
            });
            // Invalidate roles cache
            set({ rolesLastFetch: null });
            logger_1.authLogger.info('[AuthStore] Role created successfully');
            return result;
        }
        catch (error) {
            logger_1.authLogger.error('[AuthStore] Failed to create role:', error);
            throw error;
        }
    },
    updateRole: async (roleId, updates) => {
        try {
            const result = await get().apiCall(`/api/admin/roles/${roleId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            set({ rolesLastFetch: null });
            logger_1.authLogger.info(`[AuthStore] Role ${roleId} updated successfully`);
            return result;
        }
        catch (error) {
            logger_1.authLogger.error(`[AuthStore] Failed to update role ${roleId}:`, error);
            throw error;
        }
    },
    deleteRole: async (roleId) => {
        try {
            await get().apiCall(`/api/admin/roles/${roleId}`, {
                method: 'DELETE'
            });
            set({ rolesLastFetch: null });
            logger_1.authLogger.info(`[AuthStore] Role ${roleId} deleted successfully`);
        }
        catch (error) {
            logger_1.authLogger.error(`[AuthStore] Failed to delete role ${roleId}:`, error);
            throw error;
        }
    },
    assignUserToRole: async (userId, roleId) => {
        try {
            await get().apiCall('/api/admin/users/assign-role', {
                method: 'POST',
                body: JSON.stringify({ userId, roleId })
            });
            // Invalidate user assignments cache
            const state = get();
            set({
                userAssignments: {
                    ...state.userAssignments,
                    [userId]: undefined // Force refresh
                },
                usersLastFetch: null // Also refresh users list
            });
            logger_1.authLogger.info(`[AuthStore] User ${userId} assigned to role ${roleId}`);
        }
        catch (error) {
            logger_1.authLogger.error(`[AuthStore] Failed to assign user ${userId} to role ${roleId}:`, error);
            throw error;
        }
    },
    removeUserFromRole: async (userId, roleId) => {
        try {
            await get().apiCall('/api/admin/users/remove-role', {
                method: 'POST',
                body: JSON.stringify({ userId, roleId })
            });
            // Invalidate user assignments cache
            const state = get();
            set({
                userAssignments: {
                    ...state.userAssignments,
                    [userId]: undefined // Force refresh
                },
                usersLastFetch: null // Also refresh users list
            });
            logger_1.authLogger.info(`[AuthStore] User ${userId} removed from role ${roleId}`);
        }
        catch (error) {
            logger_1.authLogger.error(`[AuthStore] Failed to remove user ${userId} from role ${roleId}:`, error);
            throw error;
        }
    },
    assignUserToClient: async (userId, clientId) => {
        try {
            await get().apiCall('/api/admin/users/assign-client', {
                method: 'POST',
                body: JSON.stringify({ userId, clientId })
            });
            // Invalidate user client authorizations cache
            const state = get();
            set({
                clientAuthorizations: {
                    ...state.clientAuthorizations,
                    [userId]: undefined // Force refresh
                },
                usersLastFetch: null
            });
            logger_1.authLogger.info(`[AuthStore] User ${userId} assigned to client ${clientId}`);
        }
        catch (error) {
            logger_1.authLogger.error(`[AuthStore] Failed to assign user ${userId} to client ${clientId}:`, error);
            throw error;
        }
    },
    removeUserFromClient: async (userId, clientId) => {
        try {
            await get().apiCall('/api/admin/users/remove-client', {
                method: 'POST',
                body: JSON.stringify({ userId, clientId })
            });
            // Invalidate user client authorizations cache
            const state = get();
            set({
                clientAuthorizations: {
                    ...state.clientAuthorizations,
                    [userId]: undefined // Force refresh
                },
                usersLastFetch: null
            });
            logger_1.authLogger.info(`[AuthStore] User ${userId} removed from client ${clientId}`);
        }
        catch (error) {
            logger_1.authLogger.error(`[AuthStore] Failed to remove user ${userId} from client ${clientId}:`, error);
            throw error;
        }
    },
    // ===============================
    // UTILITY ACTIONS
    // ===============================
    hasRole: (role) => {
        const state = get();
        return state.user?.roles?.includes(role) || false;
    },
    hasAnyRole: (roles) => {
        const state = get();
        if (!state.user?.roles)
            return false;
        return roles.some(role => state.user.roles.includes(role));
    },
    hasAllRoles: (roles) => {
        const state = get();
        if (!state.user?.roles)
            return false;
        return roles.every(role => state.user.roles.includes(role));
    },
    isFullyAuthenticated: () => {
        const state = get();
        return state.isAuthenticated &&
            (!state.user?.requiresTwoFactor || state.user.twoFactorSessionVerified);
    },
    // ===============================
    // ERROR MANAGEMENT
    // ===============================
    setError: (error) => {
        set({ error });
    },
    clearError: () => {
        set({ error: null, tokenError: null });
    },
    // ===============================
    // ADMIN USER STATE MANAGEMENT ACTIONS
    // ===============================
    approveUser: async (userId, reason) => {
        try {
            await get().apiCall('/api/Admin/users/toggle-approval', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: parseInt(userId),
                    is_approved: true,
                    reason: reason || 'Administrative approval'
                })
            });
            logger_1.authLogger.info('[AuthStore] User approved:', { userId, reason });
            // The backend should broadcast the SignalR event, but we could also 
            // optimistically update local state here if needed
        }
        catch (error) {
            logger_1.authLogger.error('[AuthStore] Failed to approve user:', error);
            throw error;
        }
    },
    disapproveUser: async (userId, reason) => {
        try {
            await get().apiCall('/api/Admin/users/toggle-approval', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: parseInt(userId),
                    is_approved: false,
                    reason: reason || 'Administrative disapproval'
                })
            });
            logger_1.authLogger.info('[AuthStore] User disapproved:', { userId, reason });
        }
        catch (error) {
            logger_1.authLogger.error('[AuthStore] Failed to disapprove user:', error);
            throw error;
        }
    },
    pauseUser: async (userId, reason) => {
        try {
            await get().apiCall('/api/Admin/users/pause', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: parseInt(userId),
                    reason: reason || 'Administrative suspension'
                })
            });
            logger_1.authLogger.info('[AuthStore] User paused:', { userId, reason });
        }
        catch (error) {
            logger_1.authLogger.error('[AuthStore] Failed to pause user:', error);
            throw error;
        }
    },
    resumeUser: async (userId) => {
        try {
            await get().apiCall('/api/Admin/users/resume', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: parseInt(userId)
                })
            });
            logger_1.authLogger.info('[AuthStore] User resumed:', { userId });
        }
        catch (error) {
            logger_1.authLogger.error('[AuthStore] Failed to resume user:', error);
            throw error;
        }
    },
    haltUser: async (userId, reason) => {
        try {
            await get().apiCall('/api/Admin/users/halt', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: parseInt(userId),
                    reason: reason || 'Security lockout'
                })
            });
            logger_1.authLogger.info('[AuthStore] User halted:', { userId, reason });
        }
        catch (error) {
            logger_1.authLogger.error('[AuthStore] Failed to halt user:', error);
            throw error;
        }
    },
    unlockUser: async (userId) => {
        try {
            await get().apiCall('/api/Admin/users/unlock', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: parseInt(userId)
                })
            });
            logger_1.authLogger.info('[AuthStore] User unlocked:', { userId });
        }
        catch (error) {
            logger_1.authLogger.error('[AuthStore] Failed to unlock user:', error);
            throw error;
        }
    },
    // ===============================
    // USER STATE UTILITY FUNCTIONS
    // ===============================
    canUserAccess: () => {
        const state = get();
        if (!state.user)
            return false;
        // State priority: LOCKOUT > SUSPENSION > APPROVAL
        if (state.user.lockoutEnabled) {
            // Check if lockout has expired
            if (state.user.lockoutEnd && new Date() > state.user.lockoutEnd) {
                return true; // Lockout expired
            }
            return false; // Still locked
        }
        if (state.user.isSuspended) {
            return false; // Suspended
        }
        return state.user.isApproved; // Must be approved
    },
    getUserStateDisplay: () => {
        const state = get();
        if (!state.user)
            return 'Unknown';
        // State priority: LOCKOUT > SUSPENSION > APPROVAL
        if (state.user.lockoutEnabled) {
            if (state.user.lockoutEnd && new Date() > state.user.lockoutEnd) {
                return 'Lockout Expired';
            }
            return 'Locked Out';
        }
        if (state.user.isSuspended) {
            return 'Suspended';
        }
        return state.user.isApproved ? 'Approved' : 'Unapproved';
    },
    isUserLocked: () => {
        const state = get();
        if (!state.user)
            return false;
        if (!state.user.lockoutEnabled)
            return false;
        // Check if lockout has expired
        if (state.user.lockoutEnd && new Date() > state.user.lockoutEnd) {
            return false; // Lockout expired
        }
        return true; // Still locked
    },
    // ===============================
    // REAL-TIME SIGNALR MANAGEMENT
    // ===============================
    initializeSignalR: async () => {
        const state = get();
        // Don't initialize if already connected or not authenticated
        if (state.signalrConnection || !state.isAuthenticated || !state.accessToken) {
            logger_1.authLogger.debug('[AuthStore] Skipping SignalR - already connected or not authenticated');
            return;
        }
        // Check if user has admin role for ActivityHub access
        const hasAdminRole = state.user?.roles?.includes('payez_admin') || false;
        if (!hasAdminRole) {
            logger_1.authLogger.info('[AuthStore] Skipping SignalR - user lacks admin role for ActivityHub');
            return;
        }
        logger_1.authLogger.info('[AuthStore] Initializing SignalR connection');
        try {
            // Use the existing signalRActivityService instead of creating a duplicate connection
            // to the same health hub - this avoids connection errors flooding the console
            // Start the health service if not already running (with timeout)
            const idpBaseUrl = process.env.IDP_URL;
            if (!idpBaseUrl) {
                throw new Error('[IDP_URL] FATAL: IDP_URL environment variable is REQUIRED.');
            }
            const startPromise = signalrActivityService_1.signalRActivityService.start(idpBaseUrl);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('SignalR start timeout')), 5000));
            await Promise.race([startPromise, timeoutPromise]);
            // Subscribe to health status changes from the dedicated health service
            const unsubscribe = signalrActivityService_1.signalRActivityService.subscribe((status) => {
                // Map health service status to our connection state
                const connectionState = status.isHealthy ?
                    signalr_1.HubConnectionState.Connected :
                    status.message.includes('reconnecting') ?
                        signalr_1.HubConnectionState.Reconnecting :
                        signalr_1.HubConnectionState.Disconnected;
                logger_1.authLogger.info('[AuthStore] Health status update:', {
                    isHealthy: status.isHealthy,
                    message: status.message,
                    connectionState
                });
                set({
                    signalrConnectionState: connectionState,
                    isConnectedToSignalR: status.isHealthy
                });
            });
            // Store the unsubscribe function for cleanup
            set({
                signalrConnection: {
                    // Minimal connection-like interface that does nothing on stop()
                    // This allows existing code to still call connection.stop() without errors
                    stop: async () => {
                        unsubscribe();
                        logger_1.authLogger.info('[AuthStore] Unsubscribed from health service');
                    }
                },
                signalrConnectionState: signalrActivityService_1.signalRActivityService.getCurrentStatus().isHealthy ?
                    signalr_1.HubConnectionState.Connected : signalr_1.HubConnectionState.Disconnected,
                isConnectedToSignalR: signalrActivityService_1.signalRActivityService.getCurrentStatus().isHealthy
            });
            logger_1.authLogger.info('[AuthStore] SignalR connection established via health service');
        }
        catch (error) {
            // Don't let SignalR errors propagate up and potentially break login flow
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Only log as error if it's not a timeout or expected connection failure
            if (errorMessage.includes('timeout') || errorMessage.includes('unavailable')) {
                logger_1.authLogger.info('[AuthStore] SignalR connection not available (expected in some environments):', errorMessage);
            }
            else {
                logger_1.authLogger.error('[AuthStore] SignalR connection failed:', error);
            }
            set({
                signalrConnectionState: signalr_1.HubConnectionState.Disconnected,
                isConnectedToSignalR: false
            });
        }
    },
    disconnectSignalR: async () => {
        const state = get();
        if (state.signalrConnection) {
            logger_1.authLogger.info('[AuthStore] Disconnecting SignalR');
            try {
                await state.signalrConnection.stop();
            }
            catch (error) {
                logger_1.authLogger.error('[AuthStore] Error disconnecting SignalR:', error);
            }
            set({
                signalrConnection: null,
                signalrConnectionState: signalr_1.HubConnectionState.Disconnected,
                isConnectedToSignalR: false
            });
        }
    },
    handleUserStateChanged: (data) => {
        // This method was designed for UserStateChanged events that don't exist in current backend
        // Keeping for future reference or if we implement proper user state change events
        const state = get();
        // If this event is about the current user, update their state
        if (data.userId === state.user?.id && state.session) {
            logger_1.authLogger.info('[AuthStore] Updating current user state from SignalR:', data);
            // ... user state update logic would go here
        }
    },
}), {
    name: 'auth-store',
}));
// ===============================
// STORE INITIALIZATION HELPER
// ===============================
/**
 * Initialize the auth store with a session (typically called in layout)
 */
const initializeAuthStore = (session) => {
    const store = exports.useAuthStore.getState();
    if (!store.isInitialized) {
        logger_1.authLogger.debug('[AuthStore] Initializing with session:', { hasSession: !!session });
        store.setSession(session);
    }
};
exports.initializeAuthStore = initializeAuthStore;
exports.default = exports.useAuthStore;
