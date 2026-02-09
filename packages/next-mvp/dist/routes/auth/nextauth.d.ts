/**
 * Ready-to-Use NextAuth Route Handler
 *
 * Provides a pre-configured NextAuth handler that uses dynamic OAuth providers
 * loaded from IDP at startup via getAuthOptions().
 *
 * @version 2.2.0 - Dynamic provider loading from IDP
 * @since auth-ready-v2-hotfix
 */
/**
 * GET handler for NextAuth
 * Uses async factory to get dynamic providers from IDP
 */
export declare function GET(request: Request, context: any): Promise<any>;
/**
 * POST handler for NextAuth
 * Uses async factory to get dynamic providers from IDP
 */
export declare function POST(request: Request, context: any): Promise<any>;
