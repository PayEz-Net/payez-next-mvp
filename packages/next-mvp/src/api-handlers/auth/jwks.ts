import { NextRequest, NextResponse } from 'next/server';
import { ENV_CONFIG, API_ENDPOINTS } from '../../config/env';
import { logger } from '../../config/logger';

export async function GET(_req: NextRequest) {
  try {
    const url = `${ENV_CONFIG.IDP_URL}${API_ENDPOINTS.externalAuth.jwks}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const bodyText = await res.text();
    try {
      const json = JSON.parse(bodyText);
      return NextResponse.json(json, { status: res.status });
    } catch (e) {
      logger.error('[AUTH_JWKS] Upstream returned non-JSON', { status: res.status, bodyText: bodyText?.slice(0, 200) });
      return NextResponse.json({ error: 'Invalid JWKS response' }, { status: 502 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch JWKS' }, { status: 502 });
  }
}
