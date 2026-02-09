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
import { NextRequest, NextResponse } from 'next/server';
export interface ApiHandlerConfig {
    /** Whether authentication is required (default: true) */
    requireAuth?: boolean;
    /** Roles required to access this endpoint */
    requiredRoles?: string[];
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Validate client_slug in token matches expected (default: true) */
    validateClientSlug?: boolean;
}
export interface ApiRequestContext {
    requestId: string;
    startTime: number;
    endpoint: string;
    method: string;
    userId?: string;
    sessionId?: string;
    userAgent?: string;
    ipAddress?: string;
    params?: Record<string, string>;
}
export interface ApiAuthContext {
    accessToken: string | null;
    userId?: string;
    roles: string[];
    sessionId?: string;
    tokenType: string;
    refreshToken: string | null;
}
export interface ApiMiddleware {
    name: string;
    execute: (context: ApiRequestContext, config: ApiHandlerConfig) => Promise<void>;
}
export type ApiHandlerFunction<T = any> = (req: NextRequest, ctx: ApiRequestContext, auth: ApiAuthContext, responseBuilder: any) => Promise<T>;
export declare class ApiResponseBuilder {
    private context;
    constructor(context: ApiRequestContext);
    success<T>(data: T, meta?: {
        operation?: string;
        version?: string;
        [key: string]: any;
    }): {
        success: true;
        data: T;
        message: string;
        operation_code: string;
        meta: any;
        timestamp: string;
        request_id: string;
    };
    error(code: string, message?: string, details?: Record<string, any>): {
        success: false;
        error: any;
        meta: any;
        timestamp: string;
        request_id: string;
    };
}
export declare class ApiHandler {
    private config;
    private middlewareQueue;
    constructor(config?: ApiHandlerConfig);
    /**
     * Add middleware to the handler chain
     */
    use(middleware: ApiMiddleware): this;
    /**
     * Create the route handler
     */
    handle<T = any>(handler: ApiHandlerFunction<T>): (req: NextRequest) => Promise<NextResponse>;
    private handleAuthentication;
    private validateClientSlug;
    private handleNoSessionToken;
    private handleCoordinatedRefresh;
    private waitForRefresh;
    private createEmptyAuth;
    private executeWithTimeout;
    private successResponse;
    private errorResponse;
    private getStatusFromError;
    private getErrorCode;
}
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
export declare function createApiHandler(config?: ApiHandlerConfig): ApiHandler;
/**
 * Pre-configured API handler presets for common use cases
 */
export declare const API_PRESETS: {
    /** Public endpoint - no authentication required */
    readonly PUBLIC: () => ApiHandler;
    /** Authenticated endpoint - any logged-in user */
    readonly AUTHENTICATED: () => ApiHandler;
    /** User endpoint - requires payez_user or payez_admin role */
    readonly USER: () => ApiHandler;
    /** Admin endpoint - requires payez_admin role */
    readonly ADMIN: () => ApiHandler;
};
export default createApiHandler;
