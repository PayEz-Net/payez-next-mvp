/**
 * Admin Stats API Handler
 *
 * Aggregates dashboard statistics from users, Redis sessions, and audit logs.
 * Uses service account HMAC auth for Vibe API requests.
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */
import { NextRequest, NextResponse } from 'next/server';
export interface AdminStatsHandlerConfig {
    getAuthOptions: () => Promise<any>;
    appSlug?: string;
}
/**
 * GET /api/admin/stats - Dashboard statistics
 * Aggregates users + tier breakdown, active Redis sessions, and recent audit activity.
 */
export declare function createStatsHandler(config: AdminStatsHandlerConfig): {
    GET(_request: NextRequest): Promise<NextResponse<unknown>>;
};
