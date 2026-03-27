"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const auth_1 = require("../../server/auth");
const session_store_1 = require("../../lib/session-store");
async function GET(req) {
    try {
        const betterAuthSession = await (0, auth_1.getSession)(req);
        const sessionToken = betterAuthSession?.session?.token;
        if (!sessionToken) {
            return server_1.NextResponse.json({ success: false, error: 'No session token' }, { status: 401 });
        }
        const sessionModel = await (0, session_store_1.getSession)(sessionToken);
        if (!sessionModel) {
            return server_1.NextResponse.json({ success: false, error: 'Session missing in Redis' }, { status: 401 });
        }
        return server_1.NextResponse.json({ success: true, userId: betterAuthSession?.user?.id || sessionModel.userId || null });
    }
    catch (err) {
        return server_1.NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}
