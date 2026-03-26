/**
 * Server-Side Auth Wrapper for API Routes & Server Actions
 *
 * Wraps route handlers with session validation. Uses direct Redis reads.
 * Zero HTTP self-fetches.
 *
 * Usage:
 *   export const GET = withAuth(async (req, auth) => {
 *     return NextResponse.json({ userId: auth.userId });
 *   });
 *
 *   // With role requirement:
 *   export const POST = withAuth(async (req, auth) => { ... }, { requiredRoles: ['admin'] });
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { decodeSession } from './decode-session';
import type { SessionData } from '../lib/session-store';

// =============================================================================
// TYPES
// =============================================================================

export interface ApiAuthResult {
  userId: string;
  email: string;
  roles: string[];
  sessionData: SessionData;
  accessToken?: string;
}

export interface WithAuthOptions {
  /** Roles required to access the route (any match = allowed) */
  requiredRoles?: string[];
}

// =============================================================================
// MAIN
// =============================================================================

/**
 * Wrap an API route handler with auth validation.
 * Returns 401 if not authenticated, 403 if missing required roles.
 */
export function withAuth(
  handler: (req: NextRequest, auth: ApiAuthResult) => Promise<NextResponse>,
  options?: WithAuthOptions
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Decode session from request cookies (direct Redis, no self-fetch)
      const decoded = await decodeSession(req.cookies);

      if (!decoded) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'No valid session' },
          { status: 401 }
        );
      }

      const { sessionData } = decoded;

      // Check required roles
      if (options?.requiredRoles && options.requiredRoles.length > 0) {
        const userRoles = sessionData.roles || [];
        const hasRole = options.requiredRoles.some(r => userRoles.includes(r));
        if (!hasRole) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      const auth: ApiAuthResult = {
        userId: sessionData.userId,
        email: sessionData.email,
        roles: sessionData.roles || [],
        sessionData,
        accessToken: sessionData.idpAccessToken,
      };

      return handler(req, auth);
    } catch (error) {
      console.error('[WITH-AUTH] Error:', error instanceof Error ? error.message : String(error));
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Auth check failed' },
        { status: 500 }
      );
    }
  };
}
