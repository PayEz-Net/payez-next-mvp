/**
 * Ready-to-Use Session Viability Route
 *
 * Checks if the current session is viable (valid and not expired).
 * Used by client-side code to determine if a refresh is needed.
 *
 * @example
 * ```typescript
 * // app/api/session/viability/route.ts
 * export { GET } from '@payez/next-mvp/routes/auth/viability';
 * ```
 *
 * @version 2.0.0
 * @since auth-ready-v2
 */
import { NextRequest, NextResponse } from 'next/server';
/**
 * GET /api/session/viability - Check if session is viable
 *
 * Returns:
 * - viable: boolean - Whether the session can be used
 * - needsRefresh: boolean - Whether a refresh is recommended
 * - expiresIn: number - Seconds until token expires
 */
export declare function GET(req: NextRequest): Promise<NextResponse<{
    viable: boolean;
    needsRefresh: boolean;
    authenticated: boolean;
    reason: string;
}> | NextResponse<{
    viable: boolean;
    needsRefresh: boolean;
    expiresIn: number;
    hasRefreshToken: boolean;
    authenticated: boolean;
    sessionToken: any;
    tenantRequiresTwoFactor: boolean;
    userHasCompletedTenantTwoFactorRequirements: any;
    userStillNeedsTwoFactor: boolean;
    requires2FA: boolean;
    twoFactorComplete: any;
    accessTokenExpired: boolean;
    expiresAt: string;
    roles: string[];
    clientId: string;
}> | NextResponse<{
    viable: boolean;
    needsRefresh: boolean;
    authenticated: boolean;
    error: string;
    details: string;
}>>;
