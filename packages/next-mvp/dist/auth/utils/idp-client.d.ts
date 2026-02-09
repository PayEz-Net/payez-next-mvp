/**
 * IDP Client Utilities
 *
 * Functions for calling PayEz IDP API endpoints.
 * Handles login, OAuth callback, token refresh, and 2FA verification.
 *
 * URL USAGE:
 * - IDP_URL: Used for all calls to the PayEz Identity Provider
 * - INTERNAL_API_URL: NOT used here - that's for calling THIS app's own endpoints
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */
import type { IdpLoginResponse, IdpOAuthCallbackResponse, IdpRefreshResponse, LoginCredentials } from '../types/auth-types';
/**
 * Get IDP base URL. Throws if not configured.
 */
export declare function getIdpUrl(): string;
/**
 * Get client ID for this application.
 */
export declare function getClientId(): string;
/**
 * Authenticate user with email/password via IDP.
 *
 * @param credentials - User's email and password
 * @param clientHeaders - Headers to forward (IP, User-Agent for audit)
 * @returns IDP login response with tokens or error
 */
export declare function idpLogin(credentials: LoginCredentials, clientHeaders?: {
    ip?: string;
    userAgent?: string;
}): Promise<IdpLoginResponse>;
/**
 * Register/authenticate OAuth user with IDP.
 *
 * Called after OAuth provider (Google, etc.) redirects back.
 * Creates or retrieves IDP user and returns IDP tokens.
 *
 * @param oauthData - Data from OAuth provider
 * @returns IDP response with tokens and user info
 */
export declare function idpOAuthCallback(oauthData: {
    provider: string;
    providerAccountId: string;
    email: string;
    name?: string;
    image?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
}): Promise<IdpOAuthCallbackResponse>;
/**
 * Refresh an expired access token using the refresh token.
 *
 * @param refreshToken - The refresh token from previous login
 * @param mfaContext - MFA context to preserve across refresh
 * @returns New tokens or error
 */
export declare function idpRefreshToken(refreshToken: string, mfaContext?: {
    amr?: string[];
    acr?: string;
    twoFactorVerified?: boolean;
    twoFactorMethod?: string;
    twoFactorCompletedAt?: number;
}): Promise<IdpRefreshResponse>;
/**
 * Verify 2FA code with IDP.
 *
 * @param sessionToken - Redis session ID
 * @param code - The 2FA code entered by user
 * @param method - The 2FA method ('email' | 'sms' | 'totp')
 * @returns Success status and updated tokens
 */
export declare function idpVerify2FA(accessToken: string, code: string, method: 'email' | 'sms' | 'totp'): Promise<{
    success: boolean;
    error?: {
        code: string;
        message: string;
    };
}>;
/**
 * Request a new 2FA code to be sent.
 *
 * @param accessToken - User's access token
 * @param method - How to send the code ('email' | 'sms')
 */
export declare function idpSend2FACode(accessToken: string, method: 'email' | 'sms'): Promise<{
    success: boolean;
    error?: {
        code: string;
        message: string;
    };
}>;
