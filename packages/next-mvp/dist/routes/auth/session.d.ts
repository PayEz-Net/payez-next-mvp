/**
 * Ready-to-Use Session Management Route
 *
 * Provides pre-configured session handlers for checking and updating session state.
 *
 * @example
 * ```typescript
 * // app/api/auth/session/route.ts
 * export { GET, POST } from '@payez/next-mvp/routes/auth/session';
 * ```
 *
 * @version 2.0.0
 * @since auth-ready-v2
 */
import { NextRequest, NextResponse } from 'next/server';
/**
 * GET /api/auth/session - Check current session status
 *
 * Returns the current session information including:
 * - User details
 * - Token expiry status
 * - Session validity
 */
export declare function GET(req: NextRequest): Promise<NextResponse<{
    authenticated: boolean;
    message: string;
}> | NextResponse<{
    user: {
        id: string | undefined;
        email: string | null | undefined;
        name: string | null | undefined;
        image: any;
        roles: string[];
        twoFactorSessionVerified: boolean;
        requiresTwoFactor: boolean;
        authenticationMethods: string[] | undefined;
        authenticationLevel: string | undefined;
        mfaCompletedAt: number | undefined;
        mfaExpiresAt: number | undefined;
        mfaValidityHours: number | undefined;
        oauthProvider: string | undefined;
        idpClientId: string | undefined;
        merchantId: string | undefined;
    };
    sessionToken: any;
    accessToken: string | undefined;
    refreshToken: string | undefined;
    accessTokenExpires: number | undefined;
    expires: string;
}> | NextResponse<{
    error: string;
    details: string;
}>>;
/**
 * POST /api/auth/session - Update session data
 *
 * Allows updating session metadata (not tokens).
 * Token refresh should use the /api/auth/refresh endpoint.
 *
 * Body:
 * - metadata: object - Custom metadata to store in session
 */
export declare function POST(req: NextRequest): Promise<NextResponse<{
    error: string;
    code: string;
}> | NextResponse<{
    success: boolean;
    message: string;
}> | NextResponse<{
    error: string;
    details: string;
}>>;
