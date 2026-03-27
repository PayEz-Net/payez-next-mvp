/**
 * ============================================================================
 * AUTH TYPES - Single Source of Truth
 * ============================================================================
 *
 * This file defines ALL authentication-related types for the PayEz Next MVP.
 * Every type has ONE name and ONE meaning. No aliases. No confusion.
 *
 * GLOSSARY:
 * ---------
 * RedisSessionId    - UUID stored in browser cookie, keys into Redis session
 * IdpAccessToken    - JWT from PayEz IDP, used for backend API calls
 * IdpRefreshToken   - JWT from PayEz IDP, used to get new access tokens
 * OAuthProviderToken - Token from Google/Microsoft/etc (NOT for our APIs)
 *
 * DATA FLOW:
 * ----------
 * 1. User logs in (credentials or OAuth)
 * 2. IDP returns IdpAccessToken + IdpRefreshToken
 * 3. We create RedisSessionData in Redis, get back RedisSessionId
 * 4. RedisSessionId goes in NextAuth JWT cookie (browser)
 * 5. On each request: cookie -> RedisSessionId -> Redis -> tokens
 *
 * SECURITY NOTES:
 * ---------------
 * - Tokens NEVER stored in NextAuth JWT (only RedisSessionId)
 * - Tokens ONLY stored in Redis (server-side)
 * - Browser only sees RedisSessionId (opaque UUID)
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */
/**
 * UUID key for Redis session storage.
 *
 * This is what gets stored in the browser's NextAuth cookie.
 * It's an opaque identifier - the browser cannot decode it to get tokens.
 *
 * Format: UUID v4 (e.g., "550e8400-e29b-41d4-a716-446655440000")
 *
 * OLD NAMES (do not use):
 * - sessionToken
 * - token.redisSessionId
 */
export type RedisSessionId = string & {
    readonly __brand: 'RedisSessionId';
};
/**
 * JWT issued by PayEz IDP for calling backend APIs.
 *
 * This token:
 * - Is signed by the IDP's private key
 * - Contains user claims (sub, email, roles, client_id, etc.)
 * - Has short expiry (typically 1 hour)
 * - Goes in Authorization header for API calls
 *
 * OLD NAMES (do not use):
 * - accessToken
 * - idpAccessToken
 * - token.accessToken
 * - responseData.result.access_token
 */
export type IdpAccessToken = string & {
    readonly __brand: 'IdpAccessToken';
};
/**
 * JWT issued by PayEz IDP for refreshing the access token.
 *
 * This token:
 * - Is signed by the IDP's private key
 * - Has longer expiry (typically 30 days)
 * - Is single-use (rotated on each refresh)
 * - NEVER sent to frontend, ONLY stored in Redis
 *
 * OLD NAMES (do not use):
 * - refreshToken
 * - idpRefreshToken
 * - token.refreshToken
 */
export type IdpRefreshToken = string & {
    readonly __brand: 'IdpRefreshToken';
};
/**
 * Access token from OAuth provider (Google, Microsoft, etc.)
 *
 * This is NOT used for our APIs. It's the token from the OAuth provider
 * that we received during OAuth flow. We store it in case the app needs
 * to call the provider's APIs (e.g., Google Calendar).
 *
 * OLD NAMES (do not use):
 * - account.access_token
 * - oauthAccessToken
 */
export type OAuthProviderToken = string & {
    readonly __brand: 'OAuthProviderToken';
};
export declare function toRedisSessionId(value: string): RedisSessionId;
export declare function toIdpAccessToken(value: string): IdpAccessToken;
export declare function toIdpRefreshToken(value: string): IdpRefreshToken;
export declare function toOAuthProviderToken(value: string): OAuthProviderToken;
/**
 * What we store in the NextAuth JWT cookie.
 *
 * MINIMAL by design. The JWT cookie is sent with every request, so we
 * keep it small. All the real data lives in Redis.
 *
 * WHAT'S IN THE COOKIE:
 * - redisSessionId: Key to look up session in Redis
 * - sub: User ID (for quick access without Redis round-trip)
 * - iss: Issuer URL (for SSO token validation)
 *
 * WHAT'S NOT IN THE COOKIE:
 * - Access tokens (security risk if cookie stolen)
 * - Refresh tokens (security risk if cookie stolen)
 * - User details (wastes bandwidth)
 */
export interface NextAuthJwtPayload {
    /** Redis session key - the ONLY way to get tokens */
    redisSessionId: RedisSessionId;
    /** User ID from IDP (sub claim) */
    sub: string;
    /** JWT issuer - AUTH_ISSUER_URL for SSO validation */
    iss: string;
    /** JWT issued at timestamp */
    iat?: number;
    /** JWT expiry timestamp */
    exp?: number;
}
/**
 * The complete session data stored in Redis.
 *
 * This is the single source of truth for a user's session state.
 * Everything about the session lives here - tokens, MFA status, user info.
 *
 * REDIS KEY FORMAT: "session:{redisSessionId}"
 * TTL: Matches refresh token expiry (typically 30 days)
 */
export interface RedisSessionData {
    /** User ID from IDP (matches JWT sub claim) */
    userId: string;
    /** User's email address */
    email: string;
    /** Display name (from OAuth profile or IDP) */
    name?: string;
    /** User's roles from IDP (e.g., ['user', 'admin']) */
    roles: string[];
    /** JWT for backend API calls */
    idpAccessToken: IdpAccessToken;
    /** JWT for refreshing access token */
    idpRefreshToken: IdpRefreshToken;
    /** When idpAccessToken expires (Unix ms) */
    idpAccessTokenExpires: number;
    /** When idpRefreshToken expires (Unix ms) - session dies when this expires */
    idpRefreshTokenExpires?: number;
    /**
     * Decoded access token claims (cached to avoid repeated JWT parsing)
     * Contains: sub, email, roles, client_id, merchant_id, amr, acr, etc.
     */
    decodedAccessToken?: DecodedIdpAccessToken;
    /**
     * Bearer Key ID (kid from JWT header).
     *
     * This is the key ID used to sign the IDP access token.
     * CRITICAL: This is from the JWT HEADER, not the payload.
     * Do NOT confuse with client_id (which is in the payload).
     *
     * Used for:
     * - Key governance verification
     * - Identifying which IDP signing key was used
     * - Token validation on the backend
     *
     * May be undefined for sessions created before this field was added.
     */
    bearerKeyId?: string;
    /**
     * Has the user completed MFA for this session?
     *
     * TRUE means: User has verified their identity with a second factor
     * FALSE means: User is in "provisional" state, limited access
     *
     * OLD NAMES (do not use):
     * - twoFactorComplete
     * - twoFactorSessionVerified
     * - requiresTwoFactor (this was the INVERSE, very confusing)
     */
    mfaVerified: boolean;
    /** How the user completed MFA */
    mfaMethod?: 'email' | 'sms' | 'totp' | 'authenticator';
    /** When MFA was completed (Unix ms) */
    mfaCompletedAt?: number;
    /** When MFA verification expires, requiring re-verification (Unix ms) */
    mfaExpiresAt?: number;
    /** How long MFA is valid (hours) - from client config */
    mfaValidityHours?: number;
    /**
     * Authentication methods used (AMR claim from token)
     * e.g., ['pwd', 'mfa', 'otp']
     */
    authenticationMethods?: string[];
    /**
     * Authentication context class (ACR claim from token)
     * '1' = single factor, '2' = multi-factor
     */
    authenticationLevel?: string;
    /** Which OAuth provider was used (e.g., 'google', 'microsoft') */
    oauthProvider?: string;
    /** Token from the OAuth provider (for calling provider APIs) */
    oauthProviderToken?: OAuthProviderToken;
    /** Refresh token from OAuth provider */
    oauthProviderRefreshToken?: string;
    /** IDP client ID this session belongs to */
    idpClientId?: string;
    /** Merchant ID for payment processing */
    merchantId?: string;
}
/**
 * Claims extracted from the IdpAccessToken JWT.
 *
 * We cache this in Redis to avoid parsing the JWT on every request.
 * These are the claims that the IDP puts in the access token.
 */
export interface DecodedIdpAccessToken {
    /** Subject - User ID */
    sub: string;
    /** Issuer - IDP URL */
    iss: string;
    /** Audience - who this token is for */
    aud?: string | string[];
    /** Expiration time (Unix seconds) */
    exp: number;
    /** Issued at time (Unix seconds) */
    iat: number;
    /** Not before time (Unix seconds) */
    nbf?: number;
    /** JWT ID - unique identifier for this token */
    jti?: string;
    /** User's email (may be in different claim names) */
    email?: string;
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string;
    /** User's roles */
    role?: string | string[];
    roles?: string | string[];
    /** Client ID this token was issued for */
    client_id?: string;
    /** Client slug (human-readable identifier) */
    client_slug?: string;
    /** Merchant ID for payment processing */
    merchant_id?: string;
    /** Authentication methods used */
    amr?: string | string[];
    /** Authentication context class */
    acr?: string;
    /** MFA completion time (Unix seconds) */
    mfa_time?: number;
    /** MFA expiry time (Unix seconds) */
    mfa_expires?: number;
    /** MFA validity period (hours) */
    mfa_validity_hours?: number;
}
/**
 * The session object returned by NextAuth's useSession() hook.
 *
 * This is what React components receive. It contains user info and
 * session metadata, but NOT raw tokens (those stay server-side).
 *
 * To make API calls, use the API routes which have access to Redis.
 */
export interface AppSession {
    user: {
        /** User ID from IDP */
        id: string;
        /** User's email */
        email: string;
        /** Display name */
        name?: string;
        /** User's roles */
        roles: string[];
        /** Has user completed MFA? */
        mfaVerified: boolean;
        /** OAuth provider if applicable */
        oauthProvider?: string;
    };
    /** Redis session key (for API routes that need it) */
    redisSessionId: RedisSessionId;
    /** Session expiry info */
    expires: string;
    /** Error state if something went wrong */
    error?: 'SessionNotFound' | 'RefreshFailed' | 'MfaExpired' | 'TokenExpired';
}
/**
 * Response from IDP login endpoint (/api/ExternalAuth/login)
 *
 * Note: IDP returns snake_case. We normalize to camelCase at the boundary.
 */
export interface IdpLoginResponse {
    success: boolean;
    result?: {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: 'Bearer';
        user?: {
            userId: number;
            email: string;
            fullName?: string;
            isEmailConfirmed?: boolean;
            isSmsConfirmed?: boolean;
            roles?: string[];
        };
    };
    error?: {
        code: string;
        message: string;
        details?: {
            errors?: Array<{
                code: string;
                message: string;
            }>;
            attempts_remaining?: number;
        };
    };
}
/**
 * Response from IDP OAuth callback (/api/ExternalAuth/oauth-callback)
 */
export interface IdpOAuthCallbackResponse {
    success: boolean;
    data?: {
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
        user?: {
            userId: number;
            email: string;
            fullName?: string;
            roles?: string[];
        };
    };
    error?: {
        code: string;
        message: string;
    };
}
/**
 * Response from IDP token refresh (/api/ExternalAuth/refresh)
 */
export interface IdpRefreshResponse {
    success: boolean;
    data?: {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
    };
    error?: {
        code: string;
        message: string;
    };
}
/**
 * Result of the ensureFreshToken() utility
 */
export type EnsureFreshTokenResult = {
    success: true;
    idpAccessToken: IdpAccessToken;
    sessionData: RedisSessionData;
} | {
    success: false;
    error: AuthError;
    message: string;
};
/**
 * Possible auth errors
 */
export type AuthError = 'NO_SESSION' | 'NO_TOKEN' | 'TOKEN_EXPIRED' | 'REFRESH_FAILED' | 'MFA_REQUIRED' | 'MFA_EXPIRED' | 'SESSION_INVALID' | 'CLIENT_MISMATCH';
/**
 * Credentials submitted via the login form
 */
export interface LoginCredentials {
    email: string;
    password: string;
}
/**
 * What the CredentialsProvider.authorize() function returns
 */
export interface AuthorizeResult {
    /** User ID from IDP */
    id: string;
    /** User's email */
    email: string;
    /** User's roles */
    roles: string[];
    /** Redis session ID (created during authorize) */
    redisSessionId: RedisSessionId;
    /** Whether user needs to complete MFA */
    mfaRequired: boolean;
    /** Available MFA methods */
    mfaMethod?: 'email' | 'sms' | 'totp';
}
/**
 * OAuth account info from NextAuth
 */
export interface OAuthAccountInfo {
    provider: string;
    providerAccountId: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
}
/**
 * OAuth user info from provider
 */
export interface OAuthUserInfo {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
}
