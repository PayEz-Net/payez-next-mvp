/**
 * NextAuth Configuration (Refactored)
 *
 * This is the composition layer that wires together all auth modules.
 * Individual logic lives in dedicated modules:
 * - providers/ - Credentials and OAuth provider builders
 * - callbacks/ - JWT, session, signIn callbacks
 * - events/ - SignOut event handler
 * - utils/ - Token utilities, IDP client
 * - types/ - Type definitions
 *
 * CARGO CULT PATTERNS REMOVED:
 * ============================
 * The original auth-options.ts (1186 lines) had several anti-patterns that
 * added complexity without benefit:
 *
 * 1. CALLBACK CONCURRENCY PROTECTION (removed)
 *    - shouldExecuteCallback() / markCallbackComplete()
 *    - A debouncing mechanism that tried to prevent callbacks from running
 *      too frequently. NextAuth already handles this properly.
 *    - Added complexity, caused race condition bugs, and leaked memory
 *      (Map entries never cleaned up).
 *
 * 2. SESSION RESTORATION (removed)
 *    - attemptSessionRestoration()
 *    - Tried to restore sessions by calling refresh endpoint from JWT callback.
 *    - Created circular dependencies and made debugging impossible.
 *    - Clean approach: Session missing = user re-authenticates. Simple.
 *
 * 3. VARIABLE NAME SOUP (normalized in Phase 3)
 *    - accessToken vs idpAccessToken vs oauthAccessToken
 *    - twoFactorComplete vs mfaVerified vs requiresTwoFactor
 *    - sessionToken vs redisSessionId
 *    - Now: Clear prefixes (idp*, oauth*, mfa*) with documented meanings.
 *
 * 4. INLINE EVERYTHING (modularized in Phase 2)
 *    - All logic was in one giant file with no separation of concerns.
 *    - Now: Each module has one job and can be tested independently.
 *
 * @version 2.0.0
 * @since auth-refactor-2026-01
 */
import type { NextAuthOptions } from 'next-auth';
/**
 * Base NextAuth configuration.
 * Use getAuthOptions() for dynamic provider loading from IDP.
 */
export declare const authOptions: NextAuthOptions;
/**
 * Get auth options with dynamically loaded OAuth providers from IDP.
 * Uses caching to avoid rebuilding on every request.
 */
export declare function getAuthOptions(): Promise<NextAuthOptions>;
/**
 * Clear cached auth options (when IDP config changes).
 */
export declare function clearAuthOptionsCache(): void;
