export interface RateLimitRule {
    endpoint: string;
    period: string;
    limit: number;
}
export interface RateLimitResult {
    isAllowed: boolean;
    requestCount: number;
    limit: number;
    retryAfterSeconds?: number;
    failedAttempts?: number;
}
export declare function createPayEzRateLimitResponse(retryAfterSeconds: number, remainingAttempts?: number): {
    success: boolean;
    message: string;
    user_info: null;
    errors: {
        code: string;
        message: string;
        resolution: string;
        remainingAttempts: number;
    }[];
};
