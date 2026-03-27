/**
 * Verify Email 2FA Code Handler
 *
 * Verifies the 2FA email verification code and completes the 2FA flow.
 * Updates the session with new tokens upon successful verification.
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
    verificationSuccessful: boolean;
    twoFactorSessionVerified: boolean;
    message: any;
}>>;
