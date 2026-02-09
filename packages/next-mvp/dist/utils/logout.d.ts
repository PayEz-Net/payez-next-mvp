/**
 * Simple Logout Utility for @payez/next-mvp
 *
 * Provides a clean logout function that:
 * - Clears NextAuth session
 * - Redirects to login page
 * - No external dependencies
 */
/**
 * Sign out the current user and redirect to login
 *
 * @param redirectUrl - URL to redirect to after logout (default: /account-auth/login)
 */
export declare function logout(redirectUrl?: string): Promise<void>;
