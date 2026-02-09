import { NextRequest, NextResponse } from 'next/server';
import { idpFetchJSON } from '../../lib/idp-fetch';
import { ENV_CONFIG, API_ENDPOINTS } from '../../config/env';
import { getTokenTestAware } from '../../lib/test-aware-get-token';
import { getSession } from '../../lib/session-store';

/**
 * Validates current access token with the IDP and returns normalized info.
 * Sources access token from Authorization header or Redis session via cookie.
 */
export async function GET(req: NextRequest) {
  try {
    // 1) Prefer Authorization header if present
    let bearer: string | undefined = undefined;
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader && /^Bearer\s+/i.test(authHeader)) bearer = authHeader.replace(/^Bearer\s+/i, '').trim();

    // 2) If not, resolve from session
    if (!bearer) {
      const tok = await getTokenTestAware(req);
      const sessionToken = tok?.sessionToken as string | undefined;
      if (sessionToken) {
        const sess = await getSession(sessionToken);
        bearer = sess?.accessToken;
      }
    }

    if (!bearer) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No access token available' } }, { status: 401 });
    }

    const url = `${ENV_CONFIG.IDP_URL}${API_ENDPOINTS.externalAuth.validate}`;
    const result = await idpFetchJSON(req, url, { method: 'GET', headers: { Authorization: `Bearer ${bearer}` } });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: { code: 'UPSTREAM_SERVICE_ERROR', status: result.status }, data: result.json }, { status: result.status });
    }

    // Passthrough normalized
    return NextResponse.json(result.json ?? { success: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: e?.message || 'validate error' } }, { status: 500 });
  }
}