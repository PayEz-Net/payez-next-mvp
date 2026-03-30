/**
 * Server-side auth utilities for Better Auth (v4.0)
 *
 * Replaces:
 * - getToken() from next-auth/jwt
 * - getServerSession() from next-auth
 *
 * All server-side auth flows go through the Better Auth instance.
 */
import 'server-only';
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
                matcher(ctx: import("@better-auth/core").HookEndpointContext): boolean;
                handler: (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<void>;
            }[];
            after: {
                matcher(ctx: import("@better-auth/core").HookEndpointContext): true;
                handler: (inputContext: import("better-call").MiddlewareInputContext<import("better-call").MiddlewareOptions>) => Promise<void>;
            }[];
        };
    }];
}>>;
/**
 * Get the current session from a request.
 * Replaces getToken() and getServerSession().
 *
 * Returns the session object or null if not authenticated.
 */
export declare function getSession(request?: Request): Promise<any>;
/**
 * Get the current session, throwing if not authenticated.
 * Use in API handlers that require auth.
 */
export declare function requireSession(request: Request): Promise<any>;
