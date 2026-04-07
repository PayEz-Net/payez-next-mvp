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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.__betterAuthInstance = void 0;
exports.buildBetterAuthProviders = buildBetterAuthProviders;
exports.createBetterAuthInstance = createBetterAuthInstance;
exports.isBetterAuthEnabled = isBetterAuthEnabled;
exports.getBetterAuthInstance = getBetterAuthInstance;
exports.getBetterAuthHandler = getBetterAuthHandler;
exports.exchangeOAuthForIdpTokens = exchangeOAuthForIdpTokens;
exports.createAuthGetHandler = createAuthGetHandler;
require("server-only");
const better_auth_1 = require("better-auth");
const next_js_1 = require("better-auth/next-js");
const next_js_2 = require("better-auth/next-js");
const idp_client_config_1 = require("../lib/idp-client-config");
const app_slug_1 = require("../lib/app-slug");
const redis_1 = require("../lib/redis");
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
    // Must include /api/auth since that's where the catch-all route is mounted
    const rawBaseURL = process.env.BETTER_AUTH_URL
        || idpConfig.baseClientUrl
        || `http://localhost:${process.env.PORT || '3000'}`;
    const baseURL = rawBaseURL.replace(/\/+$/, '') + '/api/auth';
    return (0, better_auth_1.betterAuth)({
        baseURL,
        secret: idpConfig.authSecret,
        socialProviders: buildBetterAuthProviders(idpConfig),
        // Trust the app's own origin + any configured base URL
        trustedOrigins: [
            rawBaseURL,
            baseURL,
            ...(idpConfig.baseClientUrl ? [idpConfig.baseClientUrl] : []),
            'http://localhost:3000',
            'http://localhost:3400',
            'http://localhost:3600',
        ],
        // Redis-backed session storage via secondaryStorage
        secondaryStorage: {
            get: async (key) => {
                try {
                    return await (0, redis_1.getRedis)().get(`ba:${appSlug}:${key}`);
                }
                catch {
                    return null;
                }
            },
            set: async (key, value, ttl) => {
                try {
                    const redis = (0, redis_1.getRedis)();
                    if (ttl) {
                        await redis.setex(`ba:${appSlug}:${key}`, ttl, value);
                    }
                    else {
                        await redis.setex(`ba:${appSlug}:${key}`, 7 * 24 * 60 * 60, value);
                    }
                }
                catch { /* Redis unavailable — cookie cache still works */ }
            },
            delete: async (key) => {
                try {
                    await (0, redis_1.getRedis)().del(`ba:${appSlug}:${key}`);
                }
                catch { /* ignore */ }
            },
        },
        session: {
            cookieCache: {
                enabled: true,
                maxAge: 300,
                refreshCache: false,
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
exports.__betterAuthInstance = cachedInstance;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let initPromise = null;
async function getBetterAuthInstance() {
    if (cachedInstance)
        return cachedInstance;
    if (!initPromise) {
        initPromise = (0, idp_client_config_1.getIDPClientConfig)(true).then(config => {
            const instance = createBetterAuthInstance(config);
            exports.__betterAuthInstance = cachedInstance = instance;
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
/**
 * Exchange OAuth identity for IDP tokens and store in the BA Redis session.
 *
 * Call this from the OAuth callback route AFTER better-auth has processed the
 * callback and created the session. Reads the session token from the Set-Cookie
 * header of the response to find the BA Redis key.
 *
 * This replaces the old databaseHooks approach which doesn't fire in stateless mode.
 */
async function exchangeOAuthForIdpTokens(sessionToken, provider = 'google') {
    try {
        const config = await (0, idp_client_config_1.getIDPClientConfig)();
        const appSlug = config.clientSlug || (0, app_slug_1.getAppSlug)();
        const baKey = `ba:${appSlug}:${sessionToken}`;
        // Read the BA session from Redis
        const baRaw = await (0, redis_1.getRedis)().get(baKey).catch(() => null);
        if (!baRaw) {
            console.warn('[BETTER_AUTH] exchangeOAuthForIdpTokens: session not found in Redis for token', sessionToken.substring(0, 10));
            return false;
        }
        const baData = JSON.parse(baRaw);
        const email = baData?.user?.email;
        const name = baData?.user?.name;
        const image = baData?.user?.image;
        const baUserId = baData?.session?.userId || baData?.user?.id;
        if (!email) {
            console.warn('[BETTER_AUTH] exchangeOAuthForIdpTokens: no email in session');
            return false;
        }
        // Call IDP oauth-callback
        const idpUrl = process.env.IDP_URL || '';
        if (!idpUrl) {
            console.warn('[BETTER_AUTH] No IDP_URL configured, skipping token exchange');
            return false;
        }
        console.log('[BETTER_AUTH] Exchanging OAuth identity for IDP tokens:', email);
        const oauthRes = await fetch(`${idpUrl}/api/ExternalAuth/oauth-callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider,
                provider_account_id: email, // Cross-System Identity Standard v1.1: always use verified email, never opaque session IDs
                email,
                name,
                image,
                client_id: config.clientSlug || String(config.clientId),
            }),
        });
        const oauthResText = await oauthRes.text();
        console.log('[BETTER_AUTH] IDP oauth-callback response:', oauthRes.status, oauthResText.substring(0, 500));
        if (!oauthRes.ok) {
            console.error('[BETTER_AUTH] IDP oauth-callback failed:', oauthRes.status);
            return false;
        }
        let idpData;
        try {
            idpData = JSON.parse(oauthResText);
        }
        catch {
            return false;
        }
        const result = idpData?.data?.result || idpData?.data || idpData;
        if (!result?.access_token) {
            console.warn('[BETTER_AUTH] IDP oauth-callback returned no access_token. Keys:', Object.keys(result || {}));
            return false;
        }
        // Build IDP token data
        const requiresTwoFactor = result.user?.requiresTwoFactor ?? result.requiresTwoFactor ?? false;
        const idpTokenData = {
            idpAccessToken: result.access_token,
            idpRefreshToken: result.refresh_token,
            idpAccessTokenExpires: result.expires_in
                ? Date.now() + result.expires_in * 1000
                : Date.now() + 15 * 60 * 1000,
            userId: String(result.user?.user_id || result.user?.id || result.user_id || baUserId),
            email: result.user?.email || result.email || email,
            name: result.user?.full_name || result.user?.name || result.name || name,
            roles: result.user?.roles || result.roles || [],
            mfaVerified: !requiresTwoFactor,
        };
        // Store in BA Redis session (for decodeSession)
        baData.idpTokens = idpTokenData;
        await (0, redis_1.getRedis)().setex(baKey, 7 * 24 * 60 * 60, JSON.stringify(baData));
        // Write to canonical session store so refresh handler and token lifecycle can find the tokens.
        // Key format: {sessionPrefix}{token} — same key that getSession() reads from.
        try {
            const { getSessionPrefix } = await Promise.resolve().then(() => __importStar(require('../lib/app-slug')));
            const canonicalKey = `${getSessionPrefix()}${sessionToken}`;
            await (0, redis_1.getRedis)().setex(canonicalKey, 7 * 24 * 60 * 60, JSON.stringify({
                ...idpTokenData,
                oauthProvider: provider,
            }));
        }
        catch (canonicalErr) {
            console.warn('[BETTER_AUTH] Failed to write canonical session:', canonicalErr instanceof Error ? canonicalErr.message : String(canonicalErr));
        }
        console.log('[BETTER_AUTH] IDP tokens stored in session for', email);
        return true;
    }
    catch (err) {
        console.error('[BETTER_AUTH] IDP token exchange failed:', err instanceof Error ? err.message : String(err));
        return false;
    }
}
/**
 * Create a production-ready GET handler for the auth catch-all route.
 *
 * Wraps better-auth's GET handler with:
 * - OAuth state error recovery (redirects to login instead of error page)
 * - IDP token exchange after successful OAuth callback
 *
 * Usage in host app:
 * ```ts
 * import { createAuthGetHandler, getBetterAuthHandler } from '@payez/next-mvp/auth/better-auth';
 * export const GET = createAuthGetHandler('/account-auth/login');
 * export async function POST(req: Request) {
 *   const ba = await getBetterAuthHandler();
 *   return ba!.POST(req);
 * }
 * ```
 */
function createAuthGetHandler(loginPath = '/account-auth/login') {
    return async function GET(request) {
        const ba = await getBetterAuthHandler();
        if (!ba) {
            return new Response('Auth handler not configured', { status: 500 });
        }
        const response = await ba.GET(request);
        // Intercept auth errors (state mismatch, expired cookies) — redirect to login cleanly
        if (response.status === 302) {
            const location = response.headers.get('location') || '';
            if (location.includes('/api/auth/error') || location.includes('please_restart')) {
                console.warn('[BETTER_AUTH] OAuth state error, redirecting to login');
                return Response.redirect(new URL(loginPath, request.url), 302);
            }
        }
        // After successful OAuth callback: exchange Google identity for IDP tokens
        const url = new URL(request.url);
        if (url.pathname.includes('/callback/') && response.status === 302) {
            try {
                const auth = await getBetterAuthInstance();
                if (auth?.api?.getSession) {
                    const setCookies = response.headers.getSetCookie?.() || [];
                    const cookieHeader = setCookies
                        .map((c) => c.split(';')[0])
                        .join('; ');
                    const headers = new Headers();
                    headers.set('cookie', cookieHeader);
                    const session = await auth.api.getSession({ headers });
                    if (session?.session?.token) {
                        console.log('[BETTER_AUTH] Got session token from callback:', session.session.token.substring(0, 10), '| email:', session.user?.email);
                        await exchangeOAuthForIdpTokens(session.session.token);
                    }
                    else {
                        console.warn('[BETTER_AUTH] Could not get session after OAuth callback');
                    }
                }
            }
            catch (err) {
                console.error('[BETTER_AUTH] IDP token exchange failed:', err.message);
            }
        }
        return response;
    };
}
