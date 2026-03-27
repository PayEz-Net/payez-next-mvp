/**
 * Server-Side Session Decoder
 *
 * Reads the JWT session cookie, decodes it with jose, and fetches the
 * full session from Redis. Used by authGuard (layouts) and withAuth (API routes).
 *
 * Zero HTTP self-fetches. Direct Redis reads only.
 */
import 'server-only';
import { type JWTPayload } from 'jose';
import { type SessionData } from '../lib/session-store';
export interface DecodedSession {
    sessionData: SessionData;
    jwtPayload: JWTPayload & {
        sessionToken?: string;
        redisSessionId?: string;
    };
}
/**
 * Decode the session from cookies and Redis.
 * Returns null if no valid session exists.
 *
 * @param requestCookies Optional cookie getter for API route context (NextRequest.cookies).
 *                       If omitted, uses next/headers cookies() for server components.
 */
export declare function decodeSession(requestCookies?: {
    get: (name: string) => {
        value: string;
    } | undefined;
}): Promise<DecodedSession | null>;
