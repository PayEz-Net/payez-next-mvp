import { NextRequest } from 'next/server';
import { getToken as nextAuthGetToken } from 'next-auth/jwt';
import { logger } from '../config/logger';
import { resolveNextAuthSecret } from './nextauth-secret';
import { getSessionCookieName, getSecureSessionCookieName } from './app-slug';

export async function getTokenTestAware(req: NextRequest): Promise<any> {
  let secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.trim() === '') {
    try { secret = await resolveNextAuthSecret(); } catch (e) { logger.error('[GET_TOKEN] Failed to resolve NEXTAUTH_SECRET', { error: e instanceof Error ? e.message : String(e) }); return null; }
  }
  if (process.env.TEST_MODE === 'true') {
    try {
      // Use app-slug prefixed cookie name (must match auth-options.ts)
      const cookieName = getSessionCookieName();
      const cookies = req.headers.get('cookie'); if (!cookies) { logger.debug('[GET_TOKEN] No cookies in request'); return null; }
      const cookieValue = cookies.split(';').find(c => c.trim().startsWith(`${cookieName}=`))?.split('=')[1];
      if (!cookieValue) { logger.debug('[GET_TOKEN] Session token cookie not found'); return null; }
      const { jwtVerify } = await import('jose');
      const secretKey = new TextEncoder().encode(secret);
      const { payload } = await jwtVerify(cookieValue, secretKey);
      logger.debug('[GET_TOKEN] TEST_MODE token decoded:', { hasPayload: !!payload, redisSessionId: (payload as any).redisSessionId, sub: (payload as any).sub });
      return payload;
    } catch (error) { logger.error('[GET_TOKEN] TEST_MODE token decode error:', { error: error instanceof Error ? error.message : String(error) }); return null; }
  }
  // Use app-slug prefixed cookie name (must match auth-options.ts)
  // In production, NextAuth uses __Secure- prefix for cookies
  const cookieName = process.env.NODE_ENV === 'production' ? getSecureSessionCookieName() : getSessionCookieName();
  return await nextAuthGetToken({ req, secret, cookieName });
}
