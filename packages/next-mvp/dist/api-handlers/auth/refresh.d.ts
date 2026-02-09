/**
 * CRITICAL REFRESH TOKEN API HANDLER
 *
 * ASK BEFORE EDITING - TESTED AND WORKING SYSTEM
 *
 * This handler manages the server-side refresh token cycle with:
 * - NextAuth JWT token extraction
 * - Session token fallback for internal calls
 * - PayEz IDP refresh token exchange
 * - Session state updates with new tokens
 * - Proper error handling and logging
 * - Single-use semantics enforcement
 *
 * @version 2.0
 */
import { NextRequest, NextResponse } from 'next/server';
interface RefreshConfig {
    idpBaseUrl: string;
    clientId: string;
    nextAuthSecret: string;
    refreshEndpoint?: string;
}
/**
 * Creates a refresh token handler for Next.js API routes
 *
 * @param config Configuration for IDP connection and NextAuth
 * @returns Next.js POST handler function
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/refresh/route.ts
 * import { createRefreshHandler } from '@payez/next-mvp/api-handlers/auth/refresh';
 *
 * export const POST = createRefreshHandler({
 *   idpBaseUrl: process.env.IDP_URL!,
 *   clientId: process.env.CLIENT_ID!,
 *   nextAuthSecret: process.env.NEXTAUTH_SECRET!,
 *   refreshEndpoint: '/api/ExternalAuth/refresh'
 * });
 * ```
 */
export declare function createRefreshHandler(config: RefreshConfig): (req: NextRequest) => Promise<NextResponse<{
    error: string;
    code: string;
}> | NextResponse<{
    error: any;
    code: any;
    discardToken: boolean;
    retryable: boolean;
    resolution: any;
}> | NextResponse<{
    refreshed: boolean;
    accessTokenExpires: number;
    hasRefreshToken: boolean;
}>>;
/**
 * Default export for backward compatibility
 * Requires environment variables: IDP_URL, CLIENT_ID, NEXTAUTH_SECRET
 */
export declare const POST: (req: NextRequest) => Promise<NextResponse<{
    error: string;
    code: string;
}> | NextResponse<{
    error: any;
    code: any;
    discardToken: boolean;
    retryable: boolean;
    resolution: any;
}> | NextResponse<{
    refreshed: boolean;
    accessTokenExpires: number;
    hasRefreshToken: boolean;
}>>;
export {};
