/**
 * Admin Redis Sessions API Handler
 *
 * Provides admin-level access to active sessions stored in Redis.
 * Reads directly from Redis {APP_SLUG}:sess:* pattern.
 *
 * Note: This is different from sessions.ts which queries Vibe login_sessions table.
 * This handler shows real-time active sessions in Redis.
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */
import { NextRequest, NextResponse } from 'next/server';
export interface RedisSessionsHandlerConfig {
    appSlug?: string;
}
/**
 * Create Redis sessions handler
 * GET /api/admin/redis-sessions - List all active sessions from Redis
 */
export declare function createRedisSessionsHandler(config: RedisSessionsHandlerConfig): {
    GET(request: NextRequest): Promise<NextResponse<unknown>>;
    DELETE(request: NextRequest): Promise<NextResponse<unknown>>;
};
/**
 * Create Redis session revoke handler for specific session
 * POST /api/admin/redis-sessions/[sessionId]/revoke
 */
export declare function createRedisSessionRevokeHandler(config: RedisSessionsHandlerConfig): {
    POST(request: NextRequest, { params }: {
        params: {
            sessionId: string;
        };
    }): Promise<NextResponse<unknown>>;
};
