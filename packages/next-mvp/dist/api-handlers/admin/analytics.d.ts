/**
 * Admin Analytics API Handler
 *
 * Provides admin-level analytics data using service account credentials.
 * Supports: geo stats, login stats, revenue stats, feature usage.
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */
import { NextRequest, NextResponse } from 'next/server';
export interface AdminAnalyticsHandlerConfig {
    getAuthOptions: () => Promise<any>;
}
/**
 * POST /api/admin/analytics
 * Body: { type: 'geo' | 'logins' | 'revenue' | 'features', period?: string }
 */
export declare function createAnalyticsHandler(config: AdminAnalyticsHandlerConfig): {
    POST(request: NextRequest): Promise<NextResponse<unknown>>;
};
