/**
 * Admin Users API Handler
 *
 * Provides admin-level access to users using service account credentials.
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */
import { NextRequest, NextResponse } from 'next/server';
export interface AdminUsersHandlerConfig {
    getAuthOptions: () => Promise<any>;
}
/**
 * GET /api/admin/users - List users
 * POST /api/admin/users - Stats, search, update tier
 */
export declare function createUsersHandler(config: AdminUsersHandlerConfig): {
    GET(request: NextRequest): Promise<NextResponse<unknown>>;
    POST(request: NextRequest): Promise<NextResponse<unknown>>;
};
