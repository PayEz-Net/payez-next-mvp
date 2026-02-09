/**
 * Admin Site Logs API Handlers
 *
 * Provides admin-level access to site activity logs.
 * - GET /site-logs - Query logs from Vibe
 * - POST /site-logs - Create test log entries via Redis queue
 * - GET /site-logs/stats - Aggregated stats { total, unique_users, by_level, by_category }
 * - POST /site-logs/drain - Manual drain trigger
 * - GET /site-logs/queue - Redis queue status
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */
import { NextRequest, NextResponse } from 'next/server';
export interface SiteLogsHandlerConfig {
    getAuthOptions: () => Promise<any>;
    vibeApiUrl?: string;
    appSlug?: string;
    vibeClientId?: string;
}
/**
 * Create main site-logs handler (GET query, POST create test entries)
 */
export declare function createSiteLogsHandler(config: SiteLogsHandlerConfig): {
    GET(request: NextRequest): Promise<NextResponse<any>>;
    POST(request: NextRequest): Promise<NextResponse<unknown>>;
};
/**
 * Create site-logs stats handler
 * Returns: { total, unique_users, by_level, by_category }
 */
export declare function createSiteLogsStatsHandler(config: SiteLogsHandlerConfig): {
    GET(request: NextRequest): Promise<NextResponse<any>>;
};
/**
 * Create site-logs drain handler (manual trigger)
 */
export declare function createSiteLogsDrainHandler(config: SiteLogsHandlerConfig): {
    POST(request: NextRequest): Promise<NextResponse<any>>;
};
/**
 * Create site-logs queue status handler
 */
export declare function createSiteLogsQueueHandler(config: SiteLogsHandlerConfig): {
    GET(request: NextRequest): Promise<NextResponse<unknown>>;
};
