/**
 * Page RBAC Check Module
 *
 * Checks page-level permissions via Vibe API through the IDP Proxy.
 * Uses in-memory cache to reduce API calls.
 * Fails closed (DENY) on errors or timeout.
 *
 * All requests route through the IDP Vibe Proxy ({IDP_URL}/api/vibe/proxy)
 * which injects proper HMAC credentials for the Vibe API.
 *
 * @version 2.0.0
 * @since page-rbac-2026-01
 */
export interface RBACResult {
    allowed: boolean;
    requires_2fa?: boolean;
    requires_elevated_auth?: boolean;
    reason?: string;
    required_roles?: string[];
    required_claims?: Array<{
        type: string;
        value: string;
    }>;
    matched_rule?: string;
    redirect?: string;
    cache_ttl?: number;
}
/**
 * Clear cache (for testing or config changes).
 */
export declare function clearRBACCache(): void;
/**
 * Check if user has permission to access a page.
 *
 * Routes through IDP Vibe Proxy ({IDP_URL}/api/vibe/proxy) which injects
 * proper HMAC credentials. The Vibe RBAC endpoint requires client context
 * that only the proxy can provide.
 *
 * FAIL CLOSED: If proxy is unreachable or times out, access is DENIED.
 *
 * @param path - The route path to check
 * @param userRoles - User's roles from session
 * @param clientId - Client slug for multi-tenancy
 * @param userClaims - Optional claims for claim-based authorization
 * @returns RBAC result with allowed/denied status
 */
export declare function checkPagePermission(path: string, userRoles: string[], clientId: string, userClaims?: Record<string, string>): Promise<RBACResult>;
/**
 * Check if RBAC is enabled for this deployment.
 */
export declare function isRBACEnabled(): boolean;
