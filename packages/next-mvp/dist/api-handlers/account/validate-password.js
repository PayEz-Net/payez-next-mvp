"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
async function POST(req) {
    try {
        const body = await req.json();
        const { password } = body;
        const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
        // Validate input
        if (!password || typeof password !== 'string') {
            return server_1.NextResponse.json({
                is_valid: false,
                score: 0,
                failed_requirements: ['Password is required'],
            }, {
                status: 200, // Return 200 even for validation errors to keep UI responsive
                headers: { 'Cache-Control': 'no-store' },
            });
        }
        // Get IDP base URL and client ID from environment
        const idpBaseUrl = process.env.IDP_URL;
        const clientId = process.env.CLIENT_ID || process.env.NEXT_PUBLIC_CLIENT_ID;
        if (!idpBaseUrl) {
            console.error('[VALIDATE_PASSWORD] IDP_URL not configured');
            return server_1.NextResponse.json({
                is_valid: false,
                score: 0,
                failed_requirements: ['Password validation service unavailable'],
            }, {
                status: 200,
                headers: { 'Cache-Control': 'no-store' },
            });
        }
        // Proxy request to IDP
        const idpUrl = `${idpBaseUrl}/api/Account/validate-password`;
        const payload = {
            password,
            client_id: clientId,
        };
        const idpResponse = await fetch(idpUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-request-id': requestId,
            },
            body: JSON.stringify(payload),
        });
        const responseData = await idpResponse.json().catch(() => ({}));
        if (!idpResponse.ok) {
            console.error('[VALIDATE_PASSWORD] IDP error:', {
                status: idpResponse.status,
                response: responseData,
            });
            return server_1.NextResponse.json({
                is_valid: false,
                score: 0,
                failed_requirements: ['Password validation failed'],
            }, {
                status: 200,
                headers: { 'Cache-Control': 'no-store' },
            });
        }
        // Return the IDP response with proper structure
        return server_1.NextResponse.json(responseData, {
            status: 200,
            headers: { 'Cache-Control': 'no-store' },
        });
    }
    catch (error) {
        console.error('[VALIDATE_PASSWORD] Error:', error);
        return server_1.NextResponse.json({
            is_valid: false,
            score: 0,
            failed_requirements: ['Password validation failed'],
        }, {
            status: 200,
            headers: { 'Cache-Control': 'no-store' },
        });
    }
}
