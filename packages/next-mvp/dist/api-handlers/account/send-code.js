"use strict";
/**
 * Send 2FA Verification Code Handler
 *
 * Sends a verification code via email or SMS to the authenticated user.
 * Requires a provisional Bearer token (ACR=1) from initial login.
 *
 * @package @payez/next-mvp
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const idp_fetch_1 = require("../../lib/idp-fetch");
const env_1 = require("../../config/env");
async function POST(req) {
    try {
        // Parse request body
        const body = await req.json();
        const method = String(body.method || '').toLowerCase();
        if (method !== 'sms' && method !== 'email') {
            return server_1.NextResponse.json({
                success: false,
                error: 'Method must be either "sms" or "email"',
                code: 'INVALID_METHOD',
            }, { status: 400 });
        }
        // Build IDP endpoint URL
        const idpEndpoint = method === 'sms'
            ? '/api/ExternalAuth/twofa/sms/send'
            : '/api/ExternalAuth/twofa/email/send';
        // Send client_id in body (lower_snake_case per PayEz standards)
        const idpBody = JSON.stringify({ client_id: env_1.ENV_CONFIG.CLIENT_ID });
        // Call IDP using idpFetchJSON which auto-injects Bearer token from Redis session
        const result = await (0, idp_fetch_1.idpFetchJSON)(req, `${env_1.ENV_CONFIG.IDP_URL}${idpEndpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: idpBody,
        });
        if (!result.ok) {
            return server_1.NextResponse.json({
                success: false,
                error: result.json?.message || `Failed to send ${method} code`,
                code: result.json?.code || 'IDP_ERROR',
                meta: { attemptedRefresh: result.attemptedRefresh },
            }, { status: result.status });
        }
        return server_1.NextResponse.json({
            success: true,
            message: `Verification code sent via ${method}`,
        }, { status: 200 });
    }
    catch (error) {
        console.error('[SEND_CODE] Error:', error);
        return server_1.NextResponse.json({
            success: false,
            error: 'Failed to send verification code',
            code: 'INTERNAL_ERROR',
        }, { status: 500 });
    }
}
