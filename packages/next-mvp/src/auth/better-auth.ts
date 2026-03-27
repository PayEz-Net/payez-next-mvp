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
  return betterAuth({
    secret: idpConfig.nextAuthSecret as string,

    socialProviders: buildBetterAuthProviders(idpConfig),

    // Trust the app's own origin + any configured base URL
    trustedOrigins: [
      ...(idpConfig.baseClientUrl ? [idpConfig.baseClientUrl] : []),
      ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
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

    plugins: [
      nextCookies(),
    ],
  });
}

/**
 * Check if Better Auth is enabled via flag.
 */
export function isBetterAuthEnabled(): boolean {
  return process.env.USE_BETTER_AUTH === 'true';
}

/**
 * Get Better Auth Next.js route handlers (GET, POST).
 * Initializes Better Auth from IDP config on first call, caches the instance.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedInstance: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let initPromise: Promise<any> | null = null;

async function getBetterAuthInstance() {
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
