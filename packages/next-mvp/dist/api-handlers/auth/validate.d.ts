import { NextRequest, NextResponse } from 'next/server';
/**
 * Validates current access token with the IDP and returns normalized info.
 * Sources access token from Authorization header or Redis session via cookie.
 */
export declare function GET(req: NextRequest): Promise<NextResponse<any>>;
