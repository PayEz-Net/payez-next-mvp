/**
 * Server-side auth utilities for Better Auth.
 *
 * All server-side auth flows go through the Better Auth instance returned by
 * getAuthInstance(); use getSession(req) for the request-scoped session.
 */
import 'server-only';
import { type SessionData } from '../lib/session-store';
export type IdpTokenResult = {
    success: true;
    accessToken: string;
    sessionData: SessionData;
} | {
    success: false;
    error: 'NO_SESSION' | 'NO_TOKEN';
    terminal: true;
};
/**
 * Get the initialized Better Auth instance (singleton).
 */
export declare function getAuthInstance(): Promise<import("better-auth/types").Auth<{
    baseURL: string;
    secret: string;
    socialProviders: Record<string, import("../auth/better-auth").BetterAuthSocialProvider>;
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
                matcher(ctx: import("@better-auth/core").HookEndpointContext): boolean;
                handler: (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<void>;
            }[];
            after: {
                matcher(ctx: import("@better-auth/core").HookEndpointContext): true;
                handler: (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<void>;
            }[];
        };
    }, ...{
        id: "magic-link";
        endpoints: {
            signInMagicLink: import("better-call").StrictEndpoint<"/sign-in/magic-link", {
                method: "POST";
                requireHeaders: true;
                body: import("zod").ZodObject<{
                    email: import("zod").ZodEmail;
                    name: import("zod").ZodOptional<import("zod").ZodString>;
                    callbackURL: import("zod").ZodOptional<import("zod").ZodString>;
                    newUserCallbackURL: import("zod").ZodOptional<import("zod").ZodString>;
                    errorCallbackURL: import("zod").ZodOptional<import("zod").ZodString>;
                    metadata: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodAny>>;
                }, import("better-auth/*").$strip>;
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
            magicLinkVerify: import("better-call").StrictEndpoint<"/magic-link/verify", {
                method: "GET";
                query: import("zod").ZodObject<{
                    token: import("zod").ZodString;
                    callbackURL: import("zod").ZodOptional<import("zod").ZodString>;
                    errorCallbackURL: import("zod").ZodOptional<import("zod").ZodString>;
                    newUserCallbackURL: import("zod").ZodOptional<import("zod").ZodString>;
                }, import("better-auth/*").$strip>;
                use: ((inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<void>)[];
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
        options: import("better-auth/plugins/magic-link").MagicLinkOptions;
    }[]];
}>>;
/**
 * Get the current session from a request.
 *
 * Source-of-truth contract: **Redis is canonical for liveness.** Better Auth's
 * cookie+cache layer is treated as a SESSION POINTER (it owns the signed-cookie
 * secret and the canonical cookie parse) but does NOT decide whether a session
 * is alive. If Better Auth's primary path returns null or a partial session
 * (cookie cache miss, secondary storage eviction, token rotation), we fall
 * back to manually extracting the session-token claim from the cookie and
 * querying the canonical Redis store directly.
 *
 * This closes the asymmetric early-exit that caused contradictory answers
 * within milliseconds in production traces:
 *   GET /api/session/viability    → 200 (Redis: alive)
 *   GET /api/session/idp-token    → 200 (Redis: alive)
 *   getFreshIdpToken              → NO_SESSION (Better Auth cache miss)
 *
 * Returns the session object or null if not authenticated per Redis.
 */
export declare function getSession(request?: Request): Promise<any>;
/**
 * Get normalized session data for the current request.
 *
 * This prefers the app's Redis session because it carries the canonical
 * IDP token, roles, and tenant-specific user identity used by app routes.
 */
export declare function getSessionData(request?: Request): Promise<SessionData | null>;
/**
 * Get the current request's IDP access token without triggering a refresh.
 *
 * Use this for routes that only need the currently-issued bearer token and
 * should fail closed instead of performing token lifecycle work. For backend
 * proxy routes that forward the token to a downstream API, prefer
 * `getFreshIdpToken` — it preflights expiry and refreshes single-flight, so
 * the proxy never sends a credential it already knows is invalid.
 */
export declare function getIdpToken(request?: Request): Promise<IdpTokenResult>;
export type FreshIdpTokenResult = {
    success: true;
    accessToken: string;
    sessionData: SessionData;
    refreshed: boolean;
} | {
    success: false;
    error: string;
    status: number;
    terminal?: boolean;
    discardToken?: boolean;
    retryable?: boolean;
    resolution?: string;
};
export interface FreshIdpTokenConfig {
    idpBaseUrl: string;
    clientId: string;
    refreshEndpoint?: string;
    /** Refresh if the access token is within this many ms of expiry. Default 60_000. */
    safetyWindowMs?: number;
}
/**
 * Get the current request's IDP access token, preflight-refreshing if it is
 * expired or within the safety window. Single-flight via Redis lock, so
 * concurrent calls on the same session share one IDP round-trip and one
 * single-use refresh-token consumption.
 *
 * Use this in proxy routes. The returned `accessToken` is safe to forward to
 * a downstream API without expecting a 401. If `success` is false, surface a
 * 401/redirect — there is no recoverable token for this session.
 */
export declare function getFreshIdpToken(request: Request | undefined, config: FreshIdpTokenConfig): Promise<FreshIdpTokenResult>;
/**
 * Get the current session, throwing if not authenticated.
 * Use in API handlers that require auth.
 */
export declare function requireSession(request: Request): Promise<any>;
