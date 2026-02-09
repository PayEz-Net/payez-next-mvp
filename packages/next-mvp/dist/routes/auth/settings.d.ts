/**
 * Public Auth Settings Route
 *
 * Returns client auth settings for pre-login pages (signup, login).
 * Does NOT require authentication - these are public client settings.
 */
import { NextResponse } from 'next/server';
export interface PublicAuthSettings {
    enabledProviders: string[];
    allowPublicRegistration: boolean;
    allowSocialLogin: boolean;
    enablePasswordReset: boolean;
    require2FA: boolean;
    allowed2FAMethods: string[];
}
/**
 * GET /api/auth/settings
 *
 * Returns public auth settings for the current client.
 * Used by login/signup pages to determine what options to show.
 */
export declare function GET(): Promise<NextResponse<{
    success: boolean;
    data: PublicAuthSettings;
}>>;
