/**
 * =============================================================================
 * VIBE ENTERPRISE AUTHENTICATION
 * =============================================================================
 *
 * Server-side HMAC authentication for enterprise/service account requests.
 * Validates incoming requests with X-Vibe-Client-Id, X-Vibe-Timestamp, and
 * X-Vibe-Signature headers.
 *
 * Usage in Next.js API routes:
 *   import { validateEnterpriseAuth, hasEnterpriseAuthHeaders } from '@payez/next-mvp/vibe/enterprise-auth'
 *
 *   export async function GET(request: NextRequest) {
 *     if (hasEnterpriseAuthHeaders(request)) {
 *       const auth = await validateEnterpriseAuth(request, ENTERPRISE_CLIENTS);
 *       if (!auth.success) {
 *         return NextResponse.json({ error: auth.error }, { status: 401 });
 *       }
 *       // Use auth.clientId for authenticated requests
 *     }
 *   }
 *
 * =============================================================================
 */

import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Enterprise client credentials configuration
 * Maps client IDs to their HMAC secret keys (base64-encoded)
 */
export interface EnterpriseClientsConfig {
  [clientId: string]: string; // clientId -> base64-encoded secret key
}

export interface EnterpriseAuthResult {
  success: boolean;
  clientId?: string;
  error?: string;
}

/**
 * Validates enterprise HMAC authentication headers on incoming requests.
 *
 * Expected headers:
 * - X-Vibe-Client-Id: The client identifier
 * - X-Vibe-Timestamp: Unix timestamp in seconds
 * - X-Vibe-Signature: HMAC-SHA256 signature of "{timestamp}|{method}|{path}"
 *
 * Security features:
 * - Constant-time signature comparison (prevents timing attacks)
 * - Timestamp validation with 5-minute window (prevents replay attacks)
 * - Base64-encoded secret keys
 *
 * @param request - The Next.js request object
 * @param enterpriseClients - Map of client IDs to secret keys
 * @returns Authentication result with success status and client ID
 *
 * @example
 * const CLIENTS = {
 *   'vibe_abc123': 'base64SecretKey=='
 * };
 * const result = await validateEnterpriseAuth(request, CLIENTS);
 * if (result.success) {
 *   console.log(`Authenticated client: ${result.clientId}`);
 * }
 */
export async function validateEnterpriseAuth(
  request: NextRequest,
  enterpriseClients: EnterpriseClientsConfig
): Promise<EnterpriseAuthResult> {
  // Check for required headers
  const clientId = request.headers.get('X-Vibe-Client-Id');
  const timestamp = request.headers.get('X-Vibe-Timestamp');
  const signature = request.headers.get('X-Vibe-Signature');

  // If any header is missing, this is not an enterprise auth request
  if (!clientId || !timestamp || !signature) {
    return {
      success: false,
      error: 'MISSING_ENTERPRISE_HEADERS'
    };
  }

  // Validate client ID exists in configuration
  const secretKey = enterpriseClients[clientId];
  if (!secretKey) {
    return {
      success: false,
      error: 'INVALID_CLIENT_ID'
    };
  }

  // Validate timestamp is recent (within 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp, 10);

  if (isNaN(requestTime)) {
    return {
      success: false,
      error: 'INVALID_TIMESTAMP'
    };
  }

  const timeDiff = Math.abs(now - requestTime);
  if (timeDiff > 300) { // 5 minutes
    return {
      success: false,
      error: 'TIMESTAMP_EXPIRED'
    };
  }

  // Compute expected signature
  // Format: "{timestamp}|{method}|{path}"
  const method = request.method;
  const url = new URL(request.url);
  const path = url.pathname;

  const message = `${timestamp}|${method}|${path}`;
  const expectedSignature = crypto
    .createHmac('sha256', Buffer.from(secretKey, 'base64'))
    .update(message)
    .digest('base64');

  // Compare signatures (constant-time comparison to prevent timing attacks)
  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )) {
    return {
      success: false,
      error: 'INVALID_SIGNATURE'
    };
  }

  // Enterprise auth successful
  return {
    success: true,
    clientId
  };
}

/**
 * Checks if request has enterprise authentication headers.
 * Does not validate - just checks if all required headers are present.
 *
 * @param request - The Next.js request object
 * @returns True if all enterprise auth headers are present
 *
 * @example
 * if (hasEnterpriseAuthHeaders(request)) {
 *   // Validate the headers
 *   const auth = await validateEnterpriseAuth(request, clients);
 * } else {
 *   // Fall back to user session auth
 *   const token = await ensureFreshToken(request);
 * }
 */
export function hasEnterpriseAuthHeaders(request: NextRequest): boolean {
  return !!(
    request.headers.get('X-Vibe-Client-Id') &&
    request.headers.get('X-Vibe-Timestamp') &&
    request.headers.get('X-Vibe-Signature')
  );
}

/**
 * Generates HMAC signature for backend API requests.
 * Used when frontend needs to proxy enterprise auth requests to backend
 * with a different path (e.g., /api/vibe/* -> /v1/collections/*).
 *
 * @param clientId - The Vibe client ID
 * @param secretKey - Base64-encoded HMAC secret key
 * @param timestamp - Unix timestamp (seconds) as string
 * @param method - HTTP method (GET, POST, etc)
 * @param backendPath - The backend API path (e.g., "/v1/collections/agent_mail/tables")
 * @returns HMAC signature for the backend request
 *
 * @example
 * // Frontend received request for /api/vibe/agent_mail/tables
 * // Need to call backend at /v1/collections/agent_mail/tables
 * const signature = generateBackendHmacSignature(
 *   'vibe_abc123',
 *   'base64SecretKey==',
 *   '1234567890',
 *   'GET',
 *   '/v1/collections/agent_mail/tables'
 * );
 * // Use signature in backend request headers
 */
export function generateBackendHmacSignature(
  clientId: string,
  secretKey: string,
  timestamp: string,
  method: string,
  backendPath: string
): string {
  if (!secretKey) {
    throw new Error(`No secret key provided for client ID: ${clientId}`);
  }

  const message = `${timestamp}|${method}|${backendPath}`;
  return crypto
    .createHmac('sha256', Buffer.from(secretKey, 'base64'))
    .update(message)
    .digest('base64');
}
