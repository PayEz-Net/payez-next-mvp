import { NextRequest, NextResponse } from 'next/server';
/**
 * Update Phone Number API Handler
 *
 * PATCH /api/account/update-phone - Update user's phone number
 * Used for 2FA setup - users need to add a phone to enable SMS verification.
 */
export declare function POST(req: NextRequest): Promise<NextResponse<{
    success: boolean;
    error: {
        code: string;
        message: string;
    };
}> | NextResponse<{
    success: boolean;
    error: {
        code: any;
        message: any;
    };
    meta: {
        attemptedRefresh: boolean;
    };
}> | NextResponse<{
    success: boolean;
    message: string;
    data: any;
}>>;
