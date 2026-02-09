import { NextRequest, NextResponse } from 'next/server';
import { idpFetchJSON } from '../../lib/idp-fetch';
import { ENV_CONFIG } from '../../config/env';

// IDP masked-info is POST and uses capital 'A' in /api/Account
export async function POST(req: NextRequest) {
  const url = `${ENV_CONFIG.IDP_URL}/api/Account/masked-info`;

  // Forward request body if present; IDP often accepts empty object
  let body = '{}';
  try {
    const raw = await req.text();
    if (raw && raw.trim().length > 0) body = raw;
  } catch {}

  const result = await idpFetchJSON(req, url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        message: 'Upstream error',
        error: { code: 'UPSTREAM_SERVICE_ERROR', status: result.status, details: result.json },
        meta: { attemptedRefresh: result.attemptedRefresh },
      },
      { status: result.status }
    );
  }

  const bodyJson: any = result.json;
  // Unwrap if IDP returns envelope { success, data }
  if (bodyJson && typeof bodyJson === 'object' && 'success' in bodyJson && 'data' in bodyJson) {
    if ((bodyJson as any).success === true) {
      return NextResponse.json((bodyJson as any).data, { status: 200 });
    }
    return NextResponse.json(bodyJson, { status: 200 });
  }

  // Passthrough otherwise
  return NextResponse.json(bodyJson ?? {}, { status: 200 });
}
