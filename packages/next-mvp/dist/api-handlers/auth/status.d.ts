import { NextRequest, NextResponse } from 'next/server';
export declare function GET(req: NextRequest): Promise<NextResponse<{
    success: boolean;
    error: string;
}> | NextResponse<{
    success: boolean;
    userId: any;
}>>;
