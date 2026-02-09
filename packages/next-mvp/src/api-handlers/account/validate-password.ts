import { NextRequest, NextResponse } from 'next/server';

interface ValidatePasswordRequest {
  password: string;
}

interface ValidatePasswordResponse {
  is_valid: boolean;
  score: number;
  failed_requirements: string[];
  tip?: string;
  policy?: {
    min_length?: number;
    require_uppercase?: boolean;
    require_lowercase?: boolean;
    require_digit?: boolean;
    require_special?: boolean;
    min_strength_score?: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body as ValidatePasswordRequest;
    const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();

    // Validate input
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        {
          is_valid: false,
          score: 0,
          failed_requirements: ['Password is required'],
        } as ValidatePasswordResponse,
        {
          status: 200, // Return 200 even for validation errors to keep UI responsive
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    // Get IDP base URL and client ID from environment
    const idpBaseUrl = process.env.IDP_URL;

    const clientId = process.env.CLIENT_ID || process.env.NEXT_PUBLIC_CLIENT_ID;

    if (!idpBaseUrl) {
      console.error('[VALIDATE_PASSWORD] IDP_URL not configured');
      return NextResponse.json(
        {
          is_valid: false,
          score: 0,
          failed_requirements: ['Password validation service unavailable'],
        } as ValidatePasswordResponse,
        {
          status: 200,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    // Proxy request to IDP
    const idpUrl = `${idpBaseUrl}/api/Account/validate-password`;
    const payload = {
      password,
      client_id: clientId,
    };

    const idpResponse = await fetch(idpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await idpResponse.json().catch(() => ({}));

    if (!idpResponse.ok) {
      console.error('[VALIDATE_PASSWORD] IDP error:', {
        status: idpResponse.status,
        response: responseData,
      });
      return NextResponse.json(
        {
          is_valid: false,
          score: 0,
          failed_requirements: ['Password validation failed'],
        } as ValidatePasswordResponse,
        {
          status: 200,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    // Return the IDP response with proper structure
    return NextResponse.json(responseData as ValidatePasswordResponse, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[VALIDATE_PASSWORD] Error:', error);
    return NextResponse.json(
      {
        is_valid: false,
        score: 0,
        failed_requirements: ['Password validation failed'],
      } as ValidatePasswordResponse,
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
