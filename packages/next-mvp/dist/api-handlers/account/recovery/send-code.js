"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
function getIdpUrl() {
    const url = process.env.IDP_URL;
    if (!url)
        throw new Error('[IDP_URL] FATAL: IDP_URL environment variable is REQUIRED.');
    return url;
}
async function POST(req) {
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
        return server_1.NextResponse.json(data, { status: upstream.status });
    }
    catch {
        return server_1.NextResponse.json({ success: false, error: 'send_code_failed' }, { status: 500 });
    }
}
