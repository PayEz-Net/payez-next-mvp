"use strict";
/**
 * Centralized internal API helper for the app to call ITSELF.
 *
 * IMPORTANT: All calls from the Next.js server to its own API routes MUST use
 * these functions. Never use req.url, req.nextUrl.origin, or construct URLs
 * from the incoming request.
 *
 * WHY HTTP IS REQUIRED (not optional):
 * - This is the app calling its OWN backend within the same pod/container
 * - NextAuth cookies are encrypted based on request protocol
 * - TLS is terminated at ingress, so the pod receives HTTP internally
 * - Using HTTPS here causes cookie decryption failures and 403 errors
 * - This is NOT about "K8s traffic doesn't need TLS" - it's about
 *   protocol consistency for cookie/session encryption
 *
 * Environment:
 * - INTERNAL_API_URL: Required in production (e.g., http://service.namespace.svc.cluster.local:80)
 * - Falls back to http://localhost:3200 in development only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInternalApiUrl = getInternalApiUrl;
exports.internalFetch = internalFetch;
exports.internalRefresh = internalRefresh;
/**
 * Get the internal API base URL for the app to call itself.
 *
 * @throws Error in production if INTERNAL_API_URL is not set
 * @returns The base URL (no trailing slash)
 */
function getInternalApiUrl() {
    const url = process.env.INTERNAL_API_URL;
    if (url)
        return url.replace(/\/$/, ''); // strip trailing slash
    if (process.env.NODE_ENV !== 'production') {
        return 'http://localhost:3200';
    }
    throw new Error('[INTERNAL_API_URL] FATAL: INTERNAL_API_URL environment variable is REQUIRED in production. ' +
        'This is for the app to call ITSELF. MUST be HTTP (not HTTPS) due to cookie encryption. ' +
        'Set to http://service.namespace.svc.cluster.local:80');
}
/**
 * Make a fetch call to an internal API route (app calling itself).
 *
 * @param path - The API path (e.g., '/api/auth/refresh')
 * @param options - Fetch options
 * @returns The fetch result with parsed data
 *
 * @example
 * ```ts
 * // Simple GET
 * const result = await internalFetch('/api/health');
 *
 * // POST with session
 * const result = await internalFetch('/api/auth/refresh', {
 *   method: 'POST',
 *   cookie: req.headers.get('cookie') || '',
 *   sessionToken: token.redisSessionId,
 *   body: JSON.stringify({ refresh_token: refreshToken }),
 * });
 * ```
 */
async function internalFetch(path, options = {}) {
    const { headers: extraHeaders = {}, cookie, sessionToken, requestId, parseJson = true, ...fetchOptions } = options;
    const baseUrl = getInternalApiUrl();
    const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    // Build headers
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...extraHeaders,
    };
    if (cookie) {
        headers['Cookie'] = cookie;
    }
    if (sessionToken) {
        headers['X-Session-Token'] = sessionToken;
    }
    if (requestId) {
        headers['X-Request-Id'] = requestId;
    }
    const response = await fetch(url, {
        ...fetchOptions,
        headers,
    });
    let data = null;
    if (parseJson) {
        try {
            data = await response.json();
        }
        catch {
            data = null;
        }
    }
    return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
        response,
    };
}
/**
 * Trigger a token refresh via the internal API.
 * This is a convenience wrapper for the common refresh pattern.
 *
 * @param cookie - The cookie header from the incoming request
 * @param sessionToken - The session token
 * @param refreshToken - Optional refresh token to include in body
 * @param requestId - Optional request ID for tracing
 * @returns Whether the refresh was successful
 */
async function internalRefresh(cookie, sessionToken, refreshToken, requestId) {
    const result = await internalFetch('/api/auth/refresh', {
        method: 'POST',
        cookie,
        sessionToken,
        requestId,
        body: refreshToken ? JSON.stringify({ refresh_token: refreshToken }) : undefined,
    });
    return { ok: result.ok, status: result.status };
}
