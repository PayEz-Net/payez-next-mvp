/**
 * Admin Sessions API Handler
 *
 * Provides admin-level access to login sessions using service account credentials.
 * Used by SessionsTab component.
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */
import { NextRequest, NextResponse } from 'next/server';
export interface AdminSessionsHandlerConfig {
    getAuthOptions: () => Promise<any>;
}
/**
 * GET /api/admin/sessions - List sessions
 * POST /api/admin/sessions - Stats, revoke actions
 */
export declare function createSessionsHandler(config: AdminSessionsHandlerConfig): {
    GET(request: NextRequest): Promise<NextResponse<unknown>>;
    POST(request: NextRequest): Promise<NextResponse<unknown>>;
};
