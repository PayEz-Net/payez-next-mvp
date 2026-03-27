/**
 * Authentication Signout API Handler
 *
 * Handles user session termination and cookie cleanup.
 * This handler is designed to be imported and used by Next.js applications
 * using the @payez/next-mvp package.
 *
 * @version 2.0
 * @requires No authentication (public endpoint)
 */
import { NextRequest, NextResponse } from 'next/server';
interface SignoutConfig {
    nextAuthSecret: string;
}
/**
 * Creates a signout handler for Next.js API routes
 *
 * @param config Configuration for NextAuth
 * @returns Next.js POST handler function
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/signout/route.ts
 * import { createSignoutHandler } from '@payez/next-mvp/api-handlers/auth/signout';
 *
 * export const POST = createSignoutHandler({
 *   nextAuthSecret: process.env.NEXTAUTH_SECRET!
 * });
 * ```
 */
export declare function createSignoutHandler(config: SignoutConfig): (req: NextRequest) => Promise<NextResponse<unknown>>;
/**
 * Default export for backward compatibility
 * Requires environment variable: NEXTAUTH_SECRET
 */
export declare const POST: (req: NextRequest) => Promise<NextResponse<unknown>>;
export {};
