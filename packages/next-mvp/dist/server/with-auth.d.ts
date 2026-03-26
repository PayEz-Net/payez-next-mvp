/**
 * Server-Side Auth Wrapper for API Routes & Server Actions
 *
 * Wraps route handlers with session validation. Uses direct Redis reads.
 * Zero HTTP self-fetches.
 *
 * Usage:
 *   export const GET = withAuth(async (req, auth) => {
 *     return NextResponse.json({ userId: auth.userId });
 *   });
 *
 *   // With role requirement:
 *   export const POST = withAuth(async (req, auth) => { ... }, { requiredRoles: ['admin'] });
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import type { SessionData } from '../lib/session-store';
export interface ApiAuthResult {
    userId: string;
    email: string;
    roles: string[];
    sessionData: SessionData;
    accessToken?: string;
}
export interface WithAuthOptions {
    /** Roles required to access the route (any match = allowed) */
    requiredRoles?: string[];
}
/**
 * Wrap an API route handler with auth validation.
 * Returns 401 if not authenticated, 403 if missing required roles.
 */
export declare function withAuth(handler: (req: NextRequest, auth: ApiAuthResult) => Promise<NextResponse>, options?: WithAuthOptions): (req: NextRequest) => Promise<NextResponse>;
