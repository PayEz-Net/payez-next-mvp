/**
 * Server-Side Session Decoder
 *
 * Uses Better Auth's server-side session API to get the current session.
 * Falls back to legacy JWT + Redis path if Better Auth session not found.
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
 * Try Better Auth's server-side session API.
 * Returns a DecodedSession if Better Auth has an active session, null otherwise.
 */
async function tryBetterAuthSession(
  requestCookies?: { get: (name: string) => { value: string } | undefined }
): Promise<DecodedSession | null> {
  try {
    const { getBetterAuthHandler } = await import('../auth/better-auth');
    // getBetterAuthHandler initializes the instance; we need the raw instance
    const { default: getBetterAuthInstanceFn } = await import('../auth/better-auth')
      .then(m => ({ default: (m as any).getBetterAuthInstance || null }))
      .catch(() => ({ default: null }));

    // Access the cached instance via the module's internal getter
    let auth: any = null;
    try {
      // Force handler init which caches the instance, then use the API
      await getBetterAuthHandler();
      // The instance is cached in the module — re-import to access it
      const mod = await import('../auth/better-auth');
      auth = (mod as any).__betterAuthInstance;
    } catch {
      return null;
    }

    if (!auth?.api?.getSession) {
      return null;
    }

    // Build headers from cookies for Better Auth to read
    const cookieStore = requestCookies || (await cookies());
    const headerObj = new Headers();

    // Collect all cookies into a Cookie header
    if ('getAll' in cookieStore && typeof cookieStore.getAll === 'function') {
      const allCookies = (cookieStore as any).getAll();
      const cookieStr = allCookies.map((c: any) => `${c.name}=${c.value}`).join('; ');
      headerObj.set('cookie', cookieStr);
    } else {
      // Fallback: read known cookie names
      const sessionCookieName = getSessionCookieName();
      const secureCookieName = getSecureSessionCookieName();
      const parts: string[] = [];
      const sc = cookieStore.get(secureCookieName);
      if (sc?.value) parts.push(`${secureCookieName}=${sc.value}`);
      const nc = cookieStore.get(sessionCookieName);
      if (nc?.value) parts.push(`${sessionCookieName}=${nc.value}`);
      if (parts.length > 0) headerObj.set('cookie', parts.join('; '));
    }

    const result = await auth.api.getSession({ headers: headerObj });

    if (!result?.session || !result?.user) {
      return null;
    }

    // Map Better Auth session to SessionData
    const sessionData: SessionData = {
      userId: result.user.id || '',
      email: result.user.email || '',
      name: result.user.name || undefined,
      roles: [],
      idpAccessTokenExpires: result.session.expiresAt
        ? new Date(result.session.expiresAt).getTime()
        : Date.now() + 24 * 60 * 60 * 1000,
      mfaVerified: true, // Social login doesn't require MFA
      oauthProvider: 'google',
    };

    const jwtPayload: DecodedSession['jwtPayload'] = {
      sub: result.user.id,
      email: result.user.email,
      name: result.user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: sessionData.idpAccessTokenExpires / 1000,
      sessionToken: result.session.token,
    };

    return { sessionData, jwtPayload };
  } catch (error) {
    console.warn('[DECODE-SESSION] Better Auth session check failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Decode the session from cookies.
 * Tries Better Auth first, falls back to legacy JWT + Redis.
 *
 * @param requestCookies Optional cookie getter for API route context (NextRequest.cookies).
 *                       If omitted, uses next/headers cookies() for server components.
 */
export async function decodeSession(
  requestCookies?: { get: (name: string) => { value: string } | undefined }
): Promise<DecodedSession | null> {
  try {
    await ensureInitialized();

    // Try Better Auth session first
    const betterAuthSession = await tryBetterAuthSession(requestCookies);
    if (betterAuthSession) {
      return betterAuthSession;
    }

    // Fall back to legacy JWT + Redis path
    const cookieStore = requestCookies || (await cookies());
    const sessionCookieName = getSessionCookieName();
    const secureCookieName = getSecureSessionCookieName();

    const cookieValue =
      cookieStore.get(secureCookieName)?.value ||
      cookieStore.get(sessionCookieName)?.value;

    if (!cookieValue) {
      return null;
    }

    const config = await getIDPClientConfig();
    const secret = config.nextAuthSecret;
    if (!secret) {
      console.error('[DECODE-SESSION] No nextAuthSecret available from IDP config');
      return null;
    }

    const secretKey = new TextEncoder().encode(secret);
    let payload: JWTPayload;
    try {
      const result = await jwtVerify(cookieValue, secretKey);
      payload = result.payload;
    } catch (jwtError) {
      console.warn('[DECODE-SESSION] JWT verification failed:', jwtError instanceof Error ? jwtError.message : String(jwtError));
      return null;
    }

    const sessionToken = (payload as any).sessionToken || (payload as any).redisSessionId;
    if (!sessionToken) {
      console.warn('[DECODE-SESSION] JWT payload missing sessionToken/redisSessionId');
      return null;
    }

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
