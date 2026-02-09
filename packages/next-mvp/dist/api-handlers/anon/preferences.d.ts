/**
 * Anonymous Session Preferences API Handler
 *
 * GET /api/anon/preferences - Get current preferences
 * POST /api/anon/preferences - Update preferences
 *
 * Sets a cookie to track anonymous visitors and stores preferences in Redis.
 */
import { NextRequest, NextResponse } from 'next/server';
import { AnonSessionPreferences } from '../../lib/anon-session';
/**
 * GET handler - retrieves anonymous session preferences
 */
export declare function GET(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    data: {
        id: string;
        preferences: AnonSessionPreferences;
        metrics: import("../../lib/anon-session").AnonSessionMetrics;
    };
}> | NextResponse<{
    success: boolean;
    error: string;
}>>;
/**
 * POST handler - updates anonymous session preferences
 */
export declare function POST(request: NextRequest): Promise<NextResponse<{
    success: boolean;
    error: string;
}> | NextResponse<{
    success: boolean;
    data: {
        id: string;
        preferences: AnonSessionPreferences;
    };
}>>;
