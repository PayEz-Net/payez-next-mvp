import { NextRequest, NextResponse } from 'next/server';

function getIdpUrl(): string {
  const url = process.env.IDP_URL;
  if (!url) throw new Error('[IDP_URL] FATAL: IDP_URL environment variable is REQUIRED.');
  return url;
}

export async function POST(req: NextRequest) {
  const IDP_URL = getIdpUrl();
  try {
    const payload = await req.json();
    const upstream = await fetch(`${IDP_URL}/api/Account/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, error: 'reset_password_failed' }, { status: 500 });
  }
}
