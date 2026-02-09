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
/**
 * SignIn callback - handle 2FA redirect for OAuth users.
 *
 * When require2FA is true for the client, OAuth users need to be
 * redirected to the verify-code page immediately after OAuth login.
 *
 * @param params - SignIn callback parameters from NextAuth
 * @returns true to allow sign-in, or a URL string to redirect
 */
export declare function signInCallback({ user, account, }: {
    user: User | any;
    account: Account | null;
}): Promise<boolean | string>;
