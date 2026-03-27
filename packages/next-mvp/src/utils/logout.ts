/**
 * Simple Logout Utility for @payez/next-mvp
 *
 * Provides a clean logout function that:
 * - Clears NextAuth session
 * - Redirects to login page
 * - No external dependencies
 */

import { authClient } from '../client/better-auth-client';

/**
 * Sign out the current user and redirect to login
 *
 * @param redirectUrl - URL to redirect to after logout (default: /account-auth/login)
 */
export async function logout(redirectUrl: string = '/account-auth/login'): Promise<void> {
  try {
    await authClient.signOut();
    if (typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback: force redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = redirectUrl;
    }
  }
}
