"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppSlug = getAppSlug;
exports.clearSlugCache = clearSlugCache;
exports.getSessionPrefix = getSessionPrefix;
exports.getAnonPrefix = getAnonPrefix;
exports.getRefreshLockPrefix = getRefreshLockPrefix;
exports.getSessionCookieName = getSessionCookieName;
exports.getJwtCookieName = getJwtCookieName;
exports.validateCookieNameConsistency = validateCookieNameConsistency;
exports.getSecureSessionCookieName = getSecureSessionCookieName;
exports.getAnonCookieName = getAnonCookieName;
exports.getCsrfCookieName = getCsrfCookieName;
exports.getSecureCsrfCookieName = getSecureCsrfCookieName;
exports.getCallbackUrlCookieName = getCallbackUrlCookieName;
let cachedSlug = null;
/**
 * Gets the app slug for namespacing.
 * Caches the result for performance.
 */
function getAppSlug() {
    if (cachedSlug !== null) {
        return cachedSlug;
    }
    // Priority: APP_SLUG > CLIENT_ID > default
    cachedSlug = process.env.APP_SLUG || process.env.CLIENT_ID || 'payez';
    return cachedSlug;
}
/**
 * Clears the cached slug (useful for testing).
 */
function clearSlugCache() {
    cachedSlug = null;
}
// ============================================================================
// Redis Key Prefixes
// ============================================================================
/**
 * Gets the prefix for session keys.
 * Format: {slug}:sess:
 */
function getSessionPrefix() {
    return `${getAppSlug()}:sess:`;
}
/**
 * Gets the prefix for anonymous session keys.
 * Format: {slug}:anon:
 */
function getAnonPrefix() {
    return `${getAppSlug()}:anon:`;
}
/**
 * Gets the prefix for refresh lock keys.
 * Format: {slug}:refresh_lock:
 */
function getRefreshLockPrefix() {
    return `${getAppSlug()}:refresh_lock:`;
}
// ============================================================================
// Cookie Names - SINGLE SOURCE OF TRUTH
// ============================================================================
//
// CRITICAL: The session cookie name MUST be consistent between:
//   1. better-auth.ts (where auth SETS the cookie)
//   2. getToken() calls (where we READ the cookie)
//
// If these don't match, sessions will appear empty in one environment but
// work in another (e.g., works on localhost but fails in production).
//
// The ONLY cookie name for sessions is getSessionCookieName().
// DO NOT use environment-specific variants for reading cookies.
// ============================================================================
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
function getSessionCookieName() {
    return `${getAppSlug()}.session-token`;
}
/**
 * Gets the JWT cookie name for getToken() calls.
 *
 * CRITICAL: This MUST match what the auth config sets:
 * - Production: __Secure-{slug}.session-token
 * - Development: {slug}.session-token
 *
 * This is the cookie name that getToken() should use to READ the JWT.
 */
function getJwtCookieName() {
    // Must match auth config cookies.sessionToken.name logic
    if (process.env.NODE_ENV === 'production') {
        return getSecureSessionCookieName();
    }
    return getSessionCookieName();
}
/**
 * Validates that cookie names are consistent with the auth config.
 * Call this at startup to catch mismatches early.
 */
function validateCookieNameConsistency() {
    const jwtName = getJwtCookieName();
    const expectedName = process.env.NODE_ENV === 'production'
        ? getSecureSessionCookieName()
        : getSessionCookieName();
    if (jwtName !== expectedName) {
        throw new Error(`[FATAL] Cookie name mismatch detected!\n` +
            `  getJwtCookieName() = "${jwtName}"\n` +
            `  Expected for ${process.env.NODE_ENV} = "${expectedName}"\n` +
            `These MUST match or sessions will fail.`);
    }
}
/**
 * Gets the __Secure- prefixed cookie name.
 *
 * WARNING: This is ONLY for clearing cookies during logout.
 * DO NOT use this for reading cookies - use getSessionCookieName().
 * Auth does NOT automatically use this prefix.
 *
 * Format: __Secure-{slug}.session-token
 */
function getSecureSessionCookieName() {
    return `__Secure-${getAppSlug()}.session-token`;
}
/**
 * Gets the anonymous session cookie name.
 * Format: {slug}_anon_id
 */
function getAnonCookieName() {
    return `${getAppSlug()}_anon_id`;
}
/**
 * Gets the CSRF token cookie name.
 * Format: {slug}.csrf-token
 */
function getCsrfCookieName() {
    return `${getAppSlug()}.csrf-token`;
}
/**
 * Gets the __Host- prefixed CSRF cookie name.
 *
 * WARNING: This is ONLY for clearing cookies during logout.
 * DO NOT use this for reading cookies - use getCsrfCookieName().
 *
 * Format: __Host-{slug}.csrf-token
 */
function getSecureCsrfCookieName() {
    return `__Host-${getAppSlug()}.csrf-token`;
}
/**
 * Gets the callback URL cookie name.
 * Format: {slug}.callback-url
 */
function getCallbackUrlCookieName() {
    return `${getAppSlug()}.callback-url`;
}
