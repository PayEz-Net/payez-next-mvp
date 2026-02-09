"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const idp_fetch_1 = require("../../lib/idp-fetch");
const env_1 = require("../../config/env");
/**
 * Update Phone Number API Handler
 *
 * PATCH /api/account/update-phone - Update user's phone number
 * Used for 2FA setup - users need to add a phone to enable SMS verification.
 */
async function POST(req) {
    try {
        // Parse request body
        let body;
        try {
            body = await req.json();
        }
        catch {
            return server_1.NextResponse.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } }, { status: 400 });
        }
        const { phoneNumber } = body;
        if (!phoneNumber) {
            return server_1.NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Phone number is required' } }, { status: 400 });
        }
        // PATCH profile with phone_number only
        const url = `${env_1.ENV_CONFIG.IDP_URL}/api/Account/profile`;
        const result = await (0, idp_fetch_1.idpFetchJSON)(req, url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_number: phoneNumber }),
        });
        if (!result.ok) {
            console.error('[UPDATE_PHONE] IDP error:', result.status, result.json);
            return server_1.NextResponse.json({
                success: false,
                error: {
                    code: result.json?.error?.code || 'UPDATE_FAILED',
                    message: result.json?.error?.message || 'Failed to update phone number',
                },
                meta: { attemptedRefresh: result.attemptedRefresh },
            }, { status: result.status });
        }
        const responseData = result.json;
        // Unwrap if IDP returns envelope { success, data }
        if (responseData && typeof responseData === 'object' && 'success' in responseData && 'data' in responseData) {
            return server_1.NextResponse.json({
                success: true,
                message: 'Phone number updated successfully',
                data: responseData.data,
            });
        }
        return server_1.NextResponse.json({
            success: true,
            message: 'Phone number updated successfully',
            data: responseData,
        });
    }
    catch (error) {
        console.error('[UPDATE_PHONE] Error:', error);
        return server_1.NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update phone number' } }, { status: 500 });
    }
}
