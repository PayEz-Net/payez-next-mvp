"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const idp_fetch_1 = require("../../lib/idp-fetch");
const env_1 = require("../../config/env");
// IDP masked-info is POST and uses capital 'A' in /api/Account
async function POST(req) {
    const url = `${env_1.ENV_CONFIG.IDP_URL}/api/Account/masked-info`;
    // Forward request body if present; IDP often accepts empty object
    let body = '{}';
    try {
        const raw = await req.text();
        if (raw && raw.trim().length > 0)
            body = raw;
    }
    catch { }
    const result = await (0, idp_fetch_1.idpFetchJSON)(req, url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
    });
    if (!result.ok) {
        return server_1.NextResponse.json({
            success: false,
            message: 'Upstream error',
            error: { code: 'UPSTREAM_SERVICE_ERROR', status: result.status, details: result.json },
            meta: { attemptedRefresh: result.attemptedRefresh },
        }, { status: result.status });
    }
    const bodyJson = result.json;
    // Unwrap if IDP returns envelope { success, data }
    if (bodyJson && typeof bodyJson === 'object' && 'success' in bodyJson && 'data' in bodyJson) {
        if (bodyJson.success === true) {
            return server_1.NextResponse.json(bodyJson.data, { status: 200 });
        }
        return server_1.NextResponse.json(bodyJson, { status: 200 });
    }
    // Passthrough otherwise
    return server_1.NextResponse.json(bodyJson ?? {}, { status: 200 });
}
