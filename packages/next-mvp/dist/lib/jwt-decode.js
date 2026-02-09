"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtDecode = jwtDecode;
exports.decodeJwtHeader = decodeJwtHeader;
exports.extractKidFromToken = extractKidFromToken;
const jwt_decode_1 = require("jwt-decode");
/**
 * Decode JWT payload (standard claims).
 * This is a thin wrapper around jwt-decode library.
 */
function jwtDecode(token) {
    return (0, jwt_decode_1.jwtDecode)(token);
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
function decodeJwtHeader(token) {
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
        return JSON.parse(headerJson);
    }
    catch (error) {
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
function extractKidFromToken(token) {
    const header = decodeJwtHeader(token);
    return header?.kid;
}
