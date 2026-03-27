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
export declare function buildBetterAuthProviders(config: IDPClientConfig): Record<string, BetterAuthSocialProvider>;
/**
 * Create Better Auth instance from IDP config.
 *
 * No database — runs in stateless mode with JWE cookie cache.
 * Call after getIDPClientConfig() resolves.
 */
export declare function createBetterAuthInstance(idpConfig: IDPClientConfig): import("better-auth").Auth<{
    secret: string;
    socialProviders: Record<string, BetterAuthSocialProvider>;
    session: {
        cookieCache: {
            enabled: true;
            maxAge: number;
            refreshCache: true;
        };
    };
    plugins: [{
        id: "next-cookies";
        hooks: {
            before: {
                matcher(ctx: import("better-auth").HookEndpointContext): boolean;
                handler: (inputContext: import("better-auth").MiddlewareInputContext<import("better-auth").MiddlewareOptions>) => Promise<void>;
            }[];
            after: {
                matcher(ctx: import("better-auth").HookEndpointContext): true;
                handler: (inputContext: import("better-auth").MiddlewareInputContext<import("better-auth").MiddlewareOptions>) => Promise<void>;
            }[];
        };
    }];
}>;
