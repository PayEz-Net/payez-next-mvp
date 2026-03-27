"use strict";
/**
 * Simple Logout Utility for @payez/next-mvp
 *
 * Provides a clean logout function that:
 * - Clears NextAuth session
 * - Redirects to login page
 * - No external dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = logout;
const better_auth_client_1 = require("../client/better-auth-client");
/**
 * Sign out the current user and redirect to login
 *
 * @param redirectUrl - URL to redirect to after logout (default: /account-auth/login)
 */
async function logout(redirectUrl = '/account-auth/login') {
    try {
        await better_auth_client_1.authClient.signOut();
        if (typeof window !== 'undefined') {
            window.location.href = redirectUrl;
        }
    }
    catch (error) {
        console.error('Logout error:', error);
        // Fallback: force redirect to login
        if (typeof window !== 'undefined') {
            window.location.href = redirectUrl;
        }
    }
}
