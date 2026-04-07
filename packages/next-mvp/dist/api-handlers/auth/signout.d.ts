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
/**
 * Creates a signout handler for Next.js API routes.
 *
 * Better Auth resolves its session from cookies, so this handler takes no
 * configuration. Use the default `POST` export below for typical usage.
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/signout/route.ts
 * export { POST } from '@payez/next-mvp/api-handlers/auth/signout';
 * ```
 */
export declare function createSignoutHandler(): (req: NextRequest) => Promise<NextResponse<unknown>>;
/**
 * Default POST export — drop-in for `app/api/auth/signout/route.ts`.
 */
export declare const POST: (req: NextRequest) => Promise<NextResponse<unknown>>;
