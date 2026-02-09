import { NextRequest, NextResponse } from 'next/server';

function getIdpUrl(): string {
  const url = process.env.IDP_URL;
  if (!url) throw new Error('[IDP_URL] FATAL: IDP_URL environment variable is REQUIRED.');
  return url;
}

export async function POST(req: NextRequest) {
  const IDP_URL = getIdpUrl();
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const { method } = await req.json();
    const upstream = await fetch(`${IDP_URL}/api/Account/recovery/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ method }),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ success: false, error: 'send_code_failed' }, { status: 500 });
  }
}
