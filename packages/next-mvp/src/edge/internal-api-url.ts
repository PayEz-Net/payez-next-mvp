/**
 * Internal API URL Utility for Edge Runtime
 *
 * INTERNAL_API_URL is REQUIRED. This is the URL for THIS application calling ITSELF.
 * Used for middleware to call its own API routes (e.g., /api/session/viability).
 *
 * WHY HTTP IS REQUIRED (not optional):
 * - This is the app calling its OWN backend within the same pod/container
 * - NextAuth cookies are encrypted based on request protocol
 * - TLS is terminated at ingress, so the pod receives HTTP internally
 * - Using HTTPS here causes cookie decryption failures
 * - This is NOT about "K8s internal traffic doesn't need TLS" - it's about
 *   protocol consistency for cookie encryption
 *
 * This is NOT for calling the IDP - use IDP_URL for that.
 *
 * For local dev, set INTERNAL_API_URL=http://localhost:3000 (or your dev port).
 *
 * @module edge/internal-api-url
 * @version 3.0.0
 */

import { NextRequest } from 'next/server';

/**
 * Get the internal API base URL for middleware to call its own API routes.
 *
 * THROWS if INTERNAL_API_URL is not set. No fallbacks.
 *
 * @param request - The Next.js request object (unused, kept for API compatibility)
 * @returns Base URL string for constructing internal API calls
 * @throws Error if INTERNAL_API_URL environment variable is not set
 *
 * @example
 * ```typescript
 * import { getInternalApiUrl } from '@payez/next-mvp/edge';
 *
 * export async function middleware(request: NextRequest) {
 *   const baseUrl = getInternalApiUrl(request);
 *   const apiUrl = new URL('/api/session/check', baseUrl);
 *
 *   const response = await fetch(apiUrl, {
 *     headers: {
 *       'Cookie': request.headers.get('cookie') || ''
 *     }
 *   });
 * }
 * ```
 *
 * @environment INTERNAL_API_URL - REQUIRED. URL for this app to call ITSELF.
 *   MUST be HTTP (not HTTPS) - see module docs for why.
 *   K8s: http://myapp.namespace.svc.cluster.local:80
 *   Local: http://localhost:3000
 */
export function getInternalApiUrl(request: NextRequest): string {
  const internalUrl = process.env.INTERNAL_API_URL;
  if (!internalUrl) {
    throw new Error(
      '[INTERNAL_API_URL] FATAL: INTERNAL_API_URL environment variable is REQUIRED. ' +
      'This is for the app to call ITSELF. MUST be HTTP (not HTTPS). ' +
      'Set to http://myapp.namespace.svc.cluster.local:80 (K8s) or http://localhost:3000 (local).'
    );
  }
  return internalUrl;
}
