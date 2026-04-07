/**
 * Public Auth Settings Route
 *
 * Returns client auth settings for pre-login pages (signup, login).
 * Does NOT require authentication - these are public client settings.
 */

import { NextResponse } from 'next/server';
import { getIDPClientConfig } from '../../lib/idp-client-config';

export interface PublicAuthSettings {
    // OAuth providers enabled for this client
    enabledProviders: string[];

    // Registration settings
    allowPublicRegistration: boolean;
    allowFederatedLogin: boolean;

    // Password settings
    enablePasswordReset: boolean;

    // 2FA settings (public - no secrets)
    require2FA: boolean;
    allowed2FAMethods: string[];
}

/**
 * GET /api/auth/settings
 *
 * Returns public auth settings for the current client.
 * Used by login/signup pages to determine what options to show.
 */
export async function GET() {
    try {
        const config = await getIDPClientConfig();

        const settings: PublicAuthSettings = {
            // Get enabled OAuth provider names
            enabledProviders: config.oauthProviders
                ?.filter(p => p.enabled)
                .map(p => p.provider) ?? [],

            // Registration - default to true if not specified
            allowPublicRegistration: true, // Could come from config.authSettings in future
            allowFederatedLogin: config.oauthProviders?.some(p => p.enabled) ?? false,

            // Password reset
            enablePasswordReset: true, // Could come from config.authSettings in future

            // 2FA
            require2FA: config.authSettings?.require2FA ?? true,
            allowed2FAMethods: config.authSettings?.allowed2FAMethods ?? ['email', 'sms'],
        };

        return NextResponse.json({
            success: true,
            data: settings,
        });
    } catch (error) {
        console.error('[AUTH_SETTINGS] Failed to get settings:', error);

        // Return safe defaults on error
        return NextResponse.json({
            success: true,
            data: {
                enabledProviders: [],
                allowPublicRegistration: true,
                allowFederatedLogin: false,
                enablePasswordReset: true,
                require2FA: true,
                allowed2FAMethods: ['email', 'sms'],
            } as PublicAuthSettings,
        });
    }
}
