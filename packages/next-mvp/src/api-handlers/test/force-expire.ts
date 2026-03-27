import { NextRequest, NextResponse } from 'next/server';
import { getSession as getBetterAuthSession } from '../../server/auth';
import { getSession, updateSession } from '../../lib/session-store';

/**
 * Force-expire access token for testing refresh flow.
 *
 * Sets the access token expiry to 2 minutes in the past,
 * which will trigger a refresh on the next API call.
 *
 * Usage in consuming app:
 * ```typescript
 * // app/api/test/force-expire/route.ts
 * export { POST } from '@payez/next-mvp/api-handlers/test/force-expire';
 * ```
 */
export const POST = async (req: NextRequest) => {
  try {
    const betterAuthSession = await getBetterAuthSession(req);

    let sessionToken = betterAuthSession?.session?.token as string | undefined;
    if (!sessionToken) {
      const headerSessionToken = req.headers.get('x-session-token') || req.headers.get('X-Session-Token');
      if (headerSessionToken) {
        sessionToken = headerSessionToken;
      } else {
        console.warn('[TEST_EXPIRE] No session token or X-Session-Token header');
        return NextResponse.json({ success: false, error: 'No session token' }, { status: 401 });
      }
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const now = Date.now();
    const forced = now - (2 * 60 * 1000); // two minutes ago
    const prev = session.idpAccessTokenExpires || null;

    await updateSession(sessionToken, { idpAccessTokenExpires: forced });

    console.log('[TEST_EXPIRE] Forced access token expiry for session', {
      sessionToken: sessionToken.substring(0, 8) + '...',
      previous: prev ? new Date(prev).toISOString() : null,
      newExpiry: new Date(forced).toISOString()
    });

    return NextResponse.json({
      success: true,
      previous: prev,
      previousIso: prev ? new Date(prev).toISOString() : null,
      newExpiry: forced,
      newExpiryIso: new Date(forced).toISOString()
    });
  } catch (e) {
    console.error('[TEST_EXPIRE] Error:', e);
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
};
