"use strict";
/**
 * Server-side auth utilities for Better Auth (v4.0)
 *
 * Replaces:
 * - getToken() from next-auth/jwt
 * - getServerSession() from next-auth
 *
 * All server-side auth flows go through the Better Auth instance.
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
exports.requireSession = requireSession;
require("server-only");
const better_auth_1 = require("../auth/better-auth");
const idp_client_config_1 = require("../lib/idp-client-config");
let authInstance = null;
let authInitPromise = null;
/**
 * Get the initialized Better Auth instance (singleton).
 */
async function getAuthInstance() {
    if (authInstance)
        return authInstance;
    if (!authInitPromise) {
        authInitPromise = (0, idp_client_config_1.getIDPClientConfig)().then(config => {
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
        // Enrich with IDP tokens from Redis (stored by post-login hook)
        try {
            const { getRedis } = await Promise.resolve().then(() => __importStar(require('../lib/redis')));
            const { getAppSlug } = await Promise.resolve().then(() => __importStar(require('../lib/app-slug')));
            const baKey = `ba:${getAppSlug()}:${session.session.token}`;
            const baRaw = await getRedis().get(baKey);
            if (baRaw) {
                const baData = JSON.parse(baRaw);
                if (baData.idpTokens) {
                    const u = session.user;
                    u.roles = baData.idpTokens.roles || [];
                    u.userId = baData.idpTokens.userId;
                    u.idpAccessToken = baData.idpTokens.idpAccessToken;
                    u.idpRefreshToken = baData.idpTokens.idpRefreshToken;
                    u.idpAccessTokenExpires = baData.idpTokens.idpAccessTokenExpires;
                }
            }
        }
        catch { /* Redis unavailable */ }
        return session;
    }
    catch {
        return null;
    }
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
