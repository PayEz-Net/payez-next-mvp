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

import { createRefreshHandler } from '../../api-handlers/auth/refresh';
import { getIDPClientConfig } from '../../lib/idp-client-config';

// Configuration is read at runtime from IDP config (cached)
async function getConfig() {
  const idpConfig = await getIDPClientConfig();
  const idpBaseUrl = process.env.IDP_URL;
  if (!idpBaseUrl) {
    throw new Error('[IDP_URL] FATAL: IDP_URL environment variable is REQUIRED.');
  }
  return {
    idpBaseUrl,
    clientId: process.env.CLIENT_ID || process.env.NEXT_PUBLIC_IDP_CLIENT_ID || '',
    nextAuthSecret: idpConfig.nextAuthSecret || '',
    refreshEndpoint: process.env.REFRESH_ENDPOINT || '/api/ExternalAuth/refresh',
  };
}

/**
 * Pre-configured POST handler for token refresh
 *
 * Environment variables used:
 * - IDP_URL (REQUIRED)
 * - CLIENT_ID or NEXT_PUBLIC_IDP_CLIENT_ID (required)
 * - NEXTAUTH_SECRET (required)
 * - REFRESH_ENDPOINT (default: /api/ExternalAuth/refresh)
 */
let _handler: ReturnType<typeof createRefreshHandler> | null = null;

import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  if (!_handler) {
    const config = await getConfig();
    _handler = createRefreshHandler(config);
  }
  return _handler(req);
}