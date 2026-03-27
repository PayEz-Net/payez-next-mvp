"use strict";
/**
 * Better Auth Configuration (Phase 1 — parallel install)
 *
 * NOT wired to routes yet. Exists alongside auth-options.ts for testing.
 * Wired in Phase 2 behind USE_BETTER_AUTH flag.
 *
 * Architecture: No database adapter — Better Auth runs in stateless mode
 * with JWE cookie cache. User management stays on IDP, sessions on Redis.
 *
 * @see BETTER-AUTH-MIGRATION-SPEC.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBetterAuthProviders = buildBetterAuthProviders;
exports.createBetterAuthInstance = createBetterAuthInstance;
require("server-only");
const better_auth_1 = require("better-auth");
const next_js_1 = require("better-auth/next-js");
/**
 * Build Better Auth social providers from IDP config.
 * Replaces buildOAuthProviders() from providers/oauth.ts.
 */
function buildBetterAuthProviders(config) {
    const providers = {};
    for (const oauth of config.oauthProviders || []) {
        if (!oauth.enabled)
            continue;
        const name = oauth.provider.toLowerCase();
        providers[name] = {
            clientId: oauth.clientId,
            clientSecret: oauth.clientSecret,
            scope: oauth.scopes?.split(' '),
        };
    }
    return providers;
}
/**
 * Create Better Auth instance from IDP config.
 *
 * No database — runs in stateless mode with JWE cookie cache.
 * Call after getIDPClientConfig() resolves.
 */
function createBetterAuthInstance(idpConfig) {
    return (0, better_auth_1.betterAuth)({
        secret: idpConfig.nextAuthSecret,
        socialProviders: buildBetterAuthProviders(idpConfig),
        // No database — stateless mode. Better Auth defaults to JWE cookie cache.
        // Session cookie cache with refreshCache for DB-less setup.
        session: {
            cookieCache: {
                enabled: true,
                maxAge: 300,
                refreshCache: true,
            },
        },
        plugins: [
            (0, next_js_1.nextCookies)(),
        ],
    });
}
