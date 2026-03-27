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
interface VerifyCodeConfig {
    nextAuthSecret?: string;
}
/**
 * Creates a verify-code/complete-2FA handler for Next.js API routes
 *
 * @param config Configuration for NextAuth
 * @returns Next.js POST handler function
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/verify-code/route.ts
 * import { createVerifyCodeHandler } from '@payez/next-mvp/api-handlers/auth/verify-code';
 *
 * export const POST = createVerifyCodeHandler({
 *   nextAuthSecret: process.env.NEXTAUTH_SECRET!
 * });
 * ```
 */
export declare function createVerifyCodeHandler(config: VerifyCodeConfig): (req: NextRequest) => Promise<NextResponse<{
    success: boolean;
    message: string;
}>>;
/**
 * Default export for backward compatibility
 * Requires environment variable: NEXTAUTH_SECRET
 */
export declare const POST: (req: NextRequest) => Promise<NextResponse<{
    success: boolean;
    message: string;
}>>;
export {};
