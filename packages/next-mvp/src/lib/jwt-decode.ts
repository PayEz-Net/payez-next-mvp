import { jwtDecode as originalJwtDecode } from 'jwt-decode';

// Define JwtPayload interface since jwt-decode v4 doesn't export it
export interface JwtPayload {
    iss?: string;
    sub?: string;
    aud?: string[] | string;
    exp?: number;
    nbf?: number;
    iat?: number;
    jti?: string;
}

/**
 * JWT Header structure.
 * Contains metadata about the token including the signing key ID.
 */
export interface JwtHeader {
    /** Algorithm used to sign the token (e.g., 'RS256', 'HS256') */
    alg: string;
    /** Token type (typically 'JWT') */
    typ?: string;
    /** Key ID - identifies which key was used to sign this token */
    kid?: string;
    /** Content type */
    cty?: string;
}

/**
 * Decode JWT payload (standard claims).
 * This is a thin wrapper around jwt-decode library.
 */
export function jwtDecode<T = JwtPayload>(token: string): T {
    return originalJwtDecode<T>(token);
}

/**
 * Decode JWT header to extract kid, alg, and other header claims.
 *
 * The JWT header contains critical information:
 * - kid: Key ID used to sign the token (needed for key governance)
 * - alg: Algorithm used for signing
 * - typ: Token type
 *
 * @param token - The JWT token string
 * @returns Decoded header or null if decoding fails
 */
export function decodeJwtHeader(token: string): JwtHeader | null {
    try {
        if (!token || typeof token !== 'string') {
            return null;
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            console.warn('[JWT_DECODE] Invalid JWT structure - expected 3 parts, got', parts.length);
            return null;
        }

        // Decode base64url header (part 0)
        const headerB64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
        const headerJson = typeof atob !== 'undefined'
            ? atob(headerB64)
            : Buffer.from(headerB64, 'base64').toString('utf-8');

        return JSON.parse(headerJson) as JwtHeader;
    } catch (error) {
        console.error('[JWT_DECODE] Failed to decode JWT header:', error);
        return null;
    }
}

/**
 * Extract just the kid (Key ID) from a JWT token.
 * Convenience function for when you only need the key ID.
 *
 * @param token - The JWT token string
 * @returns The kid value or undefined if not present/decodable
 */
export function extractKidFromToken(token: string): string | undefined {
    const header = decodeJwtHeader(token);
    return header?.kid;
}