"use strict";
/**
 * NextAuth Configuration (Refactored)
 *
 * This is the composition layer that wires together all auth modules.
 * Individual logic lives in dedicated modules:
 * - providers/ - Credentials and OAuth provider builders
 * - callbacks/ - JWT, session, signIn callbacks
 * - events/ - SignOut event handler
 * - utils/ - Token utilities, IDP client
 * - types/ - Type definitions
 *
 * CARGO CULT PATTERNS REMOVED:
 * ============================
 * The original auth-options.ts (1186 lines) had several anti-patterns that
 * added complexity without benefit:
 *
 * 1. CALLBACK CONCURRENCY PROTECTION (removed)
 *    - shouldExecuteCallback() / markCallbackComplete()
 *    - A debouncing mechanism that tried to prevent callbacks from running
 *      too frequently. NextAuth already handles this properly.
 *    - Added complexity, caused race condition bugs, and leaked memory
 *      (Map entries never cleaned up).
 *
 * 2. SESSION RESTORATION (removed)
 *    - attemptSessionRestoration()
 *    - Tried to restore sessions by calling refresh endpoint from JWT callback.
 *    - Created circular dependencies and made debugging impossible.
 *    - Clean approach: Session missing = user re-authenticates. Simple.
 *
 * 3. VARIABLE NAME SOUP (normalized in Phase 3)
 *    - accessToken vs idpAccessToken vs oauthAccessToken
 *    - twoFactorComplete vs mfaVerified vs requiresTwoFactor
 *    - sessionToken vs redisSessionId
 *    - Now: Clear prefixes (idp*, oauth*, mfa*) with documented meanings.
 *
 * 4. INLINE EVERYTHING (modularized in Phase 2)
 *    - All logic was in one giant file with no separation of concerns.
 *    - Now: Each module has one job and can be tested independently.
 *
 * @version 2.0.0
 * @since auth-refactor-2026-01
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOptions = void 0;
exports.getAuthOptions = getAuthOptions;
exports.clearAuthOptionsCache = clearAuthOptionsCache;
const jwt_1 = require("next-auth/jwt");
const idp_client_config_1 = require("../lib/idp-client-config");
const app_slug_1 = require("../lib/app-slug");
// Module imports
const providers_1 = require("./providers");
const callbacks_1 = require("./callbacks");
const events_1 = require("./events");
// ============================================================================
// ENVIRONMENT HELPERS
// ============================================================================
/**
 * Get AUTH_ISSUER_URL for JWT issuer claim.
 * Required for SSO across apps.
 */
function getAuthIssuerUrl() {
    const url = process.env.AUTH_ISSUER_URL;
    if (!url) {
        throw new Error('AUTH_ISSUER_URL environment variable is REQUIRED');
    }
    return url;
}
// ============================================================================
// BASE AUTH OPTIONS
// ============================================================================
/**
 * Base NextAuth configuration.
 * Use getAuthOptions() for dynamic provider loading from IDP.
 */
exports.authOptions = {
    // Session uses JWT strategy - JWT contains only redisSessionId
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days default, overridden by IDP config
    },
    // Custom JWT handling for SSO issuer
    jwt: {
        encode: async (params) => {
            try {
                const issuer = getAuthIssuerUrl();
                console.log('[JWT_ENCODE] Encoding token:', {
                    hasToken: !!params.token,
                    hasSecret: !!params.secret,
                    secretLength: params.secret?.length || 0,
                    issuer,
                    tokenKeys: params.token ? Object.keys(params.token) : [],
                });
                const encoded = await (0, jwt_1.encode)({
                    ...params,
                    secret: params.secret,
                    token: {
                        ...params.token,
                        iss: issuer,
                    },
                });
                console.log('[JWT_ENCODE] Success, encoded length:', encoded?.length || 0);
                return encoded;
            }
            catch (error) {
                console.error('[JWT_ENCODE] FAILED:', error);
                throw error;
            }
        },
        decode: async (params) => {
            const decoded = await (0, jwt_1.decode)(params);
            if (decoded?.iss && decoded.iss !== getAuthIssuerUrl()) {
                console.error('[JWT] Invalid issuer. Expected:', getAuthIssuerUrl(), 'Got:', decoded.iss);
                return null; // Hard enforcement - reject mismatched issuers
            }
            return decoded;
        },
    },
    // Cookie configuration for multi-app support
    // In production, use __Secure- prefixed cookie names for enhanced security
    cookies: {
        sessionToken: {
            name: process.env.NODE_ENV === 'production' ? (0, app_slug_1.getSecureSessionCookieName)() : (0, app_slug_1.getSessionCookieName)(),
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        csrfToken: {
            name: process.env.NODE_ENV === 'production' ? (0, app_slug_1.getSecureCsrfCookieName)() : (0, app_slug_1.getCsrfCookieName)(),
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
        callbackUrl: {
            name: (0, app_slug_1.getCallbackUrlCookieName)(),
            options: {
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    // Providers - credentials only in base, OAuth added dynamically
    providers: [(0, providers_1.createCredentialsProvider)()],
    // Callbacks wired to modular implementations
    callbacks: {
        jwt: callbacks_1.jwtCallback,
        session: callbacks_1.sessionCallback, // Type cast needed for NextAuth compatibility
        signIn: callbacks_1.signInCallback,
    },
    // Events
    events: {
        signOut: events_1.handleSignOut,
    },
    // Custom pages
    pages: {
        signIn: '/account-auth/login',
        error: '/account-auth/login',
    },
    debug: false,
};
// ============================================================================
// DYNAMIC AUTH OPTIONS (WITH IDP OAUTH PROVIDERS)
// ============================================================================
let cachedAuthOptions = null;
let authOptionsPromise = null;
/**
 * Get auth options with dynamically loaded OAuth providers from IDP.
 * Uses caching to avoid rebuilding on every request.
 */
async function getAuthOptions() {
    if (cachedAuthOptions) {
        return cachedAuthOptions;
    }
    if (authOptionsPromise) {
        return authOptionsPromise;
    }
    authOptionsPromise = buildDynamicAuthOptions();
    cachedAuthOptions = await authOptionsPromise;
    authOptionsPromise = null;
    return cachedAuthOptions;
}
/**
 * Build auth options with dynamic OAuth providers from IDP.
 */
async function buildDynamicAuthOptions() {
    const idpConfig = await (0, idp_client_config_1.getIDPClientConfig)();
    const oauthProviders = (0, providers_1.buildOAuthProviders)(idpConfig);
    return {
        ...exports.authOptions,
        secret: idpConfig.nextAuthSecret || process.env.NEXTAUTH_SECRET,
        session: {
            ...exports.authOptions.session,
            maxAge: idpConfig.authSettings?.rememberMeDays
                ? idpConfig.authSettings.rememberMeDays * 24 * 60 * 60
                : 30 * 24 * 60 * 60,
        },
        providers: [(0, providers_1.createCredentialsProvider)(), ...oauthProviders],
    };
}
/**
 * Clear cached auth options (when IDP config changes).
 */
function clearAuthOptionsCache() {
    cachedAuthOptions = null;
    authOptionsPromise = null;
}
