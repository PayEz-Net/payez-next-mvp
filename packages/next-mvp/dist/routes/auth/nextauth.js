"use strict";
/**
 * Ready-to-Use NextAuth Route Handler
 *
 * Provides a pre-configured NextAuth handler that uses dynamic OAuth providers
 * loaded from IDP at startup via getAuthOptions().
 *
 * @version 2.2.0 - Dynamic provider loading from IDP
 * @since auth-ready-v2-hotfix
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const next_auth_1 = __importDefault(require("next-auth"));
const auth_options_1 = require("../../auth/auth-options");
// Cached handler - built once with dynamic providers
let cachedHandler = null;
let handlerPromise = null;
/**
 * Get or build the NextAuth handler with dynamic providers.
 * Uses caching to avoid rebuilding on every request.
 */
async function getHandler() {
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
            const options = await (0, auth_options_1.getAuthOptions)();
            console.log('[NEXTAUTH_ROUTE] Built handler with dynamic providers');
            cachedHandler = (0, next_auth_1.default)(options);
            return cachedHandler;
        }
        catch (error) {
            // Fallback to static options if IDP unavailable
            console.warn('[NEXTAUTH_ROUTE] Failed to get dynamic options, using static fallback:', {
                error: error instanceof Error ? error.message : String(error)
            });
            cachedHandler = (0, next_auth_1.default)(auth_options_1.authOptions);
            return cachedHandler;
        }
        finally {
            handlerPromise = null;
        }
    })();
    return handlerPromise;
}
/**
 * GET handler for NextAuth
 * Uses async factory to get dynamic providers from IDP
 */
async function GET(request, context) {
    const handler = await getHandler();
    return handler(request, context);
}
/**
 * POST handler for NextAuth
 * Uses async factory to get dynamic providers from IDP
 */
async function POST(request, context) {
    const handler = await getHandler();
    return handler(request, context);
}
