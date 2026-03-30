"use strict";
/**
 * Better Auth Configuration
 *
 * Primary auth configuration. Replaces the former NextAuth auth-options.ts.
 *
 * Architecture: No database adapter — Better Auth runs in stateless mode
 * with JWE cookie cache. User management stays on IDP, sessions on Redis.
 *
 * @see BETTER-AUTH-MIGRATION-SPEC.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBetterAuthProviders = buildBetterAuthProviders;
exports.createBetterAuthInstance = createBetterAuthInstance;
exports.isBetterAuthEnabled = isBetterAuthEnabled;
exports.getBetterAuthHandler = getBetterAuthHandler;
require("server-only");
const better_auth_1 = require("better-auth");
const next_js_1 = require("better-auth/next-js");
const next_js_2 = require("better-auth/next-js");
const idp_client_config_1 = require("../lib/idp-client-config");
const app_slug_1 = require("../lib/app-slug");
/**
 * Build Better Auth social providers from IDP config.
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
    const appSlug = idpConfig.clientSlug || (0, app_slug_1.getAppSlug)();
    // Resolve base URL: BETTER_AUTH_URL env > IDP config > localhost fallback
    const baseURL = process.env.BETTER_AUTH_URL
        || idpConfig.baseClientUrl
        || `http://localhost:${process.env.PORT || '3000'}`;
    return (0, better_auth_1.betterAuth)({
        baseURL,
        secret: idpConfig.nextAuthSecret,
        socialProviders: buildBetterAuthProviders(idpConfig),
        // Trust the app's own origin + any configured base URL
        trustedOrigins: [
            baseURL,
            ...(idpConfig.baseClientUrl && idpConfig.baseClientUrl !== baseURL ? [idpConfig.baseClientUrl] : []),
            'http://localhost:3000',
            'http://localhost:3400',
            'http://localhost:3600',
        ],
        // No database — stateless mode. Better Auth defaults to JWE cookie cache.
        // Session cookie cache with refreshCache for DB-less setup.
        session: {
            cookieCache: {
                enabled: true,
                maxAge: 300,
                refreshCache: true,
            },
        },
        // Cookie prefix must match slim-middleware expectations ({slug}.session-token)
        advanced: {
            cookiePrefix: appSlug,
            cookies: {
                session_token: {
                    name: `${appSlug}.session-token`,
                },
            },
        },
        plugins: [
            (0, next_js_1.nextCookies)(),
        ],
    });
}
/**
 * Better Auth is always enabled (NextAuth removed in 4.0).
 */
function isBetterAuthEnabled() {
    return true;
}
/**
 * Get Better Auth Next.js route handlers (GET, POST).
 * Initializes Better Auth from IDP config on first call, caches the instance.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedInstance = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let initPromise = null;
async function getBetterAuthInstance() {
    if (cachedInstance)
        return cachedInstance;
    if (!initPromise) {
        initPromise = (0, idp_client_config_1.getIDPClientConfig)().then(config => {
            const instance = createBetterAuthInstance(config);
            cachedInstance = instance;
            console.log('[BETTER_AUTH] Instance created for', config.clientSlug || config.clientId);
            return instance;
        });
    }
    return initPromise;
}
/**
 * Get flag-gated auth handler for Next.js route.
 *
 * When USE_BETTER_AUTH=true, returns Better Auth handlers.
 * Otherwise returns null (auth disabled).
 *
 * Usage in host app route:
 * ```ts
 * import { getBetterAuthHandler } from '@payez/next-mvp/auth/better-auth';
 *
 * export async function GET(req: Request) {
 *   const ba = await getBetterAuthHandler();
 *   if (ba) return ba.GET(req);
 * }
 * ```
 */
async function getBetterAuthHandler() {
    if (!isBetterAuthEnabled())
        return null;
    const auth = await getBetterAuthInstance();
    return (0, next_js_2.toNextJsHandler)(auth);
}
