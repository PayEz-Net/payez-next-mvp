/**
 * Send 2FA Verification Code Handler
 *
 * Sends a verification code via email or SMS to the authenticated user.
 * Requires a provisional Bearer token (ACR=1) from initial login.
 *
 * @package @payez/next-mvp
 */
import { NextRequest, NextResponse } from 'next/server';
export declare function POST(req: NextRequest): Promise<NextResponse<{
    success: boolean;
    error: string;
    code: string;
}> | NextResponse<{
    success: boolean;
    error: any;
    code: any;
    meta: {
        attemptedRefresh: boolean;
    };
}> | NextResponse<{
    success: boolean;
    message: string;
}>>;
