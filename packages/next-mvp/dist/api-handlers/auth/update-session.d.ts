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
/**
 * Creates an update-session handler for Next.js API routes.
 *
 * Better Auth resolves its session from cookies, so this handler takes no
 * configuration. Use the default `POST` export below for typical usage.
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/update-session/route.ts
 * export { POST } from '@payez/next-mvp/api-handlers/auth/update-session';
 * ```
 */
export declare function createUpdateSessionHandler(): (req: NextRequest) => Promise<NextResponse<unknown>>;
/**
 * Default POST export — drop-in for `app/api/auth/update-session/route.ts`.
 */
export declare const POST: (req: NextRequest) => Promise<NextResponse<unknown>>;
