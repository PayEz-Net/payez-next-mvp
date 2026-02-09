"use strict";
/**
 * Anonymous Session Preferences API Handler
 *
 * GET /api/anon/preferences - Get current preferences
 * POST /api/anon/preferences - Update preferences
 *
 * Sets a cookie to track anonymous visitors and stores preferences in Redis.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const headers_1 = require("next/headers");
const anon_session_1 = require("../../lib/anon-session");
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds
/**
 * GET handler - retrieves anonymous session preferences
 */
async function GET(request) {
    try {
        const cookieStore = await (0, headers_1.cookies)();
        let anonId = cookieStore.get(anon_session_1.ANON_COOKIE_NAME)?.value;
        // Get or create session
        const session = await (0, anon_session_1.getOrCreateAnonSession)(anonId);
        // Build response
        const response = server_1.NextResponse.json({
            success: true,
            data: {
                id: session.id,
                preferences: session.preferences,
                metrics: session.metrics,
            },
        });
        // Set cookie if it's a new session
        if (!anonId || anonId !== session.id) {
            response.cookies.set(anon_session_1.ANON_COOKIE_NAME, session.id, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: COOKIE_MAX_AGE,
                path: '/',
            });
        }
        return response;
    }
    catch (error) {
        console.error('[ANON-PREFERENCES] GET error:', error);
        return server_1.NextResponse.json({ success: false, error: 'Failed to get preferences' }, { status: 500 });
    }
}
/**
 * POST handler - updates anonymous session preferences
 */
async function POST(request) {
    try {
        const cookieStore = await (0, headers_1.cookies)();
        let anonId = cookieStore.get(anon_session_1.ANON_COOKIE_NAME)?.value;
        // Get or create session first
        const session = await (0, anon_session_1.getOrCreateAnonSession)(anonId);
        anonId = session.id;
        // Parse body for preferences to update
        const body = await request.json();
        const preferences = body.preferences || body;
        // Validate preferences
        if (typeof preferences !== 'object') {
            return server_1.NextResponse.json({ success: false, error: 'Invalid preferences format' }, { status: 400 });
        }
        // Update preferences
        const updatedSession = await (0, anon_session_1.updateAnonPreferences)(anonId, preferences);
        if (!updatedSession) {
            return server_1.NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
        }
        // Build response
        const response = server_1.NextResponse.json({
            success: true,
            data: {
                id: updatedSession.id,
                preferences: updatedSession.preferences,
            },
        });
        // Ensure cookie is set
        response.cookies.set(anon_session_1.ANON_COOKIE_NAME, anonId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
            path: '/',
        });
        return response;
    }
    catch (error) {
        console.error('[ANON-PREFERENCES] POST error:', error);
        return server_1.NextResponse.json({ success: false, error: 'Failed to update preferences' }, { status: 500 });
    }
}
