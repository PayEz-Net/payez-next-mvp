/**
 * Server-Side Auth Guard for Layouts
 *
 * Replaces middleware's self-fetch auth checks with direct Redis/function calls.
 * Call from server-component layouts to protect routes.
 *
 * Zero HTTP self-fetches. ~8ms total (Redis + in-memory checks).
 */

import 'server-only';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { decodeSession } from './decode-session';
import { getIDPClientConfig } from '../lib/idp-client-config';
import { getSessionCookieName, getSecureSessionCookieName } from '../lib/app-slug';
import type { SessionData } from '../lib/session-store';

// =============================================================================
// TYPES
// =============================================================================

export interface AuthGuardOptions {
  /** Custom checks to run after standard auth validation */
  checks?: AuthCheck[];
  /** Override login redirect URL (default: /account-auth/login) */
  loginUrl?: string;
  /** Override 2FA redirect URL (default: /account-auth/verify-code) */
  verifyCodeUrl?: string;
  /** Override service unavailable URL (default: /service-unavailable) */
  serviceUnavailableUrl?: string;
}

export interface AuthCheck {
  /** Name for logging */
  name: string;
  /** Returns redirect URL if check fails, null if passes */
  check: (session: SessionData, pathname: string) => Promise<string | null>;
}

export interface AuthGuardResult {
  userId: string;
  email: string;
  roles: string[];
  sessionData: SessionData;
  accessToken?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LOGIN_PAGE = '/account-auth/login';
const VERIFY_CODE_PAGE = '/account-auth/verify-code';
const SERVICE_UNAVAILABLE_PAGE = '/service-unavailable';

// =============================================================================
// MAIN
// =============================================================================

/**
 * Server-side auth guard. Call from async server layouts.
 *
 * Redirects (via next/navigation redirect()) if:
 * - No session cookie / invalid JWT
 * - Session not in Redis (stale)
 * - Session force-invalidated
 * - 2FA required but not completed / expired
 * - Any custom check fails
 *
 * Returns the authenticated user's session data on success.
 */
export async function authGuard(options?: AuthGuardOptions): Promise<AuthGuardResult> {
  const loginUrl = options?.loginUrl || LOGIN_PAGE;
  const verifyCodeUrl = options?.verifyCodeUrl || VERIFY_CODE_PAGE;
  const serviceUnavailableUrl = options?.serviceUnavailableUrl || SERVICE_UNAVAILABLE_PAGE;

  // Get current pathname from headers (set by Next.js)
  const headerStore = await headers();
  const pathname = headerStore.get('x-next-pathname') ||
                   headerStore.get('x-invoke-path') ||
                   headerStore.get('x-matched-path') ||
                   '/';

  const callbackUrl = encodeURIComponent(pathname);

  // --- Decode session (cookie → JWT → Redis) ---
  let decoded: Awaited<ReturnType<typeof decodeSession>>;
  try {
    decoded = await decodeSession();
  } catch (error) {
    // Redis unreachable or startup failure → fail closed
    console.error('[AUTH-GUARD] Session decode failed (service error):', error instanceof Error ? error.message : String(error));
    redirect(serviceUnavailableUrl);
  }

  // No session at all → redirect to login
  if (!decoded) {
    redirect(`${loginUrl}?callbackUrl=${callbackUrl}`);
  }

  const { sessionData } = decoded;

  // --- Force-invalidated session (admin action, password change) ---
  if (sessionData.forceInvalidated) {
    console.warn('[AUTH-GUARD] Session force-invalidated', {
      userId: sessionData.userId,
      pathname,
    });
    redirect(`${loginUrl}?callbackUrl=${callbackUrl}&reason=invalidated`);
  }

  // --- 2FA check ---
  try {
    const config = await getIDPClientConfig();
    const requires2FA = config.authSettings?.require2FA ?? true;

    if (requires2FA) {
      const mfaVerified = sessionData.mfaVerified ?? (sessionData as any).twoFactorComplete ?? false;
      const mfaExpiresAt = sessionData.mfaExpiresAt || 0;
      const mfaExpired = mfaExpiresAt > 0 && mfaExpiresAt < Date.now();

      if (!mfaVerified || mfaExpired) {
        console.log('[AUTH-GUARD] 2FA required', {
          mfaVerified,
          mfaExpired,
          userId: sessionData.userId,
          pathname,
        });
        redirect(`${verifyCodeUrl}?callbackUrl=${callbackUrl}`);
      }
    }
  } catch (error) {
    // If we can't check 2FA config, fail closed
    console.error('[AUTH-GUARD] 2FA config check failed:', error instanceof Error ? error.message : String(error));
    redirect(serviceUnavailableUrl);
  }

  // --- Custom checks (beta, admin, etc.) ---
  if (options?.checks) {
    for (const check of options.checks) {
      try {
        const redirectUrl = await check.check(sessionData, pathname);
        if (redirectUrl) {
          console.log(`[AUTH-GUARD] Custom check "${check.name}" failed`, {
            userId: sessionData.userId,
            pathname,
            redirectUrl,
          });
          redirect(redirectUrl);
        }
      } catch (error) {
        // If the error is a redirect (from next/navigation), re-throw it
        if (error && typeof error === 'object' && 'digest' in error) {
          throw error;
        }
        console.error(`[AUTH-GUARD] Custom check "${check.name}" error:`, error instanceof Error ? error.message : String(error));
        redirect(serviceUnavailableUrl);
      }
    }
  }

  // --- All checks passed ---
  return {
    userId: sessionData.userId,
    email: sessionData.email,
    roles: sessionData.roles || [],
    sessionData,
    accessToken: sessionData.idpAccessToken,
  };
}
