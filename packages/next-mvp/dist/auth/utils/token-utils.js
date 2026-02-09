"use strict";
/**
 * Token Utilities
 *
 * JWT decoding and expiry checking utilities.
 * Extracted from auth-options.ts for clarity.
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractKidFromToken = exports.decodeJwtHeader = void 0;
exports.decodeIdpAccessToken = decodeIdpAccessToken;
exports.decodeIdpAccessTokenFull = decodeIdpAccessTokenFull;
exports.extractEmailFromToken = extractEmailFromToken;
exports.extractRolesFromToken = extractRolesFromToken;
exports.extractAmrFromToken = extractAmrFromToken;
exports.tokenNeedsRefresh = tokenNeedsRefresh;
exports.tokenIsExpired = tokenIsExpired;
exports.msUntilExpiry = msUntilExpiry;
exports.expClaimToMs = expClaimToMs;
exports.validateTokenExpiry = validateTokenExpiry;
const jwt_decode_1 = require("../../lib/jwt-decode");
// Re-export header utilities for consumers
var jwt_decode_2 = require("../../lib/jwt-decode");
Object.defineProperty(exports, "decodeJwtHeader", { enumerable: true, get: function () { return jwt_decode_2.decodeJwtHeader; } });
Object.defineProperty(exports, "extractKidFromToken", { enumerable: true, get: function () { return jwt_decode_2.extractKidFromToken; } });
// ============================================================================
// TOKEN DECODING
// ============================================================================
/**
 * Decode an IDP access token and extract claims.
 *
 * @param token - The JWT access token from IDP
 * @returns Decoded token claims, or null if decode fails
 */
function decodeIdpAccessToken(token) {
    try {
        return (0, jwt_decode_1.jwtDecode)(token);
    }
    catch (error) {
        console.error('[TOKEN_UTILS] Failed to decode access token:', error);
        return null;
    }
}
/**
 * Decode both JWT header and payload from an IDP access token.
 * Returns the signing key ID (kid) along with payload claims.
 *
 * @param token - The JWT access token from IDP
 * @returns Object with header (including kid) and payload, or null if decode fails
 */
function decodeIdpAccessTokenFull(token) {
    try {
        const header = (0, jwt_decode_1.decodeJwtHeader)(token);
        const payload = (0, jwt_decode_1.jwtDecode)(token);
        if (!header || !payload) {
            return null;
        }
        return {
            header,
            payload,
            bearerKeyId: header.kid,
        };
    }
    catch (error) {
        console.error('[TOKEN_UTILS] Failed to decode access token (full):', error);
        return null;
    }
}
/**
 * Extract user email from decoded token.
 * Handles multiple possible claim names used by IDP.
 */
function extractEmailFromToken(decoded) {
    return (decoded.email ||
        decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        '');
}
/**
 * Extract roles from decoded token.
 * Handles both 'role' and 'roles' claims, and both string and array formats.
 */
function extractRolesFromToken(decoded) {
    const rolesClaim = decoded.role || decoded.roles;
    if (!rolesClaim) {
        return [];
    }
    if (Array.isArray(rolesClaim)) {
        return rolesClaim;
    }
    if (typeof rolesClaim === 'string') {
        // Could be a single role or JSON array string
        try {
            const parsed = JSON.parse(rolesClaim);
            return Array.isArray(parsed) ? parsed : [rolesClaim];
        }
        catch {
            return [rolesClaim];
        }
    }
    return [];
}
/**
 * Extract AMR (Authentication Methods References) from decoded token.
 */
function extractAmrFromToken(decoded) {
    const amr = decoded.amr;
    if (!amr) {
        return [];
    }
    if (Array.isArray(amr)) {
        return amr;
    }
    if (typeof amr === 'string') {
        try {
            const parsed = JSON.parse(amr);
            return Array.isArray(parsed) ? parsed : [amr];
        }
        catch {
            return [amr];
        }
    }
    return [];
}
// ============================================================================
// EXPIRY CHECKING
// ============================================================================
/**
 * Check if a token expiry timestamp indicates the token needs refresh.
 *
 * @param expiresAt - Token expiry timestamp (Unix milliseconds)
 * @param bufferMs - How early to trigger refresh (default 5 minutes)
 * @returns true if token is expired or will expire within buffer period
 */
function tokenNeedsRefresh(expiresAt, bufferMs = 5 * 60 * 1000) {
    if (!expiresAt) {
        return true; // No expiry info = assume needs refresh
    }
    const timeUntilExpiry = expiresAt - Date.now();
    return timeUntilExpiry <= bufferMs;
}
/**
 * Check if a token is completely expired (past its exp time).
 *
 * @param expiresAt - Token expiry timestamp (Unix milliseconds)
 * @returns true if token is expired
 */
function tokenIsExpired(expiresAt) {
    if (!expiresAt) {
        return true;
    }
    return Date.now() >= expiresAt;
}
/**
 * Calculate milliseconds until token expires.
 *
 * @param expiresAt - Token expiry timestamp (Unix milliseconds)
 * @returns Milliseconds until expiry, or 0 if already expired
 */
function msUntilExpiry(expiresAt) {
    if (!expiresAt) {
        return 0;
    }
    return Math.max(0, expiresAt - Date.now());
}
/**
 * Convert Unix seconds (from JWT exp claim) to milliseconds.
 */
function expClaimToMs(exp) {
    // JWT exp is in seconds, we use milliseconds internally
    return exp * 1000;
}
// ============================================================================
// TOKEN VALIDATION
// ============================================================================
/**
 * Validate that an access token's actual JWT exp matches what we have cached.
 * This catches cases where the token was refreshed but cache wasn't updated.
 *
 * @param accessToken - The JWT access token
 * @param cachedExpiresAt - What we think the expiry is (Unix ms)
 * @returns Object with validation result and actual expiry
 */
function validateTokenExpiry(accessToken, cachedExpiresAt) {
    try {
        const parts = accessToken.split('.');
        if (parts.length !== 3) {
            return { valid: false, actualExpiresAt: null, mismatch: false };
        }
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        const actualExpiresAt = payload.exp ? payload.exp * 1000 : null;
        if (!actualExpiresAt) {
            return { valid: false, actualExpiresAt: null, mismatch: false };
        }
        const now = Date.now();
        const isExpired = actualExpiresAt < now;
        // Check for mismatch between cached and actual expiry
        const mismatch = cachedExpiresAt
            ? Math.abs(actualExpiresAt - cachedExpiresAt) > 1000 // Allow 1 second tolerance
            : false;
        if (mismatch) {
            console.warn('[TOKEN_UTILS] Token expiry mismatch detected:', {
                cached: cachedExpiresAt ? new Date(cachedExpiresAt).toISOString() : 'none',
                actual: new Date(actualExpiresAt).toISOString(),
                diff: cachedExpiresAt ? actualExpiresAt - cachedExpiresAt : 'N/A',
            });
        }
        return {
            valid: !isExpired,
            actualExpiresAt,
            mismatch,
        };
    }
    catch (error) {
        console.error('[TOKEN_UTILS] Failed to validate token expiry:', error);
        return { valid: false, actualExpiresAt: null, mismatch: false };
    }
}
