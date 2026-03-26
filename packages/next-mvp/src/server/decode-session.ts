/**
 * Server-Side Session Decoder
 *
 * Reads the JWT session cookie, decodes it with jose, and fetches the
 * full session from Redis. Used by authGuard (layouts) and withAuth (API routes).
 *
 * Zero HTTP self-fetches. Direct Redis reads only.
 */

import 'server-only';
import { cookies } from 'next/headers';
import { jwtVerify, type JWTPayload } from 'jose';
import { getSession, type SessionData } from '../lib/session-store';
import { getIDPClientConfig } from '../lib/idp-client-config';
import { getSessionCookieName, getSecureSessionCookieName } from '../lib/app-slug';
import { ensureInitialized } from '../lib/startup-init';

export interface DecodedSession {
  sessionData: SessionData;
  jwtPayload: JWTPayload & { sessionToken?: string; redisSessionId?: string };
}

/**
 * Decode the session from cookies and Redis.
 * Returns null if no valid session exists.
 *
 * @param requestCookies Optional cookie getter for API route context (NextRequest.cookies).
 *                       If omitted, uses next/headers cookies() for server components.
 */
export async function decodeSession(
  requestCookies?: { get: (name: string) => { value: string } | undefined }
): Promise<DecodedSession | null> {
  try {
    // Ensure startup initialization is complete (Redis, IDP config, etc.)
    await ensureInitialized();

    // Get the JWT cookie value
    const cookieStore = requestCookies || (await cookies());
    const sessionCookieName = getSessionCookieName();
    const secureCookieName = getSecureSessionCookieName();

    const cookieValue =
      cookieStore.get(secureCookieName)?.value ||
      cookieStore.get(sessionCookieName)?.value;

    if (!cookieValue) {
      return null;
    }

    // Get the NextAuth secret from IDP config
    const config = await getIDPClientConfig();
    const secret = config.nextAuthSecret;
    if (!secret) {
      console.error('[DECODE-SESSION] No nextAuthSecret available from IDP config');
      return null;
    }

    // Decode the JWT (same pattern as test-aware-get-token.ts)
    const secretKey = new TextEncoder().encode(secret);
    let payload: JWTPayload;
    try {
      const result = await jwtVerify(cookieValue, secretKey);
      payload = result.payload;
    } catch (jwtError) {
      // JWT decode failed - cookie may be corrupted or secret rotated
      console.warn('[DECODE-SESSION] JWT verification failed:', jwtError instanceof Error ? jwtError.message : String(jwtError));
      return null;
    }

    // Extract the Redis session ID from JWT payload
    const sessionToken = (payload as any).sessionToken || (payload as any).redisSessionId;
    if (!sessionToken) {
      console.warn('[DECODE-SESSION] JWT payload missing sessionToken/redisSessionId');
      return null;
    }

    // Fetch session from Redis (direct, no HTTP)
    const sessionData = await getSession(sessionToken);
    if (!sessionData) {
      return null;
    }

    return {
      sessionData,
      jwtPayload: payload as DecodedSession['jwtPayload'],
    };
  } catch (error) {
    console.error('[DECODE-SESSION] Error:', error instanceof Error ? error.message : String(error));
    return null;
  }
}
