/**
 * Token Utilities
 *
 * JWT decoding and expiry checking utilities.
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */

import { jwtDecode, decodeJwtHeader, extractKidFromToken, JwtHeader } from '../../lib/jwt-decode';
import type { DecodedIdpAccessToken } from '../types/auth-types';

// Re-export header utilities for consumers
export { decodeJwtHeader, extractKidFromToken, type JwtHeader } from '../../lib/jwt-decode';

// ============================================================================
// TOKEN DECODING
// ============================================================================

/**
 * Decode an IDP access token and extract claims.
 *
 * @param token - The JWT access token from IDP
 * @returns Decoded token claims, or null if decode fails
 */
export function decodeIdpAccessToken(token: string): DecodedIdpAccessToken | null {
  try {
    return jwtDecode<DecodedIdpAccessToken>(token);
  } catch (error) {
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
export function decodeIdpAccessTokenFull(token: string): {
  header: JwtHeader;
  payload: DecodedIdpAccessToken;
  bearerKeyId: string | undefined;
} | null {
  try {
    const header = decodeJwtHeader(token);
    const payload = jwtDecode<DecodedIdpAccessToken>(token);

    if (!header || !payload) {
      return null;
    }

    return {
      header,
      payload,
      bearerKeyId: header.kid,
    };
  } catch (error) {
    console.error('[TOKEN_UTILS] Failed to decode access token (full):', error);
    return null;
  }
}

/**
 * Extract user email from decoded token.
 * Handles multiple possible claim names used by IDP.
 */
export function extractEmailFromToken(decoded: DecodedIdpAccessToken): string {
  return (
    decoded.email ||
    decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
    ''
  );
}

/**
 * Extract roles from decoded token.
 * Handles both 'role' and 'roles' claims, and both string and array formats.
 */
export function extractRolesFromToken(decoded: DecodedIdpAccessToken): string[] {
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
    } catch {
      return [rolesClaim];
    }
  }

  return [];
}

/**
 * Extract AMR (Authentication Methods References) from decoded token.
 */
export function extractAmrFromToken(decoded: DecodedIdpAccessToken): string[] {
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
    } catch {
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
export function tokenNeedsRefresh(
  expiresAt: number | undefined,
  bufferMs: number = 5 * 60 * 1000
): boolean {
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
export function tokenIsExpired(expiresAt: number | undefined): boolean {
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
export function msUntilExpiry(expiresAt: number | undefined): number {
  if (!expiresAt) {
    return 0;
  }
  return Math.max(0, expiresAt - Date.now());
}

/**
 * Convert Unix seconds (from JWT exp claim) to milliseconds.
 */
export function expClaimToMs(exp: number): number {
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
export function validateTokenExpiry(
  accessToken: string,
  cachedExpiresAt: number | undefined
): { valid: boolean; actualExpiresAt: number | null; mismatch: boolean } {
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
  } catch (error) {
    console.error('[TOKEN_UTILS] Failed to validate token expiry:', error);
    return { valid: false, actualExpiresAt: null, mismatch: false };
  }
}
