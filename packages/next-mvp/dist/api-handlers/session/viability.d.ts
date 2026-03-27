/**
 * Session Viability Check API Handler for `@payez/next-mvp`
 *
 * This API route is called by the middleware to securely check if a session is valid.
 */
import { NextRequest, NextResponse } from 'next/server';
export declare function GET(req: NextRequest): Promise<NextResponse<{
    error: string;
    message: string;
    code: string;
}> | NextResponse<{
    authenticated: boolean;
}>>;
