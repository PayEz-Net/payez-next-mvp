"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const idp_fetch_1 = require("../../lib/idp-fetch");
const env_1 = require("../../config/env");
const test_aware_get_token_1 = require("../../lib/test-aware-get-token");
const session_store_1 = require("../../lib/session-store");
/**
 * Validates current access token with the IDP and returns normalized info.
 * Sources access token from Authorization header or Redis session via cookie.
 */
async function GET(req) {
    try {
        // 1) Prefer Authorization header if present
        let bearer = undefined;
        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
        if (authHeader && /^Bearer\s+/i.test(authHeader))
            bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
        // 2) If not, resolve from session
        if (!bearer) {
            const tok = await (0, test_aware_get_token_1.getTokenTestAware)(req);
            const sessionToken = tok?.sessionToken;
            if (sessionToken) {
                const sess = await (0, session_store_1.getSession)(sessionToken);
                bearer = sess?.accessToken;
            }
        }
        if (!bearer) {
            return server_1.NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No access token available' } }, { status: 401 });
        }
        const url = `${env_1.ENV_CONFIG.IDP_URL}${env_1.API_ENDPOINTS.externalAuth.validate}`;
        const result = await (0, idp_fetch_1.idpFetchJSON)(req, url, { method: 'GET', headers: { Authorization: `Bearer ${bearer}` } });
        if (!result.ok) {
            return server_1.NextResponse.json({ success: false, error: { code: 'UPSTREAM_SERVICE_ERROR', status: result.status }, data: result.json }, { status: result.status });
        }
        // Passthrough normalized
        return server_1.NextResponse.json(result.json ?? { success: true }, { status: 200 });
    }
    catch (e) {
        return server_1.NextResponse.json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: e?.message || 'validate error' } }, { status: 500 });
    }
}
