/**
 * Token Utilities
 *
 * JWT decoding and expiry checking utilities.
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */
import { JwtHeader } from '../../lib/jwt-decode';
import type { DecodedIdpAccessToken } from '../types/auth-types';
export { decodeJwtHeader, extractKidFromToken, type JwtHeader } from '../../lib/jwt-decode';
/**
 * Decode an IDP access token and extract claims.
 *
 * @param token - The JWT access token from IDP
 * @returns Decoded token claims, or null if decode fails
 */
export declare function decodeIdpAccessToken(token: string): DecodedIdpAccessToken | null;
/**
 * Decode both JWT header and payload from an IDP access token.
 * Returns the signing key ID (kid) along with payload claims.
 *
 * @param token - The JWT access token from IDP
 * @returns Object with header (including kid) and payload, or null if decode fails
 */
export declare function decodeIdpAccessTokenFull(token: string): {
    header: JwtHeader;
    payload: DecodedIdpAccessToken;
    bearerKeyId: string | undefined;
} | null;
/**
 * Extract user email from decoded token.
 * Handles multiple possible claim names used by IDP.
 */
export declare function extractEmailFromToken(decoded: DecodedIdpAccessToken): string;
/**
 * Extract roles from decoded token.
 * Handles both 'role' and 'roles' claims, and both string and array formats.
 */
export declare function extractRolesFromToken(decoded: DecodedIdpAccessToken): string[];
/**
 * Extract AMR (Authentication Methods References) from decoded token.
 */
export declare function extractAmrFromToken(decoded: DecodedIdpAccessToken): string[];
/**
 * Check if a token expiry timestamp indicates the token needs refresh.
 *
 * @param expiresAt - Token expiry timestamp (Unix milliseconds)
 * @param bufferMs - How early to trigger refresh (default 5 minutes)
 * @returns true if token is expired or will expire within buffer period
 */
export declare function tokenNeedsRefresh(expiresAt: number | undefined, bufferMs?: number): boolean;
/**
 * Check if a token is completely expired (past its exp time).
 *
 * @param expiresAt - Token expiry timestamp (Unix milliseconds)
 * @returns true if token is expired
 */
export declare function tokenIsExpired(expiresAt: number | undefined): boolean;
/**
 * Calculate milliseconds until token expires.
 *
 * @param expiresAt - Token expiry timestamp (Unix milliseconds)
 * @returns Milliseconds until expiry, or 0 if already expired
 */
export declare function msUntilExpiry(expiresAt: number | undefined): number;
/**
 * Convert Unix seconds (from JWT exp claim) to milliseconds.
 */
export declare function expClaimToMs(exp: number): number;
/**
 * Validate that an access token's actual JWT exp matches what we have cached.
 * This catches cases where the token was refreshed but cache wasn't updated.
 *
 * @param accessToken - The JWT access token
 * @param cachedExpiresAt - What we think the expiry is (Unix ms)
 * @returns Object with validation result and actual expiry
 */
export declare function validateTokenExpiry(accessToken: string, cachedExpiresAt: number | undefined): {
    valid: boolean;
    actualExpiresAt: number | null;
    mismatch: boolean;
};
