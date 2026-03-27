import { NextRequest, NextResponse } from 'next/server';
interface ValidatePasswordResponse {
    is_valid: boolean;
    score: number;
    failed_requirements: string[];
    tip?: string;
    policy?: {
        min_length?: number;
        require_uppercase?: boolean;
        require_lowercase?: boolean;
        require_digit?: boolean;
        require_special?: boolean;
        min_strength_score?: number;
    };
}
export declare function POST(req: NextRequest): Promise<NextResponse<ValidatePasswordResponse>>;
export {};
