/**
 * Ready-to-Use Auth Route Handler (Better Auth)
 *
 * Provides a pre-configured Better Auth handler that uses dynamic OAuth providers
 * loaded from IDP at startup.
 *
 * Replaces the former NextAuth handler. The file name is kept as nextauth.ts
 * to avoid breaking re-exports in routes/auth/index.ts.
 *
 * @version 4.0.0 - Better Auth migration
 * @since better-auth-4.0
 */

import { getBetterAuthHandler } from '../../auth/better-auth';
import { NextResponse } from 'next/server';

/**
 * GET handler for auth routes
 * Delegates to Better Auth instance.
 */
export async function GET(request: Request) {
  const handler = await getBetterAuthHandler();
  if (!handler) {
    return NextResponse.json(
      { error: 'Auth handler not available' },
      { status: 503 }
    );
  }
  return handler.GET(request);
}

/**
 * POST handler for auth routes
 * Delegates to Better Auth instance.
 */
export async function POST(request: Request) {
  const handler = await getBetterAuthHandler();
  if (!handler) {
    return NextResponse.json(
      { error: 'Auth handler not available' },
      { status: 503 }
    );
  }
  return handler.POST(request);
}
