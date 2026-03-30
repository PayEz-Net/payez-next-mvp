/**
 * Server-Side Session Decoder
 *
 * Uses Better Auth's server-side session API to get the current session.
 * Falls back to legacy JWT + Redis path if Better Auth session not found.
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
 * Decode the session from cookies.
 * Tries Better Auth first, falls back to legacy JWT + Redis.
 *
 * @param requestCookies Optional cookie getter for API route context (NextRequest.cookies).
 *                       If omitted, uses next/headers cookies() for server components.
 */
export declare function decodeSession(requestCookies?: {
    get: (name: string) => {
        value: string;
    } | undefined;
}): Promise<DecodedSession | null>;
