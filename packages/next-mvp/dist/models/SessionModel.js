"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionModel = void 0;
// ============================================================================
// SESSION MODEL CLASS
// ============================================================================
/**
 * Session model class for working with session data.
 *
 * Provides typed access to session fields with normalized names.
 */
class SessionModel {
    // Core Identity
    userId;
    email;
    name;
    roles;
    // IDP Tokens
    idpAccessToken;
    idpRefreshToken;
    idpAccessTokenExpires;
    idpRefreshTokenExpires;
    decodedAccessToken;
    bearerKeyId;
    // MFA State
    mfaVerified;
    mfaMethod;
    mfaCompletedAt;
    mfaExpiresAt;
    mfaValidityHours;
    authenticationMethods;
    authenticationLevel;
    // OAuth Provider
    oauthProvider;
    oauthProviderToken;
    oauthProviderRefreshToken;
    // Multi-Tenant
    idpClientId;
    merchantId;
    constructor(data) {
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
    isAccessTokenExpired() {
        return Date.now() >= this.idpAccessTokenExpires;
    }
    /**
     * Check if the IDP refresh token has expired.
     */
    isRefreshTokenExpired() {
        if (!this.idpRefreshTokenExpires)
            return false;
        return Date.now() >= this.idpRefreshTokenExpires;
    }
    /**
     * Check if MFA has expired.
     */
    isMfaExpired() {
        if (!this.mfaExpiresAt)
            return false;
        return Date.now() > this.mfaExpiresAt;
    }
    /**
     * Convert to plain object for storage.
     */
    toJSON() {
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
exports.SessionModel = SessionModel;
