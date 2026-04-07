/**
 * Enhanced Auth Handler with Coordinated Token Refresh
 *
 * Provides a middleware wrapper that automatically handles token lifecycle:
 * - Checks token expiry before each request
 * - Automatically refreshes expired or near-expired tokens
 * - Uses Redis locks for coordinated refresh (prevents race conditions)
 * - Retries requests on 401 responses with fresh tokens
 *
 * Pattern ported from website-membership simple-api-handler.ts
 *
 * @version 2.1.0
 * @since auth-ready-v2
 */
import { NextRequest, NextResponse } from 'next/server';
export interface AuthContext {
    token: any;
    accessToken: string;
    userId: string;
    sessionToken: string;
    refreshToken?: string;
}
export interface AuthHandlerOptions {
    /** Whether authentication is required for this route (default: true) */
    requireAuth?: boolean;
    /** Automatically refresh expired or near-expired tokens (default: true) */
    autoRefresh?: boolean;
    /** Buffer time in seconds before token expiry to trigger refresh (default: 300 = 5 minutes) */
    refreshBuffer?: number;
    /** Retry request on 401 response after refreshing token (default: true) */
    retryOn401?: boolean;
    /** Maximum number of retry attempts on 401 (default: 1) */
    maxRetries?: number;
    /** IDP base URL for refresh requests */
    idpBaseUrl?: string;
    /** OAuth client ID */
    clientId?: string;
}
export type HandlerFunction = (req: NextRequest, context: any, auth: AuthContext) => Promise<NextResponse | Response>;
/**
 * Creates an auth-aware handler with automatic token refresh
 *
 * @example
 * ```typescript
 * import { createAuthHandler } from '@payez/next-mvp/api';
 *
 * const handler = createAuthHandler({ requireAuth: true });
 *
 * export const GET = handler.handle(async (req, context, auth) => {
 *   // auth.accessToken is guaranteed to be fresh
 *   const response = await fetch('https://api.example.com/data', {
 *     headers: { 'Authorization': `Bearer ${auth.accessToken}` }
 *   });
 *   return NextResponse.json(await response.json());
 * });
 * ```
 */
export declare function createAuthHandler(options?: AuthHandlerOptions): {
    handle: (handler: HandlerFunction) => (req: NextRequest, context?: any) => Promise<Response>;
};
/**
 * Default export for convenience
 */
export default createAuthHandler;
