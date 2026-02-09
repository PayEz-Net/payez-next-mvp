export interface UnauthenticatedRouteConfig {
    pattern: string;
    description: string;
    allowDuringCircuitBreakerOpen?: boolean;
    requiresRateLimit?: boolean;
}
export declare const UNAUTHENTICATED_ROUTES: UnauthenticatedRouteConfig[];
export declare function isUnauthenticatedRoute(pathname: string): boolean;
export declare function isAllowedDuringCircuitBreakerOpen(pathname: string): boolean;
export declare function requiresRateLimit(pathname: string): boolean;
declare const _default: {
    UNAUTHENTICATED_ROUTES: UnauthenticatedRouteConfig[];
    isUnauthenticatedRoute: typeof isUnauthenticatedRoute;
    isAllowedDuringCircuitBreakerOpen: typeof isAllowedDuringCircuitBreakerOpen;
    requiresRateLimit: typeof requiresRateLimit;
};
export default _default;
