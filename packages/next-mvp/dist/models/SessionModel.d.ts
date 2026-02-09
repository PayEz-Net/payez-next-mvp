/**
 * Session Model - Redis Session Data Structure
 *
 * This is the single source of truth for session data stored in Redis.
 * The session contains all authentication state - the JWT cookie only
 * stores the session ID (redisSessionId).
 *
 * FIELD NAMING CONVENTIONS:
 * - idp* prefix: Tokens from PayEz IDP (identity provider)
 * - oauth* prefix: Tokens from external OAuth providers (Google, etc.)
 * - mfa* prefix: Multi-factor authentication related fields
 *
 * @version 2.0.0 - Normalized field names
 * @since auth-refactor-2026-01
 */
/**
 * Session data stored in Redis.
 *
 * This interface uses normalized field names for clarity.
 * All tokens and user data live here - the browser only gets the session ID.
 */
export interface SessionData {
    /** User ID from IDP (sub claim) */
    userId: string;
    /** User's email address */
    email: string;
    /** Display name (from OAuth profile or IDP) */
    name?: string;
    /** User's roles/permissions */
    roles: string[];
    /** IDP access token (JWT) - used for API calls to PayEz services */
    idpAccessToken?: string;
    /** IDP refresh token - used to get new access tokens */
    idpRefreshToken?: string;
    /** When the IDP access token expires (Unix timestamp ms) */
    idpAccessTokenExpires: number;
    /** When the IDP refresh token expires (Unix timestamp ms) */
    idpRefreshTokenExpires?: number;
    /** Decoded IDP access token claims (for quick access without re-decoding) */
    decodedAccessToken?: any;
    /**
     * Bearer Key ID (kid from JWT header).
     * Identifies which IDP signing key was used for this token.
     * CRITICAL: This is from the JWT HEADER, not client_id from payload.
     */
    bearerKeyId?: string;
    /** Whether MFA has been verified for this session */
    mfaVerified: boolean;
    /** The MFA method used (email, sms, totp) */
    mfaMethod?: 'email' | 'sms' | 'totp';
    /** When MFA was completed (Unix timestamp ms) */
    mfaCompletedAt?: number;
    /** When MFA verification expires (Unix timestamp ms) */
    mfaExpiresAt?: number;
    /** How long MFA is valid in hours */
    mfaValidityHours?: number;
    /** Authentication methods from token (amr claim) */
    authenticationMethods?: string[];
    /** Authentication level from token (acr claim) */
    authenticationLevel?: string;
    /** Which OAuth provider was used (google, apple, microsoft, etc.) */
    oauthProvider?: string;
    /** Access token from OAuth provider */
    oauthProviderToken?: string;
    /** Refresh token from OAuth provider */
    oauthProviderRefreshToken?: string;
    /** IDP client ID this user belongs to */
    idpClientId?: string;
    /** Merchant ID (typically same as client ID) */
    merchantId?: string;
    /**
     * Allow any additional fields for backward compatibility.
     * During migration, old sessions may have legacy field names.
     */
    [key: string]: any;
}
/**
 * Session model class for working with session data.
 *
 * Provides typed access to session fields with normalized names.
 */
export declare class SessionModel {
    userId: string;
    email: string;
    name?: string;
    roles: string[];
    idpAccessToken?: string;
    idpRefreshToken?: string;
    idpAccessTokenExpires: number;
    idpRefreshTokenExpires?: number;
    decodedAccessToken?: any;
    bearerKeyId?: string;
    mfaVerified: boolean;
    mfaMethod?: 'email' | 'sms' | 'totp';
    mfaCompletedAt?: number;
    mfaExpiresAt?: number;
    mfaValidityHours?: number;
    authenticationMethods?: string[];
    authenticationLevel?: string;
    oauthProvider?: string;
    oauthProviderToken?: string;
    oauthProviderRefreshToken?: string;
    idpClientId?: string;
    merchantId?: string;
    constructor(data: SessionData);
    /**
     * Check if the IDP access token has expired.
     */
    isAccessTokenExpired(): boolean;
    /**
     * Check if the IDP refresh token has expired.
     */
    isRefreshTokenExpired(): boolean;
    /**
     * Check if MFA has expired.
     */
    isMfaExpired(): boolean;
    /**
     * Convert to plain object for storage.
     */
    toJSON(): SessionData;
}
