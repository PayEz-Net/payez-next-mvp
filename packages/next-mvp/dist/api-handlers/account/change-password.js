"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const jwt_1 = require("next-auth/jwt");
const session_store_1 = require("../../lib/session-store");
const app_slug_1 = require("../../lib/app-slug");
const nanoid_1 = require("nanoid");
// ...
async function POST(req) {
    const requestId = (0, nanoid_1.nanoid)();
    try {
        // Get session token from NextAuth JWT
        // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
        const token = await (0, jwt_1.getToken)({ req, secret: process.env.NEXTAUTH_SECRET, cookieName: (0, app_slug_1.getJwtCookieName)() });
        const sessionToken = (token?.sessionToken || token?.redisSessionId);
        if (!token || typeof sessionToken !== 'string') {
            return server_1.NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        const sessionData = await (0, session_store_1.getSession)(sessionToken);
        // NOTE: Field is idpAccessToken (not accessToken) per normalized naming convention
        if (!sessionData?.idpAccessToken) {
            return server_1.NextResponse.json({
                success: false,
                message: 'Authentication required - no access token available',
                error_code: 'UNAUTHORIZED',
                request_id: requestId,
            }, { status: 401 });
        }
        const body = await req.json();
        const { current_password, new_password, confirm_password } = body;
        // Validate input
        if (!current_password || !new_password || !confirm_password) {
            return server_1.NextResponse.json({
                success: false,
                message: 'Current password, new password, and confirmation are required',
                error_code: 'VALIDATION_ERROR',
                request_id: requestId,
            }, { status: 400 });
        }
        if (new_password !== confirm_password) {
            return server_1.NextResponse.json({
                success: false,
                message: 'New password and confirmation do not match',
                error_code: 'VALIDATION_ERROR',
                request_id: requestId,
            }, { status: 400 });
        }
        // Get IDP base URL from environment
        const idpBaseUrl = process.env.IDP_URL;
        if (!idpBaseUrl) {
            console.error('[CHANGE_PASSWORD] IDP_URL not configured');
            return server_1.NextResponse.json({
                success: false,
                message: 'Service configuration error',
                error_code: 'CONFIGURATION_ERROR',
                request_id: requestId,
            }, { status: 500 });
        }
        // Proxy request to IDP
        const idpUrl = `${idpBaseUrl}/api/Account/change-password`;
        const idpResponse = await fetch(idpUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionData.idpAccessToken}`,
                'x-request-id': requestId,
            },
            body: JSON.stringify({
                current_password,
                new_password,
                confirm_password,
            }),
        });
        const responseData = await idpResponse.json().catch(() => ({}));
        if (!idpResponse.ok) {
            // Extract error message from IDP response
            let errorMessage = 'Failed to change password';
            if (responseData.message) {
                errorMessage = responseData.message;
            }
            else if (responseData.details?.value && Array.isArray(responseData.details.value) && responseData.details.value.length > 0) {
                errorMessage = responseData.details.value[0].message || errorMessage;
            }
            else if (responseData.details?.message) {
                errorMessage = responseData.details.message;
            }
            return server_1.NextResponse.json({
                success: false,
                message: errorMessage,
                error_code: responseData.error_code || 'CHANGE_PASSWORD_FAILED',
                request_id: requestId,
                details: responseData.details,
            }, { status: idpResponse.status });
        }
        return server_1.NextResponse.json({
            success: true,
            message: responseData.message || 'Password changed successfully',
            request_id: requestId,
        });
    }
    catch (error) {
        console.error('[CHANGE_PASSWORD] Error:', error);
        const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
        return server_1.NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to change password',
            error_code: 'INTERNAL_ERROR',
            request_id: requestId,
        }, { status: 500 });
    }
}
