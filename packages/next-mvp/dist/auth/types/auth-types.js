"use strict";
/**
 * ============================================================================
 * AUTH TYPES - Single Source of Truth
 * ============================================================================
 *
 * This file defines ALL authentication-related types for the PayEz Next MVP.
 * Every type has ONE name and ONE meaning. No aliases. No confusion.
 *
 * GLOSSARY:
 * ---------
 * RedisSessionId    - UUID stored in browser cookie, keys into Redis session
 * IdpAccessToken    - JWT from PayEz IDP, used for backend API calls
 * IdpRefreshToken   - JWT from PayEz IDP, used to get new access tokens
 * OAuthProviderToken - Token from Google/Microsoft/etc (NOT for our APIs)
 *
 * DATA FLOW:
 * ----------
 * 1. User logs in (credentials or OAuth)
 * 2. IDP returns IdpAccessToken + IdpRefreshToken
 * 3. We create RedisSessionData in Redis, get back RedisSessionId
 * 4. RedisSessionId goes in NextAuth JWT cookie (browser)
 * 5. On each request: cookie -> RedisSessionId -> Redis -> tokens
 *
 * SECURITY NOTES:
 * ---------------
 * - Tokens NEVER stored in NextAuth JWT (only RedisSessionId)
 * - Tokens ONLY stored in Redis (server-side)
 * - Browser only sees RedisSessionId (opaque UUID)
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toRedisSessionId = toRedisSessionId;
exports.toIdpAccessToken = toIdpAccessToken;
exports.toIdpRefreshToken = toIdpRefreshToken;
exports.toOAuthProviderToken = toOAuthProviderToken;
// ============================================================================
// HELPER FUNCTIONS - Create branded types from raw strings
// ============================================================================
function toRedisSessionId(value) {
    return value;
}
function toIdpAccessToken(value) {
    return value;
}
function toIdpRefreshToken(value) {
    return value;
}
function toOAuthProviderToken(value) {
    return value;
}
