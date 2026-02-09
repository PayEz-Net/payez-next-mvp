"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const env_1 = require("../../config/env");
const logger_1 = require("../../config/logger");
async function GET(_req) {
    try {
        const url = `${env_1.ENV_CONFIG.IDP_URL}${env_1.API_ENDPOINTS.externalAuth.jwks}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const bodyText = await res.text();
        try {
            const json = JSON.parse(bodyText);
            return server_1.NextResponse.json(json, { status: res.status });
        }
        catch (e) {
            logger_1.logger.error('[AUTH_JWKS] Upstream returned non-JSON', { status: res.status, bodyText: bodyText?.slice(0, 200) });
            return server_1.NextResponse.json({ error: 'Invalid JWKS response' }, { status: 502 });
        }
    }
    catch (error) {
        return server_1.NextResponse.json({ error: 'Failed to fetch JWKS' }, { status: 502 });
    }
}
