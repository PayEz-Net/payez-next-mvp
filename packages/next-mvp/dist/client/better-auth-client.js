"use strict";
/**
 * Better Auth Client.
 *
 * Import from '@payez/next-mvp/client/better-auth-client'.
 *
 * Includes useSessionCompat() — returns a { data, status } shape so existing
 * components written against the legacy hook don't need destructure changes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.signOut = exports.signIn = exports.useSession = exports.authClient = void 0;
exports.useSessionCompat = useSessionCompat;
exports.signOutCompat = signOutCompat;
const react_1 = require("better-auth/react");
const react_2 = require("react");
exports.authClient = (0, react_1.createAuthClient)({
// baseURL derived from BETTER_AUTH_URL or window.location.origin
});
// Convenience exports
exports.useSession = exports.authClient.useSession, exports.signIn = exports.authClient.signIn, exports.signOut = exports.authClient.signOut;
/**
 * NextAuth-compatible useSession wrapper.
 *
 * Maps Better Auth's { data, error, isPending } to NextAuth's { data, status, update }.
 * Drop-in replacement — no destructure changes needed in consuming components.
 */
function useSessionCompat() {
    const baSession = exports.authClient.useSession();
    const status = (0, react_2.useMemo)(() => {
        if (baSession.isPending)
            return 'loading';
        if (baSession.data)
            return 'authenticated';
        return 'unauthenticated';
    }, [baSession.isPending, baSession.data]);
    // Map Better Auth session shape to NextAuth session shape
    const data = (0, react_2.useMemo)(() => {
        if (!baSession.data)
            return null;
        return {
            ...baSession.data,
            user: baSession.data.user,
            expires: '', // Better Auth handles expiry differently
        };
    }, [baSession.data]);
    return {
        data,
        status,
        update: async () => {
            // Better Auth doesn't have a direct "refresh session" call.
            // Force refetch by invalidating the query.
            // TODO: Wire to proper session refresh when available.
            return data;
        },
    };
}
/**
 * NextAuth-compatible signOut wrapper.
 *
 * Maps NextAuth signOut({ redirect, callbackUrl }) to Better Auth.
 */
async function signOutCompat(options) {
    await exports.authClient.signOut();
    if (options?.redirect !== false && options?.callbackUrl) {
        window.location.href = options.callbackUrl;
    }
}
