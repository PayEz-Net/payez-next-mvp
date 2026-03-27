import { NextRequest } from 'next/server';
import { logger } from '../config/logger';
import { getSession } from '../server/auth';
import { getSessionCookieName } from './app-slug';

export async function getTokenTestAware(req: NextRequest): Promise<any> {
  if (process.env.TEST_MODE === 'true') {
    try {
      let secret = process.env.NEXTAUTH_SECRET;
      if (!secret || secret.trim() === '') {
        const { getIDPClientConfig } = await import('./idp-client-config');
        const idpConfig = await getIDPClientConfig();
        secret = idpConfig.nextAuthSecret as string;
      }
      // Use app-slug prefixed cookie name
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
  // Production path: use Better Auth session
  const session = await getSession(req);
  if (!session) return null;
  // Return a token-like object for backward compatibility with callers
  // that access token.sub, token.email, token.sessionToken, token.roles, etc.
  return {
    sub: session.user?.id,
    email: session.user?.email,
    name: session.user?.name,
    sessionToken: session.session?.token,
    roles: session.user?.roles || [],
    ...(session.user || {}),
  };
}
