/**
 * Slim Middleware — Cookie-Only Auth Check
 *
 * Replaces the self-fetching middleware with a cookie existence check.
 * All real auth validation happens in server-side layouts (authGuard).
 *
 * Zero self-fetches. Zero Redis calls. Zero JWT decoding.
 * Just: does the session cookie exist? Yes → pass through. No → redirect to login.
 */
import { NextRequest, NextResponse } from 'next/server';
export interface SlimMiddlewareOptions {
    /** Routes that don't require authentication (glob-style patterns) */
    publicRoutes?: string[];
    /** Login page URL (default: /account-auth/login) */
    loginUrl?: string;
    /** Additional paths to always bypass (e.g., /api/auth/, /api/session/) */
    bypassPrefixes?: string[];
}
/**
 * Create a slim middleware that only checks cookie existence.
 * Auth validation is deferred to server-side layouts (authGuard).
 */
export declare function createSlimMiddleware(options?: SlimMiddlewareOptions): (request: NextRequest) => NextResponse;
