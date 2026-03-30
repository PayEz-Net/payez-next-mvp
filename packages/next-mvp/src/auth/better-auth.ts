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

import 'server-only';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { toNextJsHandler } from 'better-auth/next-js';
import type { IDPClientConfig } from '../lib/idp-client-config';
import { getIDPClientConfig } from '../lib/idp-client-config';
import { getAppSlug } from '../lib/app-slug';
import { getRedis } from '../lib/redis';

/**
 * Better Auth social provider config shape.
 */
export interface BetterAuthSocialProvider {
  clientId: string;
  clientSecret: string;
  scope?: string[];
}

/**
 * Build Better Auth social providers from IDP config.
 */
export function buildBetterAuthProviders(
  config: IDPClientConfig
): Record<string, BetterAuthSocialProvider> {
  const providers: Record<string, BetterAuthSocialProvider> = {};

  for (const oauth of config.oauthProviders || []) {
    if (!oauth.enabled) continue;
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
export function createBetterAuthInstance(idpConfig: IDPClientConfig) {
  const appSlug = idpConfig.clientSlug || getAppSlug();

  // Resolve base URL: BETTER_AUTH_URL env > IDP config > localhost fallback
  const baseURL = process.env.BETTER_AUTH_URL
    || idpConfig.baseClientUrl
    || `http://localhost:${process.env.PORT || '3000'}`;

  return betterAuth({
    baseURL,
    secret: idpConfig.nextAuthSecret as string,

    socialProviders: buildBetterAuthProviders(idpConfig),

    // Trust the app's own origin + any configured base URL
    trustedOrigins: [
      baseURL,
      ...(idpConfig.baseClientUrl && idpConfig.baseClientUrl !== baseURL ? [idpConfig.baseClientUrl] : []),
      'http://localhost:3000',
      'http://localhost:3400',
      'http://localhost:3600',
    ],

    // Redis-backed session storage via secondaryStorage
    secondaryStorage: {
      get: async (key: string) => {
        try {
          return await getRedis().get(`ba:${appSlug}:${key}`);
        } catch { return null; }
      },
      set: async (key: string, value: string, ttl?: number) => {
        try {
          const redis = getRedis();
          if (ttl) {
            await redis.setex(`ba:${appSlug}:${key}`, ttl, value);
          } else {
            await redis.setex(`ba:${appSlug}:${key}`, 7 * 24 * 60 * 60, value);
          }
        } catch { /* Redis unavailable — cookie cache still works */ }
      },
      delete: async (key: string) => {
        try {
          await getRedis().del(`ba:${appSlug}:${key}`);
        } catch { /* ignore */ }
      },
    },

    session: {
      cookieCache: {
        enabled: true,
        maxAge: 300,
        refreshCache: false,
      },
    },

    // After social login, exchange Google identity for IDP tokens and store in Redis
    databaseHooks: {
      session: {
        create: {
          after: async (session: any) => {
            try {
              const userId = session.userId;
              const token = session.token;
              if (!userId || !token) return;

              // Look up user from Better Auth's memory/DB to get email
              // The user was just created/found by Better Auth during OAuth
              const baKey = `ba:${appSlug}:${token}`;
              const baRaw = await getRedis().get(baKey).catch(() => null);
              const baData = baRaw ? JSON.parse(baRaw) : null;
              const email = baData?.user?.email;
              const name = baData?.user?.name;
              const image = baData?.user?.image;

              if (!email) {
                console.warn('[BETTER_AUTH] Session created but no email found for IDP token exchange');
                return;
              }

              // Call IDP oauth-callback to get IDP tokens
              const idpUrl = process.env.INTERNAL_IDP_URL || process.env.IDP_URL || '';
              if (!idpUrl) {
                console.warn('[BETTER_AUTH] No IDP URL configured, skipping token exchange');
                return;
              }

              const oauthRes = await fetch(`${idpUrl}/api/ExternalAuth/oauth-callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  provider: 'google',
                  provider_account_id: userId,
                  email,
                  name,
                  image,
                  client_id: idpConfig.clientSlug || String(idpConfig.clientId),
                }),
              });

              const oauthResText = await oauthRes.text();
              console.log('[BETTER_AUTH] IDP oauth-callback response:', oauthRes.status, oauthResText.substring(0, 500));

              if (!oauthRes.ok) {
                console.error('[BETTER_AUTH] IDP oauth-callback failed:', oauthRes.status);
                return;
              }

              let idpData: any;
              try { idpData = JSON.parse(oauthResText); } catch { return; }
              const result = idpData?.data?.result || idpData?.data || idpData;

              if (!result?.access_token) {
                console.warn('[BETTER_AUTH] IDP oauth-callback returned no access_token. Keys:', Object.keys(result || {}));
                return;
              }

              // Store IDP tokens in the BA Redis session
              if (baData) {
                baData.idpTokens = {
                  idpAccessToken: result.access_token,
                  idpRefreshToken: result.refresh_token,
                  idpAccessTokenExpires: result.expires_in
                    ? Date.now() + result.expires_in * 1000
                    : Date.now() + 15 * 60 * 1000,
                  userId: String(result.user?.user_id || result.user?.id || result.user_id || userId),
                  email: result.user?.email || result.email || email,
                  name: result.user?.full_name || result.user?.name || result.name || name,
                  roles: result.user?.roles || result.roles || [],
                };
                await getRedis().setex(baKey, 7 * 24 * 60 * 60, JSON.stringify(baData));
                console.log('[BETTER_AUTH] IDP tokens stored in session for', email);
              }
            } catch (err) {
              console.error('[BETTER_AUTH] Post-login IDP exchange failed:', err instanceof Error ? err.message : String(err));
            }
          },
        },
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
      nextCookies(),
    ],
  });
}

/**
 * Better Auth is always enabled (NextAuth removed in 4.0).
 */
export function isBetterAuthEnabled(): boolean {
  return true;
}

/**
 * Get Better Auth Next.js route handlers (GET, POST).
 * Initializes Better Auth from IDP config on first call, caches the instance.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let initPromise: Promise<any> | null = null;

// Expose for server-side session access (decode-session.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export { cachedInstance as __betterAuthInstance };

export async function getBetterAuthInstance() {
  if (cachedInstance) return cachedInstance;

  if (!initPromise) {
    initPromise = getIDPClientConfig().then(config => {
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
export async function getBetterAuthHandler(): Promise<{ GET: (req: Request) => Promise<Response>; POST: (req: Request) => Promise<Response> } | null> {
  if (!isBetterAuthEnabled()) return null;

  const auth = await getBetterAuthInstance();
  return toNextJsHandler(auth);
}
