"use strict";
/**
 * Server-side auth utilities for Better Auth.
 *
 * All server-side auth flows go through the Better Auth instance returned by
 * getAuthInstance(); use getSession(req) for the request-scoped session.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthInstance = getAuthInstance;
exports.getSession = getSession;
exports.getSessionData = getSessionData;
exports.getIdpToken = getIdpToken;
exports.getFreshIdpToken = getFreshIdpToken;
exports.requireSession = requireSession;
require("server-only");
const better_auth_1 = require("../auth/better-auth");
const idp_client_config_1 = require("../lib/idp-client-config");
const session_store_1 = require("../lib/session-store");
let authInstance = null;
let authInitPromise = null;
function buildSessionDataFromAuthSession(session) {
    const user = session?.user;
    if (!user?.id && !user?.email) {
        return null;
    }
    const expiresAt = session?.session?.expiresAt
        ? new Date(session.session.expiresAt).getTime()
        : Date.now() + 24 * 60 * 60 * 1000;
    return {
        userId: user.userId || user.id || '',
        email: user.email || '',
        name: user.name || undefined,
        image: user.image || undefined,
        roles: Array.isArray(user.roles) ? user.roles : [],
        idpAccessToken: user.idpAccessToken,
        idpRefreshToken: user.idpRefreshToken,
        idpAccessTokenExpires: user.idpAccessTokenExpires || expiresAt,
        mfaVerified: user.mfaVerified ?? user.twoFactorSessionVerified ?? false,
        oauthProvider: user.oauthProvider,
        idpClientId: user.idpClientId,
        merchantId: user.merchantId,
    };
}
function attachSessionData(session, sessionData, sessionToken) {
    if (!sessionData) {
        return session;
    }
    const enrichedSessionData = {
        ...sessionData,
        ...(sessionToken ? { sessionToken } : {}),
    };
    session.sessionData = enrichedSessionData;
    if (session?.user) {
        const user = session.user;
        user.userId = enrichedSessionData.userId || user.userId;
        user.email = enrichedSessionData.email || user.email;
        user.name = enrichedSessionData.name || user.name;
        user.image = enrichedSessionData.image || user.image;
        user.roles = enrichedSessionData.roles || user.roles || [];
        user.idpAccessToken = enrichedSessionData.idpAccessToken;
        user.idpRefreshToken = enrichedSessionData.idpRefreshToken;
        user.idpAccessTokenExpires = enrichedSessionData.idpAccessTokenExpires;
        user.mfaVerified = enrichedSessionData.mfaVerified;
        user.twoFactorSessionVerified =
            enrichedSessionData.mfaVerified ?? user.twoFactorSessionVerified;
        user.oauthProvider = enrichedSessionData.oauthProvider || user.oauthProvider;
        user.idpClientId = enrichedSessionData.idpClientId || user.idpClientId;
        user.merchantId = enrichedSessionData.merchantId || user.merchantId;
    }
    return session;
}
/**
 * Get the initialized Better Auth instance (singleton).
 */
async function getAuthInstance() {
    if (authInstance)
        return authInstance;
    if (!authInitPromise) {
        authInitPromise = (0, idp_client_config_1.getIDPClientConfig)(true).then(config => {
            authInstance = (0, better_auth_1.createBetterAuthInstance)(config);
            return authInstance;
        });
    }
    return authInitPromise;
}
/**
 * Get the current session from a request.
 * Replaces getToken() and getServerSession().
 *
 * Returns the session object or null if not authenticated.
 */
async function getSession(request) {
    const auth = await getAuthInstance();
    if (!request)
        return null;
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        if (!session?.session?.token || !session?.user)
            return session;
        const sessionToken = session.session.token;
        let sessionData = null;
        // Prefer the app's normalized Redis session. Fall back to Better Auth's
        // secondary storage record, then finally to whatever Better Auth already
        // put on the request session object.
        try {
            sessionData = await (0, session_store_1.getSession)(sessionToken);
            if (!sessionData) {
                sessionData = await (0, session_store_1.getBetterAuthSession)(sessionToken);
            }
        }
        catch { /* Redis unavailable */ }
        if (!sessionData) {
            sessionData = buildSessionDataFromAuthSession(session);
        }
        return attachSessionData(session, sessionData, sessionToken);
    }
    catch {
        return null;
    }
}
/**
 * Get normalized session data for the current request.
 *
 * This prefers the app's Redis session because it carries the canonical
 * IDP token, roles, and tenant-specific user identity used by app routes.
 */
async function getSessionData(request) {
    const session = await getSession(request);
    const sessionData = session?.sessionData ||
        buildSessionDataFromAuthSession(session);
    if (!sessionData) {
        return null;
    }
    const sessionToken = session?.session?.token;
    return sessionToken
        ? { ...sessionData, sessionToken }
        : sessionData;
}
/**
 * Get the current request's IDP access token without triggering a refresh.
 *
 * Use this for routes that only need the currently-issued bearer token and
 * should fail closed instead of performing token lifecycle work. For backend
 * proxy routes that forward the token to a downstream API, prefer
 * `getFreshIdpToken` — it preflights expiry and refreshes single-flight, so
 * the proxy never sends a credential it already knows is invalid.
 */
async function getIdpToken(request) {
    const sessionData = await getSessionData(request);
    if (!sessionData) {
        return { success: false, error: 'NO_SESSION', terminal: true };
    }
    const accessToken = sessionData.idpAccessToken || sessionData.accessToken;
    if (!accessToken) {
        return { success: false, error: 'NO_TOKEN', terminal: true };
    }
    return {
        success: true,
        accessToken,
        sessionData,
    };
}
/**
 * Get the current request's IDP access token, preflight-refreshing if it is
 * expired or within the safety window. Single-flight via Redis lock, so
 * concurrent calls on the same session share one IDP round-trip and one
 * single-use refresh-token consumption.
 *
 * Use this in proxy routes. The returned `accessToken` is safe to forward to
 * a downstream API without expecting a 401. If `success` is false, surface a
 * 401/redirect — there is no recoverable token for this session.
 */
async function getFreshIdpToken(request, config) {
    const session = await getSession(request);
    const sessionToken = session?.session?.token;
    if (!sessionToken) {
        return { success: false, error: 'NO_SESSION', status: 401, terminal: true };
    }
    const { ensureFreshAccessToken } = await Promise.resolve().then(() => __importStar(require('../lib/ensure-fresh-access-token')));
    const result = await ensureFreshAccessToken(sessionToken, {
        idpBaseUrl: config.idpBaseUrl,
        clientId: config.clientId,
        refreshEndpoint: config.refreshEndpoint,
    }, {
        safetyWindowMs: config.safetyWindowMs,
        requestId: request?.headers?.get('x-request-id') ?? undefined,
    });
    if (!result.ok) {
        return {
            success: false,
            error: result.code,
            status: result.status,
            terminal: result.terminal,
            discardToken: result.discardToken,
            retryable: result.retryable,
            resolution: result.resolution,
        };
    }
    const sessionData = await (0, session_store_1.getSession)(sessionToken);
    if (!sessionData) {
        return { success: false, error: 'NO_SESSION', status: 401, terminal: true };
    }
    return {
        success: true,
        accessToken: result.accessToken,
        sessionData,
        refreshed: result.refreshed,
    };
}
/**
 * Get the current session, throwing if not authenticated.
 * Use in API handlers that require auth.
 */
async function requireSession(request) {
    const session = await getSession(request);
    if (!session) {
        throw new Error('Unauthorized');
    }
    return session;
}
