/**
 * Authentication Login API Handler
 *
 * Handles user authentication against the external IDP service.
 * This handler is designed to be imported and used by Next.js applications
 * using the @payez/next-mvp package.
 *
 * @version 2.0
 * @requires No authentication (public endpoint)
 */
import { NextRequest, NextResponse } from 'next/server';
interface LoginConfig {
    idpBaseUrl: string;
    clientId: string;
    loginEndpoint?: string;
    clientType?: string;
}
/**
 * Creates a login handler for Next.js API routes
 *
 * @param config Configuration for IDP connection
 * @returns Next.js POST handler function
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/login/route.ts
 * import { createLoginHandler } from '@payez/next-mvp/api-handlers/auth/login';
 *
 * export const POST = createLoginHandler({
 *   idpBaseUrl: process.env.IDP_URL!,
 *   clientId: process.env.CLIENT_ID!,
 *   loginEndpoint: '/api/ExternalAuth/login'
 * });
 * ```
 */
export declare function createLoginHandler(config: LoginConfig): (req: NextRequest) => Promise<NextResponse<unknown>>;
/**
 * Default export for backward compatibility
 * Requires environment variables: IDP_URL, CLIENT_ID
 */
export declare const POST: (req: NextRequest) => Promise<NextResponse<unknown>>;
export {};
