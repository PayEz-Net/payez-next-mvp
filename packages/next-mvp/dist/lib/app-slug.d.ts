/**
 * App Slug Utility for `@payez/next-mvp`
 *
 * Provides app-specific namespacing for Redis keys and cookies to prevent
 * collisions when multiple MVP-based apps run on the same host (e.g., localhost).
 *
 * The slug is derived from:
 * 1. APP_SLUG environment variable (preferred)
 * 2. CLIENT_ID environment variable (fallback)
 * 3. 'payez' (default fallback)
 */
/**
 * Gets the app slug for namespacing.
 * Caches the result for performance.
 */
export declare function getAppSlug(): string;
/**
 * Clears the cached slug (useful for testing).
 */
export declare function clearSlugCache(): void;
/**
 * Gets the prefix for session keys.
 * Format: {slug}:sess:
 */
export declare function getSessionPrefix(): string;
/**
 * Gets the prefix for anonymous session keys.
 * Format: {slug}:anon:
 */
export declare function getAnonPrefix(): string;
/**
 * Gets the prefix for refresh lock keys.
 * Format: {slug}:refresh_lock:
 */
export declare function getRefreshLockPrefix(): string;
/**
 * THE session cookie name - SINGLE SOURCE OF TRUTH.
 *
 * This is used by:
 * - better-auth.ts (cookies.sessionToken.name)
 * - getToken() calls (cookieName parameter)
 * - getJwtCookieName() (alias for consistency)
 *
 * Format: {slug}.session-token
 */
export declare function getSessionCookieName(): string;
/**
 * Gets the JWT cookie name for getToken() calls.
 *
 * CRITICAL: This MUST match what the auth config sets:
 * - Production: __Secure-{slug}.session-token
 * - Development: {slug}.session-token
 *
 * This is the cookie name that getToken() should use to READ the JWT.
 */
export declare function getJwtCookieName(): string;
/**
 * Validates that cookie names are consistent with the auth config.
 * Call this at startup to catch mismatches early.
 */
export declare function validateCookieNameConsistency(): void;
/**
 * Gets the __Secure- prefixed cookie name.
 *
 * WARNING: This is ONLY for clearing cookies during logout.
 * DO NOT use this for reading cookies - use getSessionCookieName().
 * Auth does NOT automatically use this prefix.
 *
 * Format: __Secure-{slug}.session-token
 */
export declare function getSecureSessionCookieName(): string;
/**
 * Gets the anonymous session cookie name.
 * Format: {slug}_anon_id
 */
export declare function getAnonCookieName(): string;
/**
 * Gets the CSRF token cookie name.
 * Format: {slug}.csrf-token
 */
export declare function getCsrfCookieName(): string;
/**
 * Gets the __Host- prefixed CSRF cookie name.
 *
 * WARNING: This is ONLY for clearing cookies during logout.
 * DO NOT use this for reading cookies - use getCsrfCookieName().
 *
 * Format: __Host-{slug}.csrf-token
 */
export declare function getSecureCsrfCookieName(): string;
/**
 * Gets the callback URL cookie name.
 * Format: {slug}.callback-url
 */
export declare function getCallbackUrlCookieName(): string;
