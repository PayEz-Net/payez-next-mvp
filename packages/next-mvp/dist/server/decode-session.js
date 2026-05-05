"use strict";
/**
 * Server-Side Session Decoder
 *
 * Uses Better Auth's server-side session API to get the current session.
 * Falls back to legacy JWT + Redis path if Better Auth session not found.
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
exports.decodeSession = decodeSession;
require("server-only");
const headers_1 = require("next/headers");
const jose_1 = require("jose");
const session_store_1 = require("../lib/session-store");
const idp_client_config_1 = require("../lib/idp-client-config");
const app_slug_1 = require("../lib/app-slug");
const startup_init_1 = require("../lib/startup-init");
/**
 * Try Better Auth's server-side session API.
 * Returns a DecodedSession if Better Auth has an active session, null otherwise.
 */
async function tryBetterAuthSession(requestCookies) {
    try {
        const { getBetterAuthInstance } = await Promise.resolve().then(() => __importStar(require('../auth/better-auth')));
        let auth = null;
        try {
            auth = await getBetterAuthInstance();
        }
        catch {
            return null;
        }
        if (!auth?.api?.getSession) {
            return null;
        }
        // Build headers from cookies for Better Auth to read
        const cookieStore = requestCookies || (await (0, headers_1.cookies)());
        const headerObj = new Headers();
        // Collect all cookies into a Cookie header
        if ('getAll' in cookieStore && typeof cookieStore.getAll === 'function') {
            const allCookies = cookieStore.getAll();
            const cookieStr = allCookies.map((c) => `${c.name}=${c.value}`).join('; ');
            headerObj.set('cookie', cookieStr);
        }
        else {
            // Fallback: read known cookie names
            const sessionCookieName = (0, app_slug_1.getSessionCookieName)();
            const secureCookieName = (0, app_slug_1.getSecureSessionCookieName)();
            const parts = [];
            const sc = cookieStore.get(secureCookieName);
            if (sc?.value)
                parts.push(`${secureCookieName}=${sc.value}`);
            const nc = cookieStore.get(sessionCookieName);
            if (nc?.value)
                parts.push(`${sessionCookieName}=${nc.value}`);
            if (parts.length > 0)
                headerObj.set('cookie', parts.join('; '));
        }
        const result = await auth.api.getSession({ headers: headerObj });
        if (!result?.session || !result?.user) {
            return null;
        }
        // Read IDP tokens from BA Redis session (stored by callback route after OAuth)
        let idpTokens = null;
        try {
            const { getRedis } = await Promise.resolve().then(() => __importStar(require('../lib/redis')));
            const { getAppSlug } = await Promise.resolve().then(() => __importStar(require('../lib/app-slug')));
            const baKey = `ba:${getAppSlug()}:${result.session.token}`;
            const baRaw = await getRedis().get(baKey);
            if (baRaw) {
                const baData = JSON.parse(baRaw);
                idpTokens = baData.idpTokens;
            }
        }
        catch { /* Redis unavailable */ }
        // Map Better Auth session + IDP tokens to SessionData
        const sessionData = {
            userId: idpTokens?.userId || result.user.id || '',
            email: idpTokens?.email || result.user.email || '',
            name: idpTokens?.name || result.user.name || undefined,
            roles: idpTokens?.roles || [],
            idpAccessToken: idpTokens?.idpAccessToken,
            idpRefreshToken: idpTokens?.idpRefreshToken,
            idpAccessTokenExpires: idpTokens?.idpAccessTokenExpires
                || (result.session.expiresAt ? new Date(result.session.expiresAt).getTime() : Date.now() + 24 * 60 * 60 * 1000),
            mfaVerified: idpTokens?.mfaVerified ?? false,
            oauthProvider: 'google',
            idpClientId: idpTokens?.idpClientId ?? idpTokens?.clientId,
            merchantId: idpTokens?.merchantId,
        };
        // Backwards compat: session.user.email works alongside session.email
        sessionData.user = {
            id: sessionData.userId,
            email: sessionData.email,
            name: sessionData.name,
            roles: sessionData.roles,
            image: result.user.image,
            oauthProvider: sessionData.oauthProvider,
        };
        const jwtPayload = {
            sub: result.user.id,
            email: result.user.email,
            name: result.user.name,
            iat: Math.floor(Date.now() / 1000),
            exp: sessionData.idpAccessTokenExpires / 1000,
            sessionToken: result.session.token,
        };
        return { sessionData, jwtPayload };
    }
    catch (error) {
        console.warn('[DECODE-SESSION] Better Auth session check failed:', error instanceof Error ? error.message : String(error));
        return null;
    }
}
/**
 * Decode the session from cookies.
 * Tries Better Auth first, falls back to legacy JWT + Redis.
 *
 * @param requestCookies Optional cookie getter for API route context (NextRequest.cookies).
 *                       If omitted, uses next/headers cookies() for server components.
 */
async function decodeSession(requestCookies) {
    try {
        await (0, startup_init_1.ensureInitialized)();
        // Try Better Auth session first
        const betterAuthSession = await tryBetterAuthSession(requestCookies);
        if (betterAuthSession) {
            return betterAuthSession;
        }
        // Fall back to legacy JWT + Redis path
        const cookieStore = requestCookies || (await (0, headers_1.cookies)());
        const sessionCookieName = (0, app_slug_1.getSessionCookieName)();
        const secureCookieName = (0, app_slug_1.getSecureSessionCookieName)();
        const cookieValue = cookieStore.get(secureCookieName)?.value ||
            cookieStore.get(sessionCookieName)?.value;
        if (!cookieValue) {
            return null;
        }
        const config = await (0, idp_client_config_1.getIDPClientConfig)();
        const secret = config.authSecret;
        if (!secret) {
            console.error('[DECODE-SESSION] No authSecret available from IDP config');
            return null;
        }
        const secretKey = new TextEncoder().encode(secret);
        let payload;
        try {
            const result = await (0, jose_1.jwtVerify)(cookieValue, secretKey);
            payload = result.payload;
        }
        catch (jwtError) {
            console.warn('[DECODE-SESSION] JWT verification failed:', jwtError instanceof Error ? jwtError.message : String(jwtError));
            return null;
        }
        const sessionToken = payload.sessionToken || payload.redisSessionId;
        if (!sessionToken) {
            console.warn('[DECODE-SESSION] JWT payload missing sessionToken/redisSessionId');
            return null;
        }
        const sessionData = await (0, session_store_1.getSession)(sessionToken);
        if (!sessionData) {
            return null;
        }
        // Backwards compat: session.user.email works alongside session.email
        if (!sessionData.user) {
            sessionData.user = {
                id: sessionData.userId,
                email: sessionData.email,
                name: sessionData.name,
                roles: sessionData.roles,
            };
        }
        return {
            sessionData,
            jwtPayload: payload,
        };
    }
    catch (error) {
        console.error('[DECODE-SESSION] Error:', error instanceof Error ? error.message : String(error));
        return null;
    }
}
