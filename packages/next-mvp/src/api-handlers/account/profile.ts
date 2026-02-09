import { NextRequest, NextResponse } from 'next/server';

/**
 * Account Profile API Handler
 * Simple proxy to IDP profile endpoint
 *
 * GET /api/account/profile - Get user profile
 * PUT /api/account/profile - Update user profile
 */

function getIdpUrl(): string {
  const url = process.env.IDP_URL;
  if (!url) {
    throw new Error('[IDP_URL] FATAL: IDP_URL environment variable is REQUIRED.');
  }
  return url;
}

export async function GET(req: NextRequest) {
  const IDP_URL = getIdpUrl();
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const upstream = await fetch(`${IDP_URL}/api/Account/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'UPSTREAM_ERROR', message: 'Failed to fetch profile' } },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const IDP_URL = getIdpUrl();
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const body = await req.text();

    const upstream = await fetch(`${IDP_URL}/api/Account/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body,
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'UPSTREAM_ERROR', message: 'Failed to update profile' } },
      { status: 500 }
    );
  }
}
