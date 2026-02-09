import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { resolveNextAuthSecret } from '../../lib/nextauth-secret';
import { getSession as getRedisSession } from '../../lib/session-store';
import { getJwtCookieName } from '../../lib/app-slug';

export async function GET(req: NextRequest) {
  try {
    let token: any = await getToken({ req, secret: await resolveNextAuthSecret(), cookieName: getJwtCookieName() });
    // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
    const sessionToken = (token as any)?.sessionToken || (token as any)?.redisSessionId;
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'No session token' }, { status: 401 });
    }
    const sessionModel = await getRedisSession(sessionToken);
    if (!sessionModel) {
      return NextResponse.json({ success: false, error: 'Session missing in Redis' }, { status: 401 });
    }
    return NextResponse.json({ success: true, userId: (sessionModel as any).userId || null });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
