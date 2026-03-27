"use strict";
/**
 * Better Auth Client (Phase 3)
 *
 * Drop-in replacement for next-auth/react hooks and functions.
 * Import from '@payez/next-mvp/client/better-auth-client'.
 *
 * Migration map:
 *   useSession()        → authClient.useSession()
 *   signIn('google')    → authClient.signIn.social({ provider: 'google' })
 *   signIn('credentials', {...}) → authClient.signIn.email({...})
 *   signOut()           → authClient.signOut()
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.signOut = exports.signIn = exports.useSession = exports.authClient = void 0;
const react_1 = require("better-auth/react");
exports.authClient = (0, react_1.createAuthClient)({
// baseURL is derived from BETTER_AUTH_URL or window.location.origin
});
// Convenience exports matching NextAuth patterns
exports.useSession = exports.authClient.useSession, exports.signIn = exports.authClient.signIn, exports.signOut = exports.authClient.signOut;
