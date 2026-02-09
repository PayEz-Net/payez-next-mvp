import { NextRequest, NextResponse } from 'next/server';
import { getSession, isRefreshInProgress } from '../../lib/session-store';
import { checkRefreshViability } from '../../lib/refresh-token-validator';
import { getTokenTestAware } from '../../lib/test-aware-get-token';
import { logger } from '../../config/logger';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.nextUrl.searchParams.get('token');
    let finalSessionToken = sessionToken;
    if (!finalSessionToken) {
      const token = await getTokenTestAware(req);
      // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
      finalSessionToken = (token?.sessionToken || token?.redisSessionId) as string;
    }
    if (!finalSessionToken) {
      return NextResponse.json({ canRefresh: false, reason: 'not_logged_in', sessionToken: null }, { status: 200 });
    }
    const refreshInProgress = await isRefreshInProgress(finalSessionToken);
    if (refreshInProgress) {
      // Still need to get session data for twoFactorComplete even when refresh is in progress
      const sessionData = await getSession(finalSessionToken);
      logger.info('[REFRESH-VIABILITY] Refresh already in progress, telling middleware to wait', { sessionToken: finalSessionToken.substring(0, 8) + '...' });
      return NextResponse.json({ canRefresh: true, reason: 'refresh_in_progress', refreshInProgress: true, sessionToken: finalSessionToken, twoFactorComplete: sessionData?.mfaVerified ?? (sessionData as any)?.twoFactorComplete ?? false }, { status: 200 });
    }
    const sessionData = await getSession(finalSessionToken);
    if (!sessionData) {
      return NextResponse.json({ canRefresh: false, reason: 'session_not_found', sessionToken: finalSessionToken }, { status: 200 });
    }
    const viabilityCheck = checkRefreshViability(sessionData);
    return NextResponse.json({ canRefresh: viabilityCheck.canRefresh, reason: viabilityCheck.reason, timeRemaining: viabilityCheck.timeRemaining, expiresAt: viabilityCheck.expiresAt, accessTokenExpired: viabilityCheck.accessTokenExpired, accessTokenTimeRemaining: viabilityCheck.accessTokenTimeRemaining, sessionToken: finalSessionToken, twoFactorComplete: sessionData.mfaVerified ?? (sessionData as any).twoFactorComplete ?? false, userId: sessionData.userId, refreshInProgress: false });
  } catch (error) {
    logger.error('[REFRESH-VIABILITY] Error checking refresh viability', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ canRefresh: false, reason: 'check_error', error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
