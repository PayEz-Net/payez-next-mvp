/**
 * Session Callback
 *
 * Builds the NextAuth session from Redis session data.
 * The JWT only contains redisSessionId - all user data comes from Redis.
 *
 * FLOW:
 * 1. Extract redisSessionId from JWT token
 * 2. Fetch session data from Redis
 * 3. Build NextAuth session with user info
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */
import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
interface SessionCallbackParams {
    session: Session;
    token: JWT & {
        /** Redis session ID - the key to look up session data */
        redisSessionId?: string;
        error?: string;
    };
}
interface AppSessionUser {
    id: string;
    email: string;
    name?: string;
    roles: string[];
    twoFactorSessionVerified: boolean;
    requiresTwoFactor: boolean;
    authenticationMethods?: string[];
    authenticationLevel?: string;
    mfaCompletedAt?: number;
    mfaExpiresAt?: number;
    mfaValidityHours?: number;
    oauthProvider?: string;
    idpClientId?: string;
    merchantId?: string;
    bearerKeyId?: string;
}
interface AppSession extends Omit<Session, 'user'> {
    user: AppSessionUser;
    sessionToken?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
}
/**
 * Session callback - builds NextAuth session from Redis.
 *
 * This callback is called whenever getSession() or useSession() is used.
 * It fetches the full session from Redis and exposes it to the client.
 *
 * @param params - Session callback parameters from NextAuth
 * @returns AppSession with user data from Redis
 */
export declare function sessionCallback({ session, token, }: SessionCallbackParams): Promise<AppSession>;
export {};
