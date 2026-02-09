/**
 * Centralized internal API helper for the app to call ITSELF.
 *
 * IMPORTANT: All calls from the Next.js server to its own API routes MUST use
 * these functions. Never use req.url, req.nextUrl.origin, or construct URLs
 * from the incoming request.
 *
 * WHY HTTP IS REQUIRED (not optional):
 * - This is the app calling its OWN backend within the same pod/container
 * - NextAuth cookies are encrypted based on request protocol
 * - TLS is terminated at ingress, so the pod receives HTTP internally
 * - Using HTTPS here causes cookie decryption failures and 403 errors
 * - This is NOT about "K8s traffic doesn't need TLS" - it's about
 *   protocol consistency for cookie/session encryption
 *
 * Environment:
 * - INTERNAL_API_URL: Required in production (e.g., http://service.namespace.svc.cluster.local:80)
 * - Falls back to http://localhost:3200 in development only
 */

/**
 * Get the internal API base URL for the app to call itself.
 *
 * @throws Error in production if INTERNAL_API_URL is not set
 * @returns The base URL (no trailing slash)
 */
export function getInternalApiUrl(): string {
  const url = process.env.INTERNAL_API_URL;
  if (url) return url.replace(/\/$/, ''); // strip trailing slash

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:3200';
  }

  throw new Error(
    '[INTERNAL_API_URL] FATAL: INTERNAL_API_URL environment variable is REQUIRED in production. ' +
    'This is for the app to call ITSELF. MUST be HTTP (not HTTPS) due to cookie encryption. ' +
    'Set to http://service.namespace.svc.cluster.local:80'
  );
}

/**
 * Options for internal fetch calls
 */
export interface InternalFetchOptions extends Omit<RequestInit, 'headers'> {
  /** Additional headers to include */
  headers?: Record<string, string>;
  /** Cookie header to forward (typically from req.headers.get('cookie')) */
  cookie?: string;
  /** Session token for x-session-token header */
  sessionToken?: string;
  /** Request ID for tracing */
  requestId?: string;
  /** Parse response as JSON (default: true) */
  parseJson?: boolean;
}

/**
 * Result of an internal fetch call
 */
export interface InternalFetchResult<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T | null;
  response: Response;
}

/**
 * Make a fetch call to an internal API route (app calling itself).
 *
 * @param path - The API path (e.g., '/api/auth/refresh')
 * @param options - Fetch options
 * @returns The fetch result with parsed data
 *
 * @example
 * ```ts
 * // Simple GET
 * const result = await internalFetch('/api/health');
 *
 * // POST with session
 * const result = await internalFetch('/api/auth/refresh', {
 *   method: 'POST',
 *   cookie: req.headers.get('cookie') || '',
 *   sessionToken: token.redisSessionId,
 *   body: JSON.stringify({ refresh_token: refreshToken }),
 * });
 * ```
 */
export async function internalFetch<T = unknown>(
  path: string,
  options: InternalFetchOptions = {}
): Promise<InternalFetchResult<T>> {
  const {
    headers: extraHeaders = {},
    cookie,
    sessionToken,
    requestId,
    parseJson = true,
    ...fetchOptions
  } = options;

  const baseUrl = getInternalApiUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  // Build headers
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (cookie) {
    headers['Cookie'] = cookie;
  }
  if (sessionToken) {
    headers['X-Session-Token'] = sessionToken;
  }
  if (requestId) {
    headers['X-Request-Id'] = requestId;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  let data: T | null = null;
  if (parseJson) {
    try {
      data = await response.json() as T;
    } catch {
      data = null;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    data,
    response,
  };
}

/**
 * Trigger a token refresh via the internal API.
 * This is a convenience wrapper for the common refresh pattern.
 *
 * @param cookie - The cookie header from the incoming request
 * @param sessionToken - The session token
 * @param refreshToken - Optional refresh token to include in body
 * @param requestId - Optional request ID for tracing
 * @returns Whether the refresh was successful
 */
export async function internalRefresh(
  cookie: string,
  sessionToken: string,
  refreshToken?: string,
  requestId?: string
): Promise<{ ok: boolean; status: number }> {
  const result = await internalFetch('/api/auth/refresh', {
    method: 'POST',
    cookie,
    sessionToken,
    requestId,
    body: refreshToken ? JSON.stringify({ refresh_token: refreshToken }) : undefined,
  });

  return { ok: result.ok, status: result.status };
}
