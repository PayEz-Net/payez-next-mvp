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
        const payload = await req.json();
        const upstream = await fetch(`${IDP_URL}/api/Account/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await upstream.json().catch(() => ({}));
        return server_1.NextResponse.json(data, { status: upstream.status });
    }
    catch {
        return server_1.NextResponse.json({ success: false, error: 'reset_password_failed' }, { status: 500 });
    }
}
