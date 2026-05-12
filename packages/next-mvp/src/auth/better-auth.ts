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
import { magicLink, type MagicLinkOptions } from 'better-auth/plugins/magic-link';
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
  prompt?: string;
  accessType?: 'offline' | 'online';
  hd?: string;
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
    const additionalParams = oauth.additionalParams ?? {};
    const rawPrompt = additionalParams.prompt;
    const rawAccessType = additionalParams.accessType ?? additionalParams.access_type;
    const rawHostedDomain = additionalParams.hd;

    // Ensure profile scope is present for Google so avatar image is returned
    const scopes = oauth.scopes?.split(' ') || [];
    if (name === 'google' && !scopes.includes('profile')) {
      scopes.push('profile');
    }

    providers[name] = {
      clientId: oauth.clientId,
      clientSecret: oauth.clientSecret,
      scope: scopes.length > 0 ? scopes : undefined,
      // Google is overly eager to reuse the last account unless we
      // explicitly ask for account selection on each social login.
      prompt: typeof rawPrompt === 'string'
        ? rawPrompt
        : name === 'google'
          ? 'select_account'
          : undefined,
      accessType: rawAccessType === 'online' ? 'online' : rawAccessType === 'offline' ? 'offline' : undefined,
      hd: typeof rawHostedDomain === 'string' ? rawHostedDomain : undefined,
    };
  }

  return providers;
}

/**
 * Optional configuration for `createBetterAuthInstance`.
 *
 * - `magicLink`: if provided, registers Better Auth's magic-link plugin.
 *   The host app supplies its own `sendMagicLink` callback — typically a
 *   fetch to its email service (e.g. ACP's `/v1/auth/magic-link/email`).
 *   Omit the `magicLink` key entirely to skip the plugin; the consuming
 *   app will not have a magic-link flow.
 */
export interface CreateBetterAuthInstanceOptions {
  magicLink?: MagicLinkOptions;
}

/**
 * Create Better Auth instance from IDP config.
 *
 * No database — runs in stateless mode with JWE cookie cache.
 * Call after getIDPClientConfig() resolves.
 */
export function createBetterAuthInstance(
  idpConfig: IDPClientConfig,
  opts: CreateBetterAuthInstanceOptions = {}
) {
  const appSlug = idpConfig.clientSlug || getAppSlug();

  // Resolve base URL: BETTER_AUTH_URL env > IDP config > localhost fallback
  // Must include /api/auth since that's where the catch-all route is mounted
  const rawBaseURL = process.env.BETTER_AUTH_URL
    || idpConfig.baseClientUrl
    || `http://localhost:${process.env.PORT || '3000'}`;
  const baseURL = rawBaseURL.replace(/\/+$/, '') + '/api/auth';

  return betterAuth({
    baseURL,
    secret: idpConfig.authSecret as string,

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
      // Cookie cache DISABLED — Redis is canonical for session liveness.
      //
      // Previously: enabled with maxAge 300 + refreshCache false. That cached
      // a decoded session in process memory for 5 minutes, bypassing Redis
      // reads during the window. Consequence: if the canonical app session
      // at `{slug}:{token}` was evicted, refreshed, or rotated mid-window,
      // Better Auth's in-memory copy stayed alive — and callers got
      // contradictory answers depending on whether they consulted Better
      // Auth (alive per cache) or Redis (dead/rotated). Documented contradiction
      // visible in production traces: viability 200 + idp-token 200 +
      // getFreshIdpToken NO_SESSION terminal within milliseconds.
      //
      // Trade-off: every Better Auth getSession() call now incurs one Redis
      // read on the secondary-storage path. Latency cost is acceptable
      // (sub-ms in-region) and the alternative is duplicate Layer-1
      // workarounds in every consumer app — already shipped in idealvibe.online
      // at b6a91f6.
      cookieCache: {
        enabled: false,
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
      nextCookies(),
      ...(opts.magicLink ? [magicLink(opts.magicLink)] : []),
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
let configuredOpts: CreateBetterAuthInstanceOptions = {};

// Expose for server-side session access (decode-session.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export { cachedInstance as __betterAuthInstance };

/**
 * Configure Better Auth instance options for this process.
 *
 * Must be called before the first auth request — before
 * `getBetterAuthInstance()` caches an instance. Typically called once at
 * app startup, e.g. from Next.js `instrumentation.ts` or an equivalent
 * server bootstrap hook.
 *
 * Throws if called after the instance has already been resolved: options
 * cannot be applied retroactively.
 */
export function configureBetterAuth(opts: CreateBetterAuthInstanceOptions): void {
  if (cachedInstance) {
    throw new Error(
      '[BETTER_AUTH] configureBetterAuth() must run before the instance is first resolved. ' +
      'Call it in Next.js instrumentation.ts or an equivalent startup hook.'
    );
  }
  configuredOpts = opts;
}

export async function getBetterAuthInstance() {
  if (cachedInstance) return cachedInstance;

  if (!initPromise) {
    initPromise = getIDPClientConfig(true).then(config => {
      const instance = createBetterAuthInstance(config, configuredOpts);
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

/**
 * Exchange OAuth identity for IDP tokens and store in the BA Redis session.
 *
 * Call this from the OAuth callback route AFTER better-auth has processed the
 * callback and created the session. Reads the session token from the Set-Cookie
 * header of the response to find the BA Redis key.
 *
 * This replaces the old databaseHooks approach which doesn't fire in stateless mode.
 */
export async function exchangeOAuthForIdpTokens(
  sessionToken: string,
  provider: string = 'google'
): Promise<boolean> {
  try {
    const config = await getIDPClientConfig();
    const appSlug = config.clientSlug || getAppSlug();
    const baKey = `ba:${appSlug}:${sessionToken}`;

    // Read the BA session from Redis
    const baRaw = await getRedis().get(baKey).catch(() => null);
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
        provider_account_id: email,  // Cross-System Identity Standard v1.1: always use verified email, never opaque session IDs
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

    let idpData: any;
    try { idpData = JSON.parse(oauthResText); } catch { return false; }
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
      image: image,
      roles: result.user?.roles || result.roles || [],
      mfaVerified: !requiresTwoFactor,
      idpClientId: result.client_id ? String(result.client_id) : undefined,
      merchantId: result.merchant_id ? String(result.merchant_id) : undefined,
    };

    // Store in BA Redis session (for decodeSession)
    baData.idpTokens = idpTokenData;
    await getRedis().setex(baKey, 7 * 24 * 60 * 60, JSON.stringify(baData));

    // Write to canonical session store so refresh handler and token lifecycle can find the tokens.
    // Key format: {sessionPrefix}{token} — same key that getSession() reads from.
    try {
      const { getSessionPrefix } = await import('../lib/app-slug');
      const canonicalKey = `${getSessionPrefix()}${sessionToken}`;
      await getRedis().setex(canonicalKey, 7 * 24 * 60 * 60, JSON.stringify({
        ...idpTokenData,
        oauthProvider: provider,
      }));
    } catch (canonicalErr) {
      console.warn('[BETTER_AUTH] Failed to write canonical session:', canonicalErr instanceof Error ? canonicalErr.message : String(canonicalErr));
    }

    console.log('[BETTER_AUTH] IDP tokens stored in session for', email);
    return true;
  } catch (err) {
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
export function createAuthGetHandler(loginPath: string = '/account-auth/login') {
  return async function GET(request: Request): Promise<Response> {
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
            .map((c: string) => c.split(';')[0])
            .join('; ');

          const headers = new Headers();
          headers.set('cookie', cookieHeader);

          const session = await auth.api.getSession({ headers });
          if (session?.session?.token) {
            console.log('[BETTER_AUTH] Got session token from callback:', session.session.token.substring(0, 10), '| email:', session.user?.email);
            await exchangeOAuthForIdpTokens(session.session.token);
          } else {
            console.warn('[BETTER_AUTH] Could not get session after OAuth callback');
          }
        }
      } catch (err: any) {
        console.error('[BETTER_AUTH] IDP token exchange failed:', err.message);
      }
    }

    return response;
  };
}
