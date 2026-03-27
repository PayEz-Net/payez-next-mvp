/**
 * Token Lifecycle Management for @payez/next-mvp
 *
 * Ensures tokens are fresh before making API calls.
 * Checks expiration and triggers refresh if needed.
 *
 * Pattern: Check first, refresh if needed, fail gracefully if refresh fails.
 *
 * HANDLES CONCURRENT REFRESH: When multiple API calls arrive simultaneously
 * with expired tokens, only one will actually perform the refresh. Others
 * receive 409 (conflict) and wait for the refresh to complete, then use
 * the freshly refreshed tokens.
 *
 * REQUIRED: Your app must expose the refresh route:
 * ```typescript
 * // app/api/auth/refresh/route.ts
 * export { POST } from '@payez/next-mvp/routes/auth/refresh';
 * ```
 *
 * @version 2.0.0
 */
import { NextRequest } from 'next/server';
import { SessionData } from './session-store';
export interface TokenResult {
    success: true;
    accessToken: string;
    sessionData: SessionData;
}
export interface TokenError {
    success: false;
    error: 'NO_SESSION' | 'NO_TOKEN' | 'EXPIRED' | 'REFRESH_FAILED' | 'SESSION_EXPIRED_NO_REFRESH';
    message: string;
    terminal?: boolean;
}
export type EnsureFreshTokenResult = TokenResult | TokenError;
/**
 * Ensures we have a fresh access token before making API calls.
 *
 * This utility checks token expiration and triggers a refresh if needed,
 * preventing 401 errors from expired tokens being sent to downstream APIs.
 *
 * @param request - The incoming NextRequest
 * @returns TokenResult with accessToken and sessionData, or TokenError
 *
 * @example
 * ```typescript
 * import { ensureFreshToken } from '@payez/next-mvp/lib/token-lifecycle';
 *
 * export async function GET(request: NextRequest) {
 *   const tokenResult = await ensureFreshToken(request);
 *   if (!tokenResult.success) {
 *     return NextResponse.json({ error: tokenResult.error }, { status: 401 });
 *   }
 *
 *   // Use tokenResult.accessToken for downstream API calls
 *   const response = await fetch('https://api.example.com/data', {
 *     headers: { 'Authorization': `Bearer ${tokenResult.accessToken}` }
 *   });
 * }
 * ```
 */
export declare function ensureFreshToken(request: NextRequest): Promise<EnsureFreshTokenResult>;
/**
 * Get authorization header from fresh token.
 * Convenience wrapper for API routes.
 *
 * @param request - The incoming NextRequest
 * @returns Authorization header string or null if token unavailable
 *
 * @example
 * ```typescript
 * const authHeader = await getFreshAuthHeader(request);
 * if (!authHeader) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 */
export declare function getFreshAuthHeader(request: NextRequest): Promise<string | null>;
