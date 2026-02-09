/**
 * Ready-to-Use NextAuth Route Handler
 *
 * Provides a pre-configured NextAuth handler that uses dynamic OAuth providers
 * loaded from IDP at startup via getAuthOptions().
 *
 * @version 2.2.0 - Dynamic provider loading from IDP
 * @since auth-ready-v2-hotfix
 */

import NextAuth from 'next-auth';
import { authOptions, getAuthOptions } from '../../auth/auth-options';

// Cached handler - built once with dynamic providers
let cachedHandler: ReturnType<typeof NextAuth> | null = null;
let handlerPromise: Promise<ReturnType<typeof NextAuth>> | null = null;

/**
 * Get or build the NextAuth handler with dynamic providers.
 * Uses caching to avoid rebuilding on every request.
 */
async function getHandler(): Promise<ReturnType<typeof NextAuth>> {
    // Return cached if available
    if (cachedHandler) {
        return cachedHandler;
    }

    // Prevent concurrent builds
    if (handlerPromise) {
        return handlerPromise;
    }

    handlerPromise = (async () => {
        try {
            // Try to get dynamic auth options from IDP
            const options = await getAuthOptions();
            console.log('[NEXTAUTH_ROUTE] Built handler with dynamic providers');
            cachedHandler = NextAuth(options);
            return cachedHandler;
        } catch (error) {
            // Fallback to static options if IDP unavailable
            console.warn('[NEXTAUTH_ROUTE] Failed to get dynamic options, using static fallback:', {
                error: error instanceof Error ? error.message : String(error)
            });
            cachedHandler = NextAuth(authOptions);
            return cachedHandler;
        } finally {
            handlerPromise = null;
        }
    })();

    return handlerPromise;
}

/**
 * GET handler for NextAuth
 * Uses async factory to get dynamic providers from IDP
 */
export async function GET(request: Request, context: any) {
    const handler = await getHandler();
    return handler(request, context);
}

/**
 * POST handler for NextAuth
 * Uses async factory to get dynamic providers from IDP
 */
export async function POST(request: Request, context: any) {
    const handler = await getHandler();
    return handler(request, context);
}