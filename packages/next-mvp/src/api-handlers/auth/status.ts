import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../server/auth';
import { getSession as getRedisSession } from '../../lib/session-store';

export async function GET(req: NextRequest) {
  try {
    const betterAuthSession = await getSession(req);
    const sessionToken = betterAuthSession?.session?.token;
    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'No session token' }, { status: 401 });
    }
    const sessionModel = await getRedisSession(sessionToken);
    if (!sessionModel) {
      return NextResponse.json({ success: false, error: 'Session missing in Redis' }, { status: 401 });
    }
    return NextResponse.json({ success: true, userId: betterAuthSession?.user?.id || (sessionModel as any).userId || null });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
