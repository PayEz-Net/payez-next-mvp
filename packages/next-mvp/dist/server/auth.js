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
