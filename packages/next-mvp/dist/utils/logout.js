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
const react_1 = require("next-auth/react");
/**
 * Sign out the current user and redirect to login
 *
 * @param redirectUrl - URL to redirect to after logout (default: /account-auth/login)
 */
async function logout(redirectUrl = '/account-auth/login') {
    try {
        await (0, react_1.signOut)({
            callbackUrl: redirectUrl,
            redirect: true,
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        // Fallback: force redirect to login
        if (typeof window !== 'undefined') {
            window.location.href = redirectUrl;
        }
    }
}
