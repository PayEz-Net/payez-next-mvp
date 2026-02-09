/**
 * JWT Callback
 *
 * Minimal token strategy - only store redisSessionId in JWT.
 * All session data lives in Redis, not in the browser cookie.
 *
 * HANDLES:
 * - Initial sign-in (credentials): Store redisSessionId from authorize()
 * - Initial sign-in (OAuth): Register with IDP, create session, store redisSessionId
 * - Subsequent requests: Validate session exists, return token
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */
import type { JWT } from 'next-auth/jwt';
import type { User, Account } from 'next-auth';
interface JwtCallbackParams {
    token: JWT;
    user?: User | any;
    account?: Account | null;
    trigger?: 'signIn' | 'signUp' | 'update';
}
interface JwtCallbackResult extends JWT {
    /** Redis session ID - the key to look up session data */
    redisSessionId?: string;
    /** User ID from IDP */
    sub: string;
    /** Error code if session validation failed */
    error?: string;
    /** Flag for OAuth users who need immediate 2FA redirect */
    requiresTwoFactorRedirect?: boolean;
}
/**
 * JWT callback - builds the NextAuth JWT token.
 *
 * MINIMAL TOKEN STRATEGY:
 * - Only store redisSessionId (key to Redis session)
 * - All tokens and user data live in Redis
 * - Browser cookie stays small and secure
 *
 * @param params - JWT callback parameters from NextAuth
 * @returns JWT payload to store in browser cookie
 */
export declare function jwtCallback({ token, user, account, trigger, }: JwtCallbackParams): Promise<JwtCallbackResult>;
export {};
