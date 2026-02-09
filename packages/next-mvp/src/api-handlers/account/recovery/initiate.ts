import { NextRequest, NextResponse } from 'next/server';

function getIdpUrl(): string {
  const url = process.env.IDP_URL;
  if (!url) throw new Error('[IDP_URL] FATAL: IDP_URL environment variable is REQUIRED.');
  return url;
}

export async function POST(req: NextRequest) {
  const IDP_URL = getIdpUrl();
  try {
    const { email } = await req.json();
    const upstream = await fetch(`${IDP_URL}/api/Account/recovery/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'initiate_failed' }, { status: 500 });
  }
}
