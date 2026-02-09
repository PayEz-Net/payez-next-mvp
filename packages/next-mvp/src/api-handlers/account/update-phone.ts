import { NextRequest, NextResponse } from 'next/server';
import { idpFetchJSON } from '../../lib/idp-fetch';
import { ENV_CONFIG } from '../../config/env';

/**
 * Update Phone Number API Handler
 *
 * PATCH /api/account/update-phone - Update user's phone number
 * Used for 2FA setup - users need to add a phone to enable SMS verification.
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    let body: { phoneNumber?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
        { status: 400 }
      );
    }

    const { phoneNumber } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Phone number is required' } },
        { status: 400 }
      );
    }

    // PATCH profile with phone_number only
    const url = `${ENV_CONFIG.IDP_URL}/api/Account/profile`;
    const result = await idpFetchJSON(req, url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber }),
    });

    if (!result.ok) {
      console.error('[UPDATE_PHONE] IDP error:', result.status, result.json);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: (result.json as any)?.error?.code || 'UPDATE_FAILED',
            message: (result.json as any)?.error?.message || 'Failed to update phone number',
          },
          meta: { attemptedRefresh: result.attemptedRefresh },
        },
        { status: result.status }
      );
    }

    const responseData = result.json as any;

    // Unwrap if IDP returns envelope { success, data }
    if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
      return NextResponse.json({
        success: true,
        message: 'Phone number updated successfully',
        data: responseData.data,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number updated successfully',
      data: responseData,
    });
  } catch (error) {
    console.error('[UPDATE_PHONE] Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update phone number' } },
      { status: 500 }
    );
  }
}
