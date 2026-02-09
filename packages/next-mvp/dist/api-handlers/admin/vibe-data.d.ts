/**
 * Admin Vibe Data API Handler
 *
 * Provides admin-level access to Vibe data using service account credentials.
 * Bypasses user-level filtering to allow admins to view all records.
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */
import { NextRequest, NextResponse } from 'next/server';
export interface AdminVibeHandlerConfig {
    getAuthOptions: () => Promise<any>;
}
/**
 * GET /api/admin/vibe/collections
 * List all Vibe collections
 */
export declare function createGetCollectionsHandler(config: AdminVibeHandlerConfig): (request: NextRequest) => Promise<NextResponse<any>>;
/**
 * GET /api/admin/vibe/collections/[collection]/tables
 * List tables in a collection
 */
export declare function createGetTablesHandler(config: AdminVibeHandlerConfig): (request: NextRequest, { params }: {
    params: Promise<{
        collection: string;
    }>;
}) => Promise<NextResponse<any>>;
/**
 * GET /api/admin/vibe/data/[collection]/[table]
 * Fetch all records from a table (admin - no user filtering)
 */
export declare function createGetTableDataHandler(config: AdminVibeHandlerConfig): (request: NextRequest, { params }: {
    params: Promise<{
        collection: string;
        table: string;
    }>;
}) => Promise<NextResponse<any>>;
/**
 * GET /api/admin/vibe/data/[collection]/[table]/[id]
 * Fetch single record (admin access)
 */
export declare function createGetRecordHandler(config: AdminVibeHandlerConfig): (request: NextRequest, { params }: {
    params: Promise<{
        collection: string;
        table: string;
        id: string;
    }>;
}) => Promise<NextResponse<any>>;
/**
 * PUT /api/admin/vibe/data/[collection]/[table]/[id]
 * Update record (admin access)
 */
export declare function createUpdateRecordHandler(config: AdminVibeHandlerConfig): (request: NextRequest, { params }: {
    params: Promise<{
        collection: string;
        table: string;
        id: string;
    }>;
}) => Promise<NextResponse<any>>;
/**
 * DELETE /api/admin/vibe/data/[collection]/[table]/[id]
 * Delete record (admin access)
 */
export declare function createDeleteRecordHandler(config: AdminVibeHandlerConfig): (request: NextRequest, { params }: {
    params: Promise<{
        collection: string;
        table: string;
        id: string;
    }>;
}) => Promise<NextResponse<unknown>>;
/**
 * POST /api/admin/vibe/data/[collection]/[table]/query
 * Query records with filters (admin access)
 */
export declare function createQueryHandler(config: AdminVibeHandlerConfig): (request: NextRequest, { params }: {
    params: Promise<{
        collection: string;
        table: string;
    }>;
}) => Promise<NextResponse<any>>;
