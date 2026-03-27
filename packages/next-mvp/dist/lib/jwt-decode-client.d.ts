/**
 * Client-safe JWT decode (no Node.js dependencies)
 * This is a lightweight version for browser usage
 */
/**
 * Simple JWT decode for client-side use (no signature verification)
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export declare function jwtDecode<T = any>(token: string): T | null;
