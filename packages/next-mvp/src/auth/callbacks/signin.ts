/**
 * SignIn Callback
 *
 * Handles post-authentication actions like 2FA redirect.
 * Called after credentials or OAuth authentication succeeds.
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */

import type { User, Account } from 'next-auth';

// ============================================================================
// SIGNIN CALLBACK
// ============================================================================

/**
 * SignIn callback - handle 2FA redirect for OAuth users.
 *
 * When require2FA is true for the client, OAuth users need to be
 * redirected to the verify-code page immediately after OAuth login.
 *
 * @param params - SignIn callback parameters from NextAuth
 * @returns true to allow sign-in, or a URL string to redirect
 */
export async function signInCallback({
  user,
  account,
}: {
  user: User | any;
  account: Account | null;
}): Promise<boolean | string> {
  // Only handle OAuth providers (credentials flow handles 2FA separately)
  if (!account?.provider || account.provider === 'credentials') {
    return true;
  }

  // Check if OAuth user needs 2FA redirect
  const token = user as any;
  if (token?.requiresTwoFactorRedirect) {
    // Preserve the original callback URL through 2FA flow
    const originalCallbackUrl = (account as any)?.callbackUrl || '/';

    // Don't redirect back to auth pages after 2FA
    const safeCallbackUrl = originalCallbackUrl.startsWith('/account-auth/')
      ? '/'
      : originalCallbackUrl;

    const encodedCallback = encodeURIComponent(safeCallbackUrl);

    // Return redirect URL - NextAuth will redirect here instead of completing sign-in
    return `/account-auth/verify-code?callbackUrl=${encodedCallback}`;
  }

  return true;
}
