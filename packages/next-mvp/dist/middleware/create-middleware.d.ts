/**
 * MVP Middleware - Authentication & Route Protection
 *
 * Creates a Next.js middleware handler that protects routes based on:
 * - Authentication status (session cookie → Redis viability check)
 * - 2FA completion status
 * - RBAC permissions (if enabled)
 *
 * Usage: Export the result from your app's middleware.ts:
 *   export default createMvpMiddleware();
 *
 * With custom options:
 *   export default createMvpMiddleware({
 *     circuitBreaker: myCircuitBreaker,
 *     logger: myLogger,
 *     viabilityEndpoint: '/api/session/refresh-viability',
 *   });
 */
import { NextRequest, NextResponse } from 'next/server';
export interface AuthContext {
    pathname: string;
    isPublicRoute: boolean;
    isLoginPage: boolean;
    searchParams: URLSearchParams;
    sessionPointer: SessionPointer;
    sessionStatus: SessionStatus;
    circuitBreakerOpen: boolean;
}
export interface SessionPointer {
    exists: boolean;
    sessionToken?: string;
    expired?: boolean;
    hasRefreshToken?: boolean;
    roles: string[];
    clientId: string;
}
export interface SessionStatus {
    exists: boolean | null;
    forceInvalid: boolean | null;
    requires2FA: boolean;
    twoFactorComplete: boolean;
}
export type AuthAction = {
    type: 'allow';
} | {
    type: 'redirect';
    location: string;
    reason: string;
    clearCookies?: boolean;
} | {
    type: 'service_error';
    reason: string;
} | {
    type: 'refresh_needed';
};
/**
 * Circuit breaker interface for middleware integration.
 * Implement this to provide custom circuit breaker behavior.
 */
export interface CircuitBreakerProvider {
    /** Check if circuit breaker is currently open */
    isOpen(): boolean;
    /** Check if a refresh attempt is allowed (for HALF_OPEN state) */
    canAttemptRefresh(): boolean;
    /** Record a successful operation (closes the breaker) */
    recordSuccess(): void;
    /** Record a failed operation (may open the breaker) */
    recordFailure(error?: Error): void;
    /** Check if an error is a network error (vs HTTP error) */
    isNetworkError(error: any): boolean;
}
/**
 * Logger interface for middleware.
 * Implement this to provide custom logging.
 */
export interface MiddlewareLogger {
    info(message: string, data?: Record<string, any>): void;
    warn(message: string, data?: Record<string, any>): void;
    error(message: string, data?: Record<string, any>): void;
}
/**
 * Configuration options for createMvpMiddleware
 */
export interface MvpMiddlewareOptions {
    /** Custom circuit breaker implementation */
    circuitBreaker?: CircuitBreakerProvider;
    /** Custom logger implementation */
    logger?: MiddlewareLogger;
    /** Custom viability check endpoint (default: /api/session/viability) */
    viabilityEndpoint?: string;
    /** Custom refresh endpoint (default: /api/auth/refresh) */
    refreshEndpoint?: string;
    /** Hook called on successful refresh */
    onRefreshSuccess?: () => void;
    /** Hook called on refresh failure */
    onRefreshFailure?: (status: number, isNetworkError: boolean) => void;
    /** Additional paths to bypass middleware (beyond /api/auth/ and /api/session/) */
    bypassPaths?: string[];
}
export declare function createMvpMiddleware(options?: MvpMiddlewareOptions): (request: NextRequest) => Promise<NextResponse>;
