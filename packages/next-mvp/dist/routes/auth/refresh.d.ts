/**
 * Ready-to-Use Refresh Token Route
 *
 * Provides a pre-configured refresh handler that can be imported directly
 * into your app's API routes with zero configuration.
 *
 * @example
 * ```typescript
 * // app/api/auth/refresh/route.ts
 * export { POST } from '@payez/next-mvp/routes/auth/refresh';
 * ```
 *
 * @version 2.0.0
 * @since auth-ready-v2
 */
import { NextRequest } from 'next/server';
export declare function POST(req: NextRequest): Promise<import("next/server").NextResponse<{
    error: string;
    code: string;
}> | import("next/server").NextResponse<{
    error: any;
    code: any;
    discardToken: boolean;
    retryable: boolean;
    resolution: any;
}> | import("next/server").NextResponse<{
    refreshed: boolean;
    accessTokenExpires: number;
    hasRefreshToken: boolean;
}>>;
