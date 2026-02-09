/**
 * Send 2FA Verification Code Handler
 *
 * Sends a verification code via email or SMS to the authenticated user.
 * Requires a provisional Bearer token (ACR=1) from initial login.
 *
 * @package @payez/next-mvp
 */

import { NextRequest, NextResponse } from 'next/server';
import { idpFetchJSON } from '../../lib/idp-fetch';
import { ENV_CONFIG } from '../../config/env';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const method = String(body.method || '').toLowerCase();

    if (method !== 'sms' && method !== 'email') {
      return NextResponse.json(
        {
          success: false,
          error: 'Method must be either "sms" or "email"',
          code: 'INVALID_METHOD',
        },
        { status: 400 }
      );
    }

    // Build IDP endpoint URL
    const idpEndpoint = method === 'sms'
      ? '/api/ExternalAuth/twofa/sms/send'
      : '/api/ExternalAuth/twofa/email/send';

    // Send client_id in body (lower_snake_case per PayEz standards)
    const idpBody = JSON.stringify({ client_id: ENV_CONFIG.CLIENT_ID });

    // Call IDP using idpFetchJSON which auto-injects Bearer token from Redis session
    const result = await idpFetchJSON(req, `${ENV_CONFIG.IDP_URL}${idpEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: idpBody,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.json?.message || `Failed to send ${method} code`,
          code: result.json?.code || 'IDP_ERROR',
          meta: { attemptedRefresh: result.attemptedRefresh },
        },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Verification code sent via ${method}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SEND_CODE] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send verification code',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
