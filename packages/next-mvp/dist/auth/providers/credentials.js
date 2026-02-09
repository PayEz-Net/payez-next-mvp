"use strict";
/**
 * Credentials Provider
 *
 * Handles email/password authentication via PayEz IDP.
 * Creates Redis session and returns minimal user object to NextAuth.
 *
 * FLOW:
 * 1. User submits email/password
 * 2. We call IDP /api/ExternalAuth/login
 * 3. IDP returns tokens if credentials valid
 * 4. We create Redis session with tokens
 * 5. Return user object with redisSessionId to NextAuth
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCredentialsProvider = createCredentialsProvider;
const credentials_1 = __importDefault(require("next-auth/providers/credentials"));
const session_store_1 = require("../../lib/session-store");
const idp_client_1 = require("../utils/idp-client");
const token_utils_1 = require("../utils/token-utils");
const auth_types_1 = require("../types/auth-types");
// NOTE: Using any for sessionData until Phase 3 normalizes types
// ============================================================================
// CREDENTIALS PROVIDER
// ============================================================================
/**
 * Create the CredentialsProvider for NextAuth.
 *
 * This provider handles email/password login. The authorize function
 * is called when a user submits the login form.
 */
function createCredentialsProvider() {
    return (0, credentials_1.default)({
        id: 'credentials',
        name: 'Credentials',
        credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
        },
        authorize: authorizeCredentials,
    });
}
/**
 * Authorize user with email/password.
 *
 * This is the core authentication function. It:
 * 1. Validates credentials with IDP
 * 2. Decodes the returned tokens
 * 3. Creates a Redis session
 * 4. Returns user info for NextAuth JWT
 *
 * @param credentials - Email and password from login form
 * @param req - The incoming request (for IP/UA forwarding)
 * @returns User object for NextAuth, or null/throws on failure
 */
async function authorizeCredentials(credentials, req) {
    // -------------------------------------------------------------------------
    // Validate Input
    // -------------------------------------------------------------------------
    if (!credentials?.email || !credentials?.password) {
        throw new Error('Email and password required');
    }
    const loginCredentials = {
        email: credentials.email,
        password: credentials.password,
    };
    // Extract client info for audit logging
    const clientHeaders = extractClientHeaders(req);
    // -------------------------------------------------------------------------
    // Call IDP
    // -------------------------------------------------------------------------
    const loginResult = await (0, idp_client_1.idpLogin)(loginCredentials, clientHeaders);
    if (!loginResult.success || !loginResult.result) {
        // Build structured error for frontend
        const errorResponse = buildAuthError(loginResult.error);
        throw new Error(JSON.stringify(errorResponse));
    }
    const { access_token, refresh_token, user: idpUser } = loginResult.result;
    // -------------------------------------------------------------------------
    // Decode Token
    // -------------------------------------------------------------------------
    const decoded = (0, token_utils_1.decodeIdpAccessToken)(access_token);
    if (!decoded) {
        throw new Error('Failed to decode token');
    }
    // Extract kid from JWT header (CRITICAL: this is different from client_id in payload)
    const bearerKeyId = (0, token_utils_1.extractKidFromToken)(access_token);
    if (bearerKeyId) {
        console.log('[CREDENTIALS] Extracted bearerKeyId (kid) from JWT header:', bearerKeyId);
    }
    else {
        console.warn('[CREDENTIALS] No kid found in JWT header - token may be unsigned or malformed');
    }
    // Extract claims from token
    const email = (0, token_utils_1.extractEmailFromToken)(decoded);
    const roles = (0, token_utils_1.extractRolesFromToken)(decoded);
    const amrClaims = (0, token_utils_1.extractAmrFromToken)(decoded);
    const acrLevel = decoded.acr || '1';
    const userId = decoded.sub;
    // Check if 2FA is complete based on ACR level
    // ACR=1: Provisional token (requires 2FA)
    // ACR=2: Full authentication (2FA complete)
    const mfaVerified = acrLevel === '2';
    // Decode refresh token expiry if available
    let refreshTokenExpires;
    try {
        const refreshDecoded = (0, token_utils_1.decodeIdpAccessToken)(refresh_token);
        if (refreshDecoded?.exp) {
            refreshTokenExpires = (0, token_utils_1.expClaimToMs)(refreshDecoded.exp);
        }
    }
    catch {
        // Ignore - will use default expiry
    }
    // -------------------------------------------------------------------------
    // Create Redis Session
    // -------------------------------------------------------------------------
    // Using normalized field names (session-store handles backward compatibility)
    const sessionData = {
        userId,
        email,
        roles,
        // IDP tokens (normalized names)
        idpAccessToken: access_token,
        idpRefreshToken: refresh_token,
        idpAccessTokenExpires: (0, token_utils_1.expClaimToMs)(decoded.exp),
        idpRefreshTokenExpires: refreshTokenExpires,
        decodedAccessToken: decoded,
        // Bearer key ID from JWT header (NOT client_id from payload)
        bearerKeyId,
        // MFA state (normalized names)
        mfaVerified,
        authenticationMethods: amrClaims,
        authenticationLevel: acrLevel,
        // MFA timing info from token
        mfaCompletedAt: decoded.mfa_time ? (0, token_utils_1.expClaimToMs)(decoded.mfa_time) : undefined,
        mfaExpiresAt: decoded.mfa_expires ? (0, token_utils_1.expClaimToMs)(decoded.mfa_expires) : undefined,
        mfaValidityHours: decoded.mfa_validity_hours,
    };
    // Determine MFA method from IDP user info
    let mfaMethod;
    if (idpUser?.isEmailConfirmed) {
        mfaMethod = 'email';
    }
    else if (idpUser?.isSmsConfirmed) {
        mfaMethod = 'sms';
    }
    if (mfaMethod) {
        sessionData.mfaMethod = mfaMethod;
    }
    // Create the Redis session
    const redisSessionId = await (0, session_store_1.createSession)(sessionData);
    // -------------------------------------------------------------------------
    // Return User Object for NextAuth
    // -------------------------------------------------------------------------
    // NextAuth requires 'id' field - we use userId from IDP
    // The redisSessionId is passed through to the JWT callback
    return {
        id: userId,
        email,
        roles,
        redisSessionId: (0, auth_types_1.toRedisSessionId)(redisSessionId),
        mfaRequired: !mfaVerified,
        mfaMethod,
    };
}
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Extract client headers from request for audit logging.
 */
function extractClientHeaders(req) {
    const headers = {};
    // Extract client IP
    const forwardedFor = req?.headers?.['x-forwarded-for'];
    const realIp = req?.headers?.['x-real-ip'];
    if (forwardedFor) {
        const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim();
        headers.ip = ip;
    }
    else if (realIp) {
        headers.ip = Array.isArray(realIp) ? realIp[0] : realIp;
    }
    // Extract User-Agent
    const userAgent = req?.headers?.['user-agent'];
    if (userAgent) {
        headers.userAgent = Array.isArray(userAgent) ? userAgent[0] : userAgent;
    }
    return headers;
}
/**
 * Build structured error response for frontend.
 *
 * The frontend expects a specific error structure to display
 * appropriate messages and handle things like lockout.
 */
function buildAuthError(error) {
    if (!error) {
        return {
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: 'Authentication failed',
                details: {},
            },
        };
    }
    return {
        success: false,
        error: {
            code: error.code || 'AUTH_ERROR',
            message: error.message || 'Authentication failed',
            details: error.details || {},
        },
    };
}
