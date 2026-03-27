"use strict";
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
