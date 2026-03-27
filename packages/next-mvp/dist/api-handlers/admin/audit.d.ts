/**
 * Admin Audit Logs API Handler
 *
 * Provides admin-level access to audit logs using service account credentials.
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */
import { NextRequest, NextResponse } from 'next/server';
export interface AdminAuditHandlerConfig {
}
/**
 * GET /api/admin/audit - List audit logs
 * POST /api/admin/audit - Stats
 */
export declare function createAuditHandler(config: AdminAuditHandlerConfig): {
    GET(request: NextRequest): Promise<NextResponse<unknown>>;
    POST(request: NextRequest): Promise<NextResponse<unknown>>;
};
