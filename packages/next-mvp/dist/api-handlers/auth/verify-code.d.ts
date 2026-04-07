/**
 * Authentication Verify Code / Complete 2FA API Handler
 *
 * Handles 2FA verification and token updates after successful verification.
 * This handler is designed to be imported and used by Next.js applications
 * using the @payez/next-mvp package.
 *
 * @version 2.0
 * @requires Authentication (authenticated endpoint)
 */
import { NextRequest, NextResponse } from 'next/server';
/**
 * Creates a verify-code/complete-2FA handler for Next.js API routes.
 *
 * Better Auth resolves its session from cookies, so this handler takes no
 * configuration. Use the default `POST` export below for typical usage.
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/verify-code/route.ts
 * export { POST } from '@payez/next-mvp/api-handlers/auth/verify-code';
 * ```
 */
export declare function createVerifyCodeHandler(): (req: NextRequest) => Promise<NextResponse<{
    success: boolean;
    message: string;
}>>;
/**
 * Default POST export — drop-in for `app/api/auth/verify-code/route.ts`.
 */
export declare const POST: (req: NextRequest) => Promise<NextResponse<{
    success: boolean;
    message: string;
}>>;
