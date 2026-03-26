/**
 * Server-Side Auth Guard for Layouts
 *
 * Replaces middleware's self-fetch auth checks with direct Redis/function calls.
 * Call from server-component layouts to protect routes.
 *
 * Zero HTTP self-fetches. ~8ms total (Redis + in-memory checks).
 */
import 'server-only';
import type { SessionData } from '../lib/session-store';
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
export declare function authGuard(options?: AuthGuardOptions): Promise<AuthGuardResult>;
