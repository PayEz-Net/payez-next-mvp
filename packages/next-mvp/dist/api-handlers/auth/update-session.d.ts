/**
 * Authentication Update Session API Handler
 *
 * Handles session updates, particularly for 2FA status changes.
 * This handler is designed to be imported and used by Next.js applications
 * using the @payez/next-mvp package.
 *
 * @version 2.0
 * @requires Authentication (authenticated endpoint)
 */
import { NextRequest, NextResponse } from 'next/server';
interface UpdateSessionConfig {
    nextAuthSecret?: string;
}
/**
 * Creates an update-session handler for Next.js API routes
 *
 * @param config Configuration for NextAuth
 * @returns Next.js POST handler function
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/update-session/route.ts
 * import { createUpdateSessionHandler } from '@payez/next-mvp/api-handlers/auth/update-session';
 *
 * export const POST = createUpdateSessionHandler({
 *   nextAuthSecret: process.env.NEXTAUTH_SECRET!
 * });
 * ```
 */
export declare function createUpdateSessionHandler(config: UpdateSessionConfig): (req: NextRequest) => Promise<NextResponse<unknown>>;
/**
 * Default export for backward compatibility
 * Requires environment variable: NEXTAUTH_SECRET
 */
export declare const POST: (req: NextRequest) => Promise<NextResponse<unknown>>;
export {};
