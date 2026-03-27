"use strict";
/**
 * Ready-to-Use Auth Route Handler (Better Auth)
 *
 * Provides a pre-configured Better Auth handler that uses dynamic OAuth providers
 * loaded from IDP at startup.
 *
 * Replaces the former NextAuth handler. The file name is kept as nextauth.ts
 * to avoid breaking re-exports in routes/auth/index.ts.
 *
 * @version 4.0.0 - Better Auth migration
 * @since better-auth-4.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const better_auth_1 = require("../../auth/better-auth");
const server_1 = require("next/server");
/**
 * GET handler for auth routes
 * Delegates to Better Auth instance.
 */
async function GET(request) {
    const handler = await (0, better_auth_1.getBetterAuthHandler)();
    if (!handler) {
        return server_1.NextResponse.json({ error: 'Auth handler not available' }, { status: 503 });
    }
    return handler.GET(request);
}
/**
 * POST handler for auth routes
 * Delegates to Better Auth instance.
 */
async function POST(request) {
    const handler = await (0, better_auth_1.getBetterAuthHandler)();
    if (!handler) {
        return server_1.NextResponse.json({ error: 'Auth handler not available' }, { status: 503 });
    }
    return handler.POST(request);
}
