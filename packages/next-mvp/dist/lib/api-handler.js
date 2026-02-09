"use strict";
/**
 * Unified API Handler for PayEz Next.js Applications
 *
 * Provides a single, comprehensive API handler with:
 * - Coordinated token refresh with Redis locks
 * - Role-based access control
 * - Middleware queue support
 * - Timeout handling
 * - Standardized PayEz API response format
 * - Client slug validation (security)
 *
 * @version 1.0.0
 * @since Consolidated from website-membership simple-api-handler + MVP auth-handler
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_PRESETS = exports.ApiHandler = exports.ApiResponseBuilder = void 0;
exports.createApiHandler = createApiHandler;
const server_1 = require("next/server");
const nanoid_1 = require("nanoid");
const session_store_1 = require("./session-store");
const test_aware_get_token_1 = require("./test-aware-get-token");
const internal_api_1 = require("./internal-api");
// ============================================================================
// API Response Builder (for backward compatibility)
// ============================================================================
class ApiResponseBuilder {
    context;
    constructor(context) {
        this.context = context;
    }
    success(data, meta) {
        return {
            success: true,
            data,
            message: meta?.operation ? `${meta.operation.replace(/-/g, ' ')} completed successfully` : 'Operation completed successfully',
            operation_code: meta?.operation || 'unknown-operation',
            meta: {
                version: '1.0',
                responseTime: Date.now() - this.context.startTime,
                ...meta
            },
            timestamp: new Date().toISOString(),
            request_id: this.context.requestId
        };
    }
    error(code, message, details) {
        return {
            success: false,
            error: {
                code,
                message: message || code,
                details
            },
            meta: {
                version: '1.0',
                responseTime: Date.now() - this.context.startTime
            },
            timestamp: new Date().toISOString(),
            request_id: this.context.requestId
        };
    }
}
exports.ApiResponseBuilder = ApiResponseBuilder;
// ============================================================================
// API Handler Class
// ============================================================================
class ApiHandler {
    config;
    middlewareQueue = [];
    constructor(config = {}) {
        this.config = {
            requireAuth: config.requireAuth ?? true,
            requiredRoles: config.requiredRoles ?? [],
            timeout: config.timeout ?? 30000,
            validateClientSlug: config.validateClientSlug ?? true,
        };
    }
    /**
     * Add middleware to the handler chain
     */
    use(middleware) {
        this.middlewareQueue.push(middleware);
        return this;
    }
    /**
     * Create the route handler
     */
    handle(handler) {
        return async (req) => {
            const startTime = Date.now();
            const requestId = (0, nanoid_1.nanoid)();
            const ctx = {
                requestId,
                startTime,
                endpoint: req.nextUrl.pathname,
                method: req.method,
                userAgent: req.headers.get('user-agent') || undefined,
                ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
            };
            try {
                // Execute middleware chain
                for (const middleware of this.middlewareQueue) {
                    await middleware.execute(ctx, this.config);
                }
                // Handle authentication
                const authResult = await this.handleAuthentication(req, ctx);
                if (!authResult.success) {
                    if (authResult.reason === 'REFRESH_IN_PROGRESS') {
                        const response = this.errorResponse('SERVICE_UNAVAILABLE', 'Token refresh in progress', 503, requestId);
                        response.headers.set('Retry-After', '1');
                        return response;
                    }
                    if (this.config.requireAuth) {
                        return this.errorResponse('UNAUTHORIZED', 'Authentication required', 401, requestId);
                    }
                }
                const auth = authResult.auth || this.createEmptyAuth();
                // Attach auth context to request for downstream use
                if (auth.accessToken) {
                    req.__authContext = { accessToken: auth.accessToken };
                }
                // Check roles
                if (this.config.requiredRoles.length > 0 && auth) {
                    const hasRequiredRole = this.config.requiredRoles.some(role => auth.roles.includes(role));
                    if (!hasRequiredRole) {
                        return this.errorResponse('FORBIDDEN', 'Insufficient permissions', 403, requestId);
                    }
                }
                // Create response builder for backward compatibility
                const responseBuilder = new ApiResponseBuilder(ctx);
                // Execute handler with timeout
                const result = await this.executeWithTimeout(handler(req, ctx, auth, responseBuilder), this.config.timeout);
                return this.successResponse(result, requestId, ctx);
            }
            catch (error) {
                if (error instanceof Error && error.message === 'Request timeout') {
                    return this.errorResponse('TIMEOUT', 'Request timeout', 408, requestId);
                }
                const statusCode = error instanceof Error ? this.getStatusFromError(error) : 500;
                const message = error instanceof Error ? error.message : 'An unexpected error occurred';
                return this.errorResponse(this.getErrorCode(statusCode), message, statusCode, requestId);
            }
        };
    }
    // ==========================================================================
    // Authentication
    // ==========================================================================
    async handleAuthentication(req, ctx) {
        try {
            const token = await (0, test_aware_get_token_1.getTokenTestAware)(req);
            if (!token) {
                if (this.config.requireAuth) {
                    return { success: false, reason: 'NO_TOKEN' };
                }
                return { success: true, auth: this.createEmptyAuth() };
            }
            // Client slug validation (security feature from auth-handler)
            if (this.config.validateClientSlug) {
                const validationResult = this.validateClientSlug(token);
                if (!validationResult.valid) {
                    return { success: false, reason: validationResult.reason };
                }
            }
            // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
            const sessionToken = token.sessionToken || token.redisSessionId;
            if (!sessionToken) {
                return this.handleNoSessionToken(token, ctx);
            }
            // Get session with version for coordinated refresh
            const sessionWithVersion = await (0, session_store_1.getSessionWithVersion)(sessionToken);
            if (!sessionWithVersion) {
                return { success: false, reason: 'SESSION_EXPIRED' };
            }
            const { session: sessionData } = sessionWithVersion;
            let accessToken = sessionData.idpAccessToken || null;
            let userRoles = Array.isArray(sessionData.roles) ? sessionData.roles : [];
            // Merge roles from JWT token
            try {
                const tokenRoles = Array.isArray(token.roles) ? token.roles : [];
                if (tokenRoles.length > 0) {
                    userRoles = Array.from(new Set([...userRoles, ...tokenRoles]));
                }
            }
            catch { /* ignore */ }
            // Check if token needs refresh
            const thresholdMs = 5 * 60 * 1000;
            const expires = sessionData.idpAccessTokenExpires || 0;
            const needsRefresh = !accessToken || (expires - Date.now()) <= thresholdMs;
            if (needsRefresh) {
                const refreshResult = await this.handleCoordinatedRefresh(req, token, sessionData, ctx);
                if (refreshResult.blocked) {
                    return { success: false, reason: 'REFRESH_IN_PROGRESS' };
                }
                if (refreshResult.accessToken) {
                    accessToken = refreshResult.accessToken;
                    if (refreshResult.roles) {
                        userRoles = Array.from(new Set([...userRoles, ...refreshResult.roles]));
                    }
                }
            }
            if (!accessToken) {
                return { success: false, reason: 'NO_ACCESS_TOKEN' };
            }
            ctx.userId = token.sub;
            ctx.sessionId = sessionToken;
            return {
                success: true,
                auth: {
                    accessToken,
                    userId: token.sub,
                    roles: userRoles,
                    sessionId: sessionToken,
                    tokenType: 'bearer',
                    refreshToken: sessionData?.refreshToken || null,
                }
            };
        }
        catch (error) {
            return { success: false, reason: 'AUTH_ERROR' };
        }
    }
    validateClientSlug(token) {
        const expectedClientSlug = process.env.NEXT_PUBLIC_EXPECTED_CLIENT_SLUG;
        // If not configured, skip validation (backward compat)
        if (!expectedClientSlug) {
            return { valid: true, reason: '' };
        }
        const tokenClientSlug = token.client_slug || token.clientSlug;
        if (!tokenClientSlug) {
            return { valid: false, reason: 'TOKEN_MISSING_CLIENT_SLUG' };
        }
        if (tokenClientSlug.toLowerCase() !== expectedClientSlug.toLowerCase()) {
            return { valid: false, reason: 'TOKEN_CLIENT_MISMATCH' };
        }
        return { valid: true, reason: '' };
    }
    handleNoSessionToken(token, ctx) {
        const allowTestFallback = process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test';
        if (allowTestFallback && token.accessToken) {
            return {
                success: true,
                auth: {
                    accessToken: token.accessToken,
                    userId: token.sub,
                    roles: token.roles || [],
                    sessionId: undefined,
                    tokenType: 'bearer',
                    refreshToken: null,
                }
            };
        }
        if (this.config.requireAuth) {
            return { success: false, reason: 'NO_SESSION_TOKEN' };
        }
        return { success: true, auth: this.createEmptyAuth() };
    }
    // ==========================================================================
    // Coordinated Refresh
    // ==========================================================================
    async handleCoordinatedRefresh(req, token, sessionData, ctx) {
        // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
        const sessionToken = token.sessionToken || token.redisSessionId;
        const existingLock = await (0, session_store_1.checkRefreshLock)(sessionToken);
        if (existingLock) {
            // Wait for existing refresh to complete
            const waitResult = await this.waitForRefresh(sessionToken, 10000);
            if (waitResult.success) {
                const refreshed = await (0, session_store_1.getSession)(sessionToken);
                if (refreshed?.accessToken) {
                    return {
                        accessToken: refreshed.accessToken,
                        roles: Array.isArray(refreshed.roles) ? refreshed.roles : [],
                    };
                }
            }
            return { blocked: true };
        }
        // Try to acquire lock
        const lockResult = await (0, session_store_1.acquireRefreshLock)(sessionToken, ctx.requestId, 5000);
        if (!lockResult.acquired || !lockResult.lockInfo) {
            const waitResult = await this.waitForRefresh(sessionToken, 10000);
            if (waitResult.success) {
                const refreshed = await (0, session_store_1.getSession)(sessionToken);
                if (refreshed?.accessToken) {
                    return {
                        accessToken: refreshed.accessToken,
                        roles: Array.isArray(refreshed.roles) ? refreshed.roles : [],
                    };
                }
            }
            return { blocked: true };
        }
        try {
            // Double-check if still needs refresh
            const latest = await (0, session_store_1.getSession)(sessionToken);
            const thresholdMs = 5 * 60 * 1000;
            const stillNeeds = !latest?.accessToken || ((latest?.accessTokenExpires || 0) - Date.now()) <= thresholdMs;
            if (!stillNeeds && latest?.accessToken) {
                return {
                    accessToken: latest.accessToken,
                    roles: Array.isArray(latest.roles) ? latest.roles : [],
                };
            }
            // Use centralized internal API helper for server-to-server refresh calls
            const refreshResponse = await (0, internal_api_1.internalRefresh)(req.headers.get('cookie') || '', sessionToken, sessionData.idpRefreshToken, ctx.requestId);
            if (!refreshResponse.ok) {
                return {};
            }
            const refreshed = await (0, session_store_1.getSession)(sessionToken);
            if (refreshed?.accessToken) {
                return {
                    accessToken: refreshed.accessToken,
                    roles: Array.isArray(refreshed.roles) ? refreshed.roles : [],
                };
            }
            return {};
        }
        finally {
            await (0, session_store_1.releaseRefreshLock)(sessionToken, ctx.requestId, lockResult.lockInfo.lockVersion);
        }
    }
    async waitForRefresh(sessionToken, maxWaitMs) {
        const startTime = Date.now();
        const pollInterval = 100;
        while (Date.now() - startTime < maxWaitMs) {
            const lockExists = await (0, session_store_1.checkRefreshLock)(sessionToken);
            if (!lockExists) {
                const session = await (0, session_store_1.getSession)(sessionToken);
                if (session?.accessToken) {
                    const expires = session.accessTokenExpires || 0;
                    if ((expires - Date.now()) > (5 * 60 * 1000)) {
                        return { success: true };
                    }
                }
                return { success: false };
            }
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        return { success: false };
    }
    // ==========================================================================
    // Response Helpers
    // ==========================================================================
    createEmptyAuth() {
        return {
            accessToken: null,
            roles: [],
            tokenType: 'bearer',
            refreshToken: null,
        };
    }
    async executeWithTimeout(promise, timeoutMs) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
        });
        return Promise.race([promise, timeoutPromise]);
    }
    successResponse(data, requestId, ctx) {
        // Pass through Response objects unchanged
        if (data instanceof Response) {
            return data;
        }
        // Handle nested success/error flags
        if (data && typeof data === 'object') {
            if (Object.prototype.hasOwnProperty.call(data, 'success')) {
                if (data.success === false) {
                    const msg = data.error?.message || data.message || 'Upstream service error';
                    const code = data.error?.code || 'UPSTREAM_SERVICE_ERROR';
                    return this.errorResponse(code, msg, 400, requestId);
                }
            }
        }
        return server_1.NextResponse.json({
            success: true,
            data,
            message: 'Operation completed successfully',
            operation_code: 'api_handler_operation',
            timestamp: new Date().toISOString(),
            request_id: requestId,
            meta: {
                version: '1.0',
                responseTime: Date.now() - ctx.startTime,
            }
        }, { status: 200 });
    }
    errorResponse(code, message, status, requestId) {
        const now = new Date().toISOString();
        return server_1.NextResponse.json({
            success: false,
            message,
            operation_code: 'api_handler_error',
            timestamp: now,
            request_id: requestId,
            error: {
                code,
                message,
                support: { request_id: requestId, timestamp: now }
            },
            meta: { version: '1.0' }
        }, { status });
    }
    getStatusFromError(error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('unauthorized'))
            return 401;
        if (msg.includes('forbidden') || msg.includes('insufficient permissions'))
            return 403;
        if (msg.includes('not found'))
            return 404;
        if (msg.includes('timeout'))
            return 408;
        if (msg.includes('rate limit'))
            return 429;
        if (msg.includes('bad gateway') || msg.includes('upstream'))
            return 502;
        if (msg.includes('service unavailable'))
            return 503;
        return 500;
    }
    getErrorCode(status) {
        switch (status) {
            case 400: return 'BAD_REQUEST';
            case 401: return 'UNAUTHORIZED';
            case 403: return 'FORBIDDEN';
            case 404: return 'NOT_FOUND';
            case 408: return 'TIMEOUT';
            case 429: return 'RATE_LIMIT_EXCEEDED';
            case 502: return 'BAD_GATEWAY';
            case 503: return 'SERVICE_UNAVAILABLE';
            default: return 'INTERNAL_SERVER_ERROR';
        }
    }
}
exports.ApiHandler = ApiHandler;
// ============================================================================
// Factory Function
// ============================================================================
/**
 * Create an API handler with the specified configuration
 *
 * @example
 * ```typescript
 * export const GET = createApiHandler({ requireAuth: true })
 *   .handle(async (req, ctx, auth) => {
 *     return { data: 'hello' };
 *   });
 * ```
 */
function createApiHandler(config = {}) {
    return new ApiHandler(config);
}
// ============================================================================
// Pre-configured Presets
// ============================================================================
/**
 * Pre-configured API handler presets for common use cases
 */
exports.API_PRESETS = {
    /** Public endpoint - no authentication required */
    PUBLIC: () => createApiHandler({ requireAuth: false, validateClientSlug: false }),
    /** Authenticated endpoint - any logged-in user */
    AUTHENTICATED: () => createApiHandler({ requireAuth: true }),
    /** User endpoint - requires payez_user or payez_admin role */
    USER: () => createApiHandler({
        requireAuth: true,
        requiredRoles: ['payez_user', 'payez_admin'],
    }),
    /** Admin endpoint - requires payez_admin role */
    ADMIN: () => createApiHandler({
        requireAuth: true,
        requiredRoles: ['payez_admin'],
    }),
};
// ============================================================================
// Default Export
// ============================================================================
exports.default = createApiHandler;
