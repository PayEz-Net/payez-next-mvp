"use strict";
/**
 * Demo mode utilities
 * When DEMO_MODE=true, auth package is installed but not enforced
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDemoMode = isDemoMode;
exports.isAuthConfigured = isAuthConfigured;
function isDemoMode() {
    return process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}
function isAuthConfigured() {
    if (isDemoMode())
        return false;
    return !!(process.env.NEXTAUTH_SECRET || (process.env.NEXT_CLIENT_ID && process.env.NEXT_CLIENT_PRIVATE_KEY_PEM));
}
