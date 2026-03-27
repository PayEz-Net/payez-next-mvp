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

import 'server-only';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import type { IDPClientConfig } from '../lib/idp-client-config';

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
 * Replaces buildOAuthProviders() from providers/oauth.ts.
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
      nextCookies(),
    ],
  });
}
