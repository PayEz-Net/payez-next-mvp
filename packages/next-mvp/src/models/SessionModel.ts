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

// ============================================================================
// NORMALIZED SESSION DATA (v2)
// ============================================================================

/**
 * Session data stored in Redis.
 *
 * This interface uses normalized field names for clarity.
 * All tokens and user data live here - the browser only gets the session ID.
 */
export interface SessionData {
  // -------------------------------------------------------------------------
  // Core Identity
  // -------------------------------------------------------------------------

  /** User ID from IDP (sub claim) */
  userId: string;

  /** User's email address */
  email: string;

  /** Display name (from OAuth profile or IDP) */
  name?: string;

  /** User's roles/permissions */
  roles: string[];

  // -------------------------------------------------------------------------
  // IDP Tokens (from PayEz Identity Provider)
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // MFA (Multi-Factor Authentication) State
  // -------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // OAuth Provider Tokens (Google, Microsoft, etc.)
  // -------------------------------------------------------------------------

  /** Which OAuth provider was used (google, apple, microsoft, etc.) */
  oauthProvider?: string;

  /** Access token from OAuth provider */
  oauthProviderToken?: string;

  /** Refresh token from OAuth provider */
  oauthProviderRefreshToken?: string;

  // -------------------------------------------------------------------------
  // Multi-Tenant IDP Assignment
  // -------------------------------------------------------------------------

  /** IDP client ID this user belongs to */
  idpClientId?: string;

  /** Merchant ID (typically same as client ID) */
  merchantId?: string;

  // -------------------------------------------------------------------------
  // Legacy Field Support (for backward compatibility)
  // -------------------------------------------------------------------------

  /**
   * Allow any additional fields for backward compatibility.
   * During migration, old sessions may have legacy field names.
   */
  [key: string]: any;
}


// ============================================================================
// SESSION MODEL CLASS
// ============================================================================

/**
 * Session model class for working with session data.
 *
 * Provides typed access to session fields with normalized names.
 */
export class SessionModel {
  // Core Identity
  userId: string;
  email: string;
  name?: string;
  roles: string[];

  // IDP Tokens
  idpAccessToken?: string;
  idpRefreshToken?: string;
  idpAccessTokenExpires: number;
  idpRefreshTokenExpires?: number;
  decodedAccessToken?: any;
  bearerKeyId?: string;

  // MFA State
  mfaVerified: boolean;
  mfaMethod?: 'email' | 'sms' | 'totp';
  mfaCompletedAt?: number;
  mfaExpiresAt?: number;
  mfaValidityHours?: number;
  authenticationMethods?: string[];
  authenticationLevel?: string;

  // OAuth Provider
  oauthProvider?: string;
  oauthProviderToken?: string;
  oauthProviderRefreshToken?: string;

  // Multi-Tenant
  idpClientId?: string;
  merchantId?: string;

  constructor(data: SessionData) {
    // Core Identity
    this.userId = data.userId;
    this.email = data.email;
    this.name = data.name;
    this.roles = data.roles || [];

    // IDP Tokens
    this.idpAccessToken = data.idpAccessToken;
    this.idpRefreshToken = data.idpRefreshToken;
    this.idpAccessTokenExpires = data.idpAccessTokenExpires;
    this.idpRefreshTokenExpires = data.idpRefreshTokenExpires;
    this.decodedAccessToken = data.decodedAccessToken;
    this.bearerKeyId = data.bearerKeyId;

    // MFA State
    this.mfaVerified = data.mfaVerified ?? false;
    this.mfaMethod = data.mfaMethod;
    this.mfaCompletedAt = data.mfaCompletedAt;
    this.mfaExpiresAt = data.mfaExpiresAt;
    this.mfaValidityHours = data.mfaValidityHours;
    this.authenticationMethods = data.authenticationMethods;
    this.authenticationLevel = data.authenticationLevel;

    // OAuth Provider
    this.oauthProvider = data.oauthProvider;
    this.oauthProviderToken = data.oauthProviderToken;
    this.oauthProviderRefreshToken = data.oauthProviderRefreshToken;

    // Multi-Tenant
    this.idpClientId = data.idpClientId;
    this.merchantId = data.merchantId;
  }

  /**
   * Check if the IDP access token has expired.
   */
  isAccessTokenExpired(): boolean {
    return Date.now() >= this.idpAccessTokenExpires;
  }

  /**
   * Check if the IDP refresh token has expired.
   */
  isRefreshTokenExpired(): boolean {
    if (!this.idpRefreshTokenExpires) return false;
    return Date.now() >= this.idpRefreshTokenExpires;
  }

  /**
   * Check if MFA has expired.
   */
  isMfaExpired(): boolean {
    if (!this.mfaExpiresAt) return false;
    return Date.now() > this.mfaExpiresAt;
  }

  /**
   * Convert to plain object for storage.
   */
  toJSON(): SessionData {
    return {
      userId: this.userId,
      email: this.email,
      name: this.name,
      roles: this.roles,
      idpAccessToken: this.idpAccessToken,
      idpRefreshToken: this.idpRefreshToken,
      idpAccessTokenExpires: this.idpAccessTokenExpires,
      idpRefreshTokenExpires: this.idpRefreshTokenExpires,
      decodedAccessToken: this.decodedAccessToken,
      bearerKeyId: this.bearerKeyId,
      mfaVerified: this.mfaVerified,
      mfaMethod: this.mfaMethod,
      mfaCompletedAt: this.mfaCompletedAt,
      mfaExpiresAt: this.mfaExpiresAt,
      mfaValidityHours: this.mfaValidityHours,
      authenticationMethods: this.authenticationMethods,
      authenticationLevel: this.authenticationLevel,
      oauthProvider: this.oauthProvider,
      oauthProviderToken: this.oauthProviderToken,
      oauthProviderRefreshToken: this.oauthProviderRefreshToken,
      idpClientId: this.idpClientId,
      merchantId: this.merchantId,
    };
  }
}
