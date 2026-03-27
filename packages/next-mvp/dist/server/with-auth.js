"use strict";
/**
 * Server-Side Auth Wrapper for API Routes & Server Actions
 *
 * Wraps route handlers with session validation. Uses direct Redis reads.
 * Zero HTTP self-fetches.
 *
 * Usage:
 *   export const GET = withAuth(async (req, auth) => {
 *     return NextResponse.json({ userId: auth.userId });
 *   });
 *
 *   // With role requirement:
 *   export const POST = withAuth(async (req, auth) => { ... }, { requiredRoles: ['admin'] });
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAuth = withAuth;
require("server-only");
const server_1 = require("next/server");
const decode_session_1 = require("./decode-session");
// =============================================================================
// MAIN
// =============================================================================
/**
 * Wrap an API route handler with auth validation.
 * Returns 401 if not authenticated, 403 if missing required roles.
 */
function withAuth(handler, options) {
    return async (req) => {
        try {
            // Decode session from request cookies (direct Redis, no self-fetch)
            const decoded = await (0, decode_session_1.decodeSession)(req.cookies);
            if (!decoded) {
                return server_1.NextResponse.json({ error: 'Unauthorized', message: 'No valid session' }, { status: 401 });
            }
            const { sessionData } = decoded;
            // Check required roles
            if (options?.requiredRoles && options.requiredRoles.length > 0) {
                const userRoles = sessionData.roles || [];
                const hasRole = options.requiredRoles.some(r => userRoles.includes(r));
                if (!hasRole) {
                    return server_1.NextResponse.json({ error: 'Forbidden', message: 'Insufficient permissions' }, { status: 403 });
                }
            }
            const auth = {
                userId: sessionData.userId,
                email: sessionData.email,
                roles: sessionData.roles || [],
                sessionData,
                accessToken: sessionData.idpAccessToken,
            };
            return handler(req, auth);
        }
        catch (error) {
            console.error('[WITH-AUTH] Error:', error instanceof Error ? error.message : String(error));
            return server_1.NextResponse.json({ error: 'Internal Server Error', message: 'Auth check failed' }, { status: 500 });
        }
    };
}
