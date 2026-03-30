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
 */
export declare function buildBetterAuthProviders(config: IDPClientConfig): Record<string, BetterAuthSocialProvider>;
/**
 * Create Better Auth instance from IDP config.
 *
 * No database — runs in stateless mode with JWE cookie cache.
 * Call after getIDPClientConfig() resolves.
 */
export declare function createBetterAuthInstance(idpConfig: IDPClientConfig): import("better-auth").Auth<{
    baseURL: string;
    secret: string;
    socialProviders: Record<string, BetterAuthSocialProvider>;
    trustedOrigins: string[];
    secondaryStorage: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string, ttl?: number) => Promise<void>;
        delete: (key: string) => Promise<void>;
    };
    session: {
        cookieCache: {
            enabled: true;
            maxAge: number;
            refreshCache: false;
        };
    };
    databaseHooks: {
        session: {
            create: {
                after: (session: any) => Promise<void>;
            };
        };
    };
    advanced: {
        cookiePrefix: string;
        cookies: {
            session_token: {
                name: string;
            };
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
/**
 * Better Auth is always enabled (NextAuth removed in 4.0).
 */
export declare function isBetterAuthEnabled(): boolean;
/**
 * Get Better Auth Next.js route handlers (GET, POST).
 * Initializes Better Auth from IDP config on first call, caches the instance.
 */
declare let cachedInstance: any;
export { cachedInstance as __betterAuthInstance };
export declare function getBetterAuthInstance(): Promise<any>;
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
export declare function getBetterAuthHandler(): Promise<{
    GET: (req: Request) => Promise<Response>;
    POST: (req: Request) => Promise<Response>;
} | null>;
