/**
 * Ready-to-Use Auth Route Handler (Better Auth)
 *
 * Provides a pre-configured Better Auth handler that uses dynamic OAuth providers
 * loaded from IDP at startup.
 *
 * Replaces the former NextAuth handler. The file name is kept as nextauth.ts
 * to avoid breaking re-exports in routes/auth/index.ts.
 *
 * @version 4.0.0 - Better Auth migration
 * @since better-auth-4.0
 */
/**
 * GET handler for auth routes
 * Delegates to Better Auth instance.
 */
export declare function GET(request: Request): Promise<Response>;
/**
 * POST handler for auth routes
 * Delegates to Better Auth instance.
 */
export declare function POST(request: Request): Promise<Response>;
