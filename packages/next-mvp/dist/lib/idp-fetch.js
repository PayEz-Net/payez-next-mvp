"use strict";
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
exports.idpFetchJSON = idpFetchJSON;
const test_aware_get_token_1 = require("./test-aware-get-token");
const session_store_1 = require("./session-store");
const internal_api_1 = require("./internal-api");
function buildHeaders(req, bearer, extra) {
    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...extra,
    };
    const xfwd = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    if (xfwd)
        headers['X-Forwarded-For'] = xfwd.split(',')[0].trim();
    const ua = req.headers.get('user-agent');
    if (ua)
        headers['User-Agent'] = ua;
    if (bearer)
        headers['Authorization'] = `Bearer ${bearer}`;
    return headers;
}
async function ensureFreshAccessToken(req) {
    const token = await (0, test_aware_get_token_1.getTokenTestAware)(req);
    // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
    const sessionToken = (token?.sessionToken || token?.redisSessionId);
    console.log('[IDP_FETCH] ensureFreshAccessToken:', {
        hasToken: !!token,
        sessionToken: sessionToken?.substring(0, 20) + '...',
        pathname: req.nextUrl.pathname
    });
    if (!sessionToken) {
        console.warn('[IDP_FETCH] No sessionToken found in JWT - Bearer token will NOT be sent!');
        return {};
    }
    let session = await (0, session_store_1.getSession)(sessionToken);
    // Fall back to Better Auth: decode session from cookies to get IDP tokens
    if (!session?.idpAccessToken) {
        try {
            const { decodeSession } = await Promise.resolve().then(() => __importStar(require('../server/decode-session')));
            const decoded = await decodeSession(req.cookies);
            if (decoded?.sessionData?.idpAccessToken) {
                session = decoded.sessionData;
            }
        }
        catch { /* decodeSession unavailable in edge */ }
    }
    console.log('[IDP_FETCH] Redis session lookup:', {
        hasSession: !!session,
        hasAccessToken: !!session?.idpAccessToken,
        bearerKeyId: session?.bearerKeyId || 'NOT_SET',
        idpClientId: session?.idpClientId || 'NOT_SET',
    });
    if (!session?.idpAccessToken)
        return { sessionToken };
    const now = Date.now();
    const timeLeft = (session.idpAccessTokenExpires ?? now) - now;
    // Treat tokens as effectively expired if within 5 minutes of expiry
    if (timeLeft > 5 * 60 * 1000) {
        return { sessionToken, accessToken: session.idpAccessToken };
    }
    // attempt refresh once via centralized internal API helper
    try {
        await (0, internal_api_1.internalRefresh)(req.headers.get('cookie') || '', sessionToken);
    }
    catch { }
    session = await (0, session_store_1.getSession)(sessionToken);
    return { sessionToken, accessToken: session?.idpAccessToken };
}
async function idpFetchJSON(req, targetUrl, init = {}) {
    let attemptedRefresh = false;
    let { accessToken, sessionToken } = await ensureFreshAccessToken(req);
    const makeCall = async (bearer) => {
        const res = await fetch(targetUrl, {
            ...init,
            headers: buildHeaders(req, bearer, init.headers),
        });
        let json = null;
        try {
            json = await res.json();
        }
        catch {
            json = null;
        }
        return { res, json };
    };
    // First attempt
    let { res, json } = await makeCall(accessToken);
    if ((res.status === 401 || res.status === 403) && sessionToken && !attemptedRefresh) {
        attemptedRefresh = true;
        try {
            // Use centralized internal API helper for server-to-server calls
            const rf = await (0, internal_api_1.internalRefresh)(req.headers.get('cookie') || '', sessionToken);
            if (rf.ok) {
                const fresh = await (0, session_store_1.getSession)(sessionToken);
                ({ res, json } = await makeCall(fresh?.idpAccessToken));
            }
        }
        catch { }
    }
    return { ok: res.ok, status: res.status, json: json, attemptedRefresh };
}
