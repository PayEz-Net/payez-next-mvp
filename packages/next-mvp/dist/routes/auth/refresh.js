"use strict";
/**
 * Ready-to-Use Refresh Token Route
 *
 * Provides a pre-configured refresh handler that can be imported directly
 * into your app's API routes with zero configuration.
 *
 * @example
 * ```typescript
 * // app/api/auth/refresh/route.ts
 * export { POST } from '@payez/next-mvp/routes/auth/refresh';
 * ```
 *
 * @version 2.0.0
 * @since auth-ready-v2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const refresh_1 = require("../../api-handlers/auth/refresh");
// Configuration is read at runtime from environment.
function getConfig() {
    const idpBaseUrl = process.env.IDP_URL;
    if (!idpBaseUrl) {
        throw new Error('[IDP_URL] FATAL: IDP_URL environment variable is REQUIRED.');
    }
    return {
        idpBaseUrl,
        clientId: process.env.CLIENT_ID || process.env.NEXT_PUBLIC_IDP_CLIENT_ID || '',
        refreshEndpoint: process.env.REFRESH_ENDPOINT || '/api/ExternalAuth/refresh',
    };
}
/**
 * Pre-configured POST handler for token refresh
 *
 * Environment variables used:
 * - IDP_URL (REQUIRED)
 * - CLIENT_ID or NEXT_PUBLIC_IDP_CLIENT_ID (required)
 * - REFRESH_ENDPOINT (default: /api/ExternalAuth/refresh)
 */
let _handler = null;
async function POST(req) {
    if (!_handler) {
        _handler = (0, refresh_1.createRefreshHandler)(getConfig());
    }
    return _handler(req);
}
