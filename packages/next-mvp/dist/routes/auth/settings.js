"use strict";
/**
 * Public Auth Settings Route
 *
 * Returns client auth settings for pre-login pages (signup, login).
 * Does NOT require authentication - these are public client settings.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const idp_client_config_1 = require("../../lib/idp-client-config");
/**
 * GET /api/auth/settings
 *
 * Returns public auth settings for the current client.
 * Used by login/signup pages to determine what options to show.
 */
async function GET() {
    try {
        const config = await (0, idp_client_config_1.getIDPClientConfig)();
        const settings = {
            // Get enabled OAuth provider names
            enabledProviders: config.oauthProviders
                ?.filter(p => p.enabled)
                .map(p => p.provider) ?? [],
            // Registration - default to true if not specified
            allowPublicRegistration: true, // Could come from config.authSettings in future
            allowSocialLogin: config.oauthProviders?.some(p => p.enabled) ?? false,
            // Password reset
            enablePasswordReset: true, // Could come from config.authSettings in future
            // 2FA
            require2FA: config.authSettings?.require2FA ?? true,
            allowed2FAMethods: config.authSettings?.allowed2FAMethods ?? ['email', 'sms'],
        };
        return server_1.NextResponse.json({
            success: true,
            data: settings,
        });
    }
    catch (error) {
        console.error('[AUTH_SETTINGS] Failed to get settings:', error);
        // Return safe defaults on error
        return server_1.NextResponse.json({
            success: true,
            data: {
                enabledProviders: [],
                allowPublicRegistration: true,
                allowSocialLogin: false,
                enablePasswordReset: true,
                require2FA: true,
                allowed2FAMethods: ['email', 'sms'],
            },
        });
    }
}
