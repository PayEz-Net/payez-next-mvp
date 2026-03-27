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
export declare function jwtDecode<T = JwtPayload>(token: string): T;
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
export declare function decodeJwtHeader(token: string): JwtHeader | null;
/**
 * Extract just the kid (Key ID) from a JWT token.
 * Convenience function for when you only need the key ID.
 *
 * @param token - The JWT token string
 * @returns The kid value or undefined if not present/decodable
 */
export declare function extractKidFromToken(token: string): string | undefined;
