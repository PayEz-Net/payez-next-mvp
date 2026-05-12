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
import { type MagicLinkOptions } from 'better-auth/plugins/magic-link';
import type { IDPClientConfig } from '../lib/idp-client-config';
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
export declare function buildBetterAuthProviders(config: IDPClientConfig): Record<string, BetterAuthSocialProvider>;
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
export declare function createBetterAuthInstance(idpConfig: IDPClientConfig, opts?: CreateBetterAuthInstanceOptions): import("better-auth").Auth<{
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
            enabled: false;
            maxAge: number;
            refreshCache: false;
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
    }, ...{
        id: "magic-link";
        endpoints: {
            signInMagicLink: import("better-auth").StrictEndpoint<"/sign-in/magic-link", {
                method: "POST";
                requireHeaders: true;
                body: import("better-auth").ZodObject<{
                    email: import("better-auth").ZodEmail;
                    name: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                    callbackURL: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                    newUserCallbackURL: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                    errorCallbackURL: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                    metadata: import("better-auth").ZodOptional<import("better-auth").ZodRecord<import("better-auth").ZodString, import("better-auth").ZodAny>>;
                }, import("better-auth").$strip>;
                metadata: {
                    openapi: {
                        operationId: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                status: {
                                                    type: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                status: boolean;
            }>;
            magicLinkVerify: import("better-auth").StrictEndpoint<"/magic-link/verify", {
                method: "GET";
                query: import("better-auth").ZodObject<{
                    token: import("better-auth").ZodString;
                    callbackURL: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                    errorCallbackURL: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                    newUserCallbackURL: import("better-auth").ZodOptional<import("better-auth").ZodString>;
                }, import("better-auth").$strip>;
                use: ((inputContext: import("better-auth").MiddlewareInputContext<import("better-auth").MiddlewareOptions>) => Promise<void>)[];
                requireHeaders: true;
                metadata: {
                    openapi: {
                        operationId: string;
                        description: string;
                        responses: {
                            200: {
                                description: string;
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object";
                                            properties: {
                                                session: {
                                                    $ref: string;
                                                };
                                                user: {
                                                    $ref: string;
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            }, {
                token: string;
                user: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    email: string;
                    emailVerified: boolean;
                    name: string;
                    image?: string | null | undefined;
                };
            }>;
        };
        rateLimit: {
            pathMatcher(path: string): boolean;
            window: number;
            max: number;
        }[];
        options: MagicLinkOptions;
    }[]];
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
export declare function configureBetterAuth(opts: CreateBetterAuthInstanceOptions): void;
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
/**
 * Exchange OAuth identity for IDP tokens and store in the BA Redis session.
 *
 * Call this from the OAuth callback route AFTER better-auth has processed the
 * callback and created the session. Reads the session token from the Set-Cookie
 * header of the response to find the BA Redis key.
 *
 * This replaces the old databaseHooks approach which doesn't fire in stateless mode.
 */
export declare function exchangeOAuthForIdpTokens(sessionToken: string, provider?: string): Promise<boolean>;
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
export declare function createAuthGetHandler(loginPath?: string): (request: Request) => Promise<Response>;
