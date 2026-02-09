/**
 * Advanced Route Configuration for `@payez/next-mvp`
 *
 * This module provides a robust, pattern-based mechanism for defining
 * unauthenticated (public) routes, including wildcard support.
 * It is designed to be easily configurable by host applications.
 */
import { TwoFactorRequirements } from '../middleware/twofa-presets';
export interface UnauthenticatedRouteConfig {
    /** The route pattern (supports wildcards with *) */
    pattern: string;
    /** Description of what this route is for */
    description: string;
    /** Whether this route should be accessible during circuit breaker open state */
    allowDuringCircuitBreakerOpen?: boolean;
    /** Whether this route requires rate limiting even when unauthenticated */
    requiresRateLimit?: boolean;
}
/**
 * Protected route configuration with 2FA requirements
 */
export interface ProtectedRouteConfig {
    /** The route pattern (supports wildcards with *) */
    pattern: string;
    /** Description of what this route is for */
    description?: string;
    /** 2FA requirements for this route (default: requires 2FA if site requires it) */
    twoFactorRequirements: TwoFactorRequirements;
}
/**
 * Configures additional public routes for the application.
 * This function should be called once during application initialization.
 * @param appRoutes An array of route patterns or UnauthenticatedRouteConfig objects.
 */
export declare function configurePublicRoutes(appRoutes?: (string | UnauthenticatedRouteConfig)[]): void;
/**
 * Configures routes that require authentication but bypass 2FA requirements.
 * Essential for 2FA onboarding flows where user is authenticated but hasn't completed 2FA yet.
 * @param routes An array of route patterns or ProtectedRouteConfig objects.
 */
export declare function configure2FABypassRoutes(routes?: (string | ProtectedRouteConfig)[]): void;
/**
 * Checks if a route should bypass 2FA requirements (but still requires auth).
 * @param pathname The URL pathname to check.
 * @returns The ProtectedRouteConfig if found, otherwise undefined.
 */
export declare function get2FABypassConfig(pathname: string): ProtectedRouteConfig | undefined;
/**
 * Checks if a route should bypass 2FA requirements.
 * @param pathname The URL pathname to check.
 * @returns true if 2FA should be bypassed for this route.
 */
export declare function should2FABypass(pathname: string): boolean;
/**
 * Checks if a given pathname matches any of the configured unauthenticated routes.
 * Supports wildcard matching (e.g., '/api/*').
 * @param pathname The URL pathname to check.
 * @returns `true` if the route is unauthenticated, `false` otherwise.
 */
export declare function isUnauthenticatedRoute(pathname: string): boolean;
/**
 * Retrieves the configuration for a specific route.
 * @param pathname The URL pathname to get the configuration for.
 * @returns The `UnauthenticatedRouteConfig` object if found, otherwise `undefined`.
 */
export declare function getRouteConfig(pathname: string): UnauthenticatedRouteConfig | undefined;
