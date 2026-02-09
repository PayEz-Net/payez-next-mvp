/**
 * Ready-to-Use Logout Route
 *
 * Provides a pre-configured logout handler that properly cleans up
 * sessions and revokes tokens.
 *
 * @example
 * ```typescript
 * // app/api/auth/logout/route.ts
 * export { POST } from '@payez/next-mvp/routes/auth/logout';
 * ```
 *
 * @version 2.0.0
 * @since auth-ready-v2
 */
import { NextRequest, NextResponse } from 'next/server';
/**
 * POST /api/auth/logout - Sign out and clean up session
 *
 * Performs complete logout:
 * 1. Revokes tokens at IDP (if refresh token available)
 * 2. Deletes session from store
 * 3. Clears NextAuth session cookie
 */
export declare function POST(req: NextRequest): Promise<NextResponse<{
    success: boolean;
    message: string;
}> | NextResponse<{
    error: string;
    details: string;
}>>;
