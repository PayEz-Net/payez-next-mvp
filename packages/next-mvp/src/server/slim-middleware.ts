/**
 * Slim Middleware — Cookie-Only Auth Check
 *
 * Replaces the self-fetching middleware with a cookie existence check.
 * All real auth validation happens in server-side layouts (authGuard).
 *
 * Zero self-fetches. Zero Redis calls. Zero JWT decoding.
 * Just: does the session cookie exist? Yes → pass through. No → redirect to login.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieName, getSecureSessionCookieName } from '../lib/app-slug';

// =============================================================================
// TYPES
// =============================================================================

export interface SlimMiddlewareOptions {
  /** Routes that don't require authentication (glob-style patterns) */
  publicRoutes?: string[];
  /** Login page URL (default: /account-auth/login) */
  loginUrl?: string;
  /** Additional paths to always bypass (e.g., /api/auth/, /api/session/) */
  bypassPrefixes?: string[];
}

// =============================================================================
// DEFAULT BYPASS PATHS
// =============================================================================

/** Routes that must always bypass middleware (prevent infinite loops) */
const DEFAULT_BYPASS_PREFIXES = [
  '/api/auth/',
  '/api/session/',
  '/_next/',
  '/favicon.ico',
];

/** Static file extensions to bypass */
const STATIC_EXTENSIONS = /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|map)$/i;

// =============================================================================
// MAIN
// =============================================================================

/**
 * Create a slim middleware that only checks cookie existence.
 * Auth validation is deferred to server-side layouts (authGuard).
 */
export function createSlimMiddleware(options?: SlimMiddlewareOptions) {
  const publicRoutes = options?.publicRoutes || [];
  const loginUrl = options?.loginUrl || '/account-auth/login';
  const extraBypass = options?.bypassPrefixes || [];
  const allBypass = [...DEFAULT_BYPASS_PREFIXES, ...extraBypass];

  // Pre-compile public route patterns for fast matching
  const publicMatchers = publicRoutes.map(pattern => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return (p: string) => p === prefix || p.startsWith(prefix + '/');
    }
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return (p: string) => p.startsWith(prefix);
    }
    if (pattern.startsWith('/*.')) {
      const ext = pattern.slice(2);
      return (p: string) => p.endsWith(ext);
    }
    return (p: string) => p === pattern;
  });

  return function middleware(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    // 1. Always bypass static/internal routes
    if (STATIC_EXTENSIONS.test(pathname)) {
      return NextResponse.next();
    }
    for (const prefix of allBypass) {
      if (pathname.startsWith(prefix)) {
        return NextResponse.next();
      }
    }

    // 2. Check if it's a public route → pass through
    for (const matcher of publicMatchers) {
      if (matcher(pathname)) {
        return NextResponse.next();
      }
    }

    // 3. THE ONLY AUTH CHECK: Does a session cookie exist?
    const sessionCookieName = getSessionCookieName();
    const secureCookieName = getSecureSessionCookieName();
    const hasCookie =
      request.cookies.has(sessionCookieName) ||
      request.cookies.has(secureCookieName);

    if (!hasCookie) {
      // No cookie on a protected route → redirect to login
      // API routes get 401 instead of redirect
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'No session' },
          { status: 401 }
        );
      }

      const callbackUrl = encodeURIComponent(pathname);
      return NextResponse.redirect(new URL(`${loginUrl}?callbackUrl=${callbackUrl}`, request.url));
    }

    // Cookie exists → pass through, layout authGuard does the real validation
    return NextResponse.next();
  };
}
