import { NextRequest, NextResponse } from 'next/server';
/**
 * Force-expire access token for testing refresh flow.
 *
 * Sets the access token expiry to 2 minutes in the past,
 * which will trigger a refresh on the next API call.
 *
 * Usage in consuming app:
 * ```typescript
 * // app/api/test/force-expire/route.ts
 * export { POST } from '@payez/next-mvp/api-handlers/test/force-expire';
 * ```
 */
export declare const POST: (req: NextRequest) => Promise<NextResponse<{
    success: boolean;
    error: string;
}> | NextResponse<{
    success: boolean;
    previous: number | null;
    previousIso: string | null;
    newExpiry: number;
    newExpiryIso: string;
}>>;
