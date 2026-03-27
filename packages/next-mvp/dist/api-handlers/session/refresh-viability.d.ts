import { NextRequest, NextResponse } from 'next/server';
export declare function GET(req: NextRequest): Promise<NextResponse<{
    canRefresh: boolean;
    reason: string;
    sessionToken: null;
}> | NextResponse<{
    canRefresh: boolean;
    reason: string;
    sessionToken: string;
}> | NextResponse<{
    canRefresh: boolean;
    reason: string;
    error: string;
}>>;
