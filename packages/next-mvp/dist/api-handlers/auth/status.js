"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const jwt_1 = require("next-auth/jwt");
const nextauth_secret_1 = require("../../lib/nextauth-secret");
const session_store_1 = require("../../lib/session-store");
const app_slug_1 = require("../../lib/app-slug");
async function GET(req) {
    try {
        let token = await (0, jwt_1.getToken)({ req, secret: await (0, nextauth_secret_1.resolveNextAuthSecret)(), cookieName: (0, app_slug_1.getJwtCookieName)() });
        // Support both field names: sessionToken (auth.ts JWT) and redisSessionId (legacy)
        const sessionToken = token?.sessionToken || token?.redisSessionId;
        if (!sessionToken) {
            return server_1.NextResponse.json({ success: false, error: 'No session token' }, { status: 401 });
        }
        const sessionModel = await (0, session_store_1.getSession)(sessionToken);
        if (!sessionModel) {
            return server_1.NextResponse.json({ success: false, error: 'Session missing in Redis' }, { status: 401 });
        }
        return server_1.NextResponse.json({ success: true, userId: sessionModel.userId || null });
    }
    catch (err) {
        return server_1.NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}
