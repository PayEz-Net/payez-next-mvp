// src/client/fetch-with-auth.ts
import { getSession } from 'next-auth/react';

/**
 * A wrapper for the `fetch` API that automatically injects the session's
 * accessToken into the Authorization header and handles 401 Unauthorized
 * responses by redirecting the user to the login page.
 *
 * @param url The URL to fetch.
 * @param options The standard `fetch` options.
 * @returns A `Promise` that resolves to the `Response` object.
 * @throws An 'UNAUTHORIZED_REDIRECT' error after initiating the redirect to halt further execution.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // 1. Retrieve the client-side session to get the accessToken.
  const session = await getSession();

  // 2. Inject the accessToken into the Authorization header.
  const headers = new Headers(options.headers);
  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }
  options.headers = headers;

  const response = await fetch(url, options);

  // 3. Handle the 401 response intelligently.
  if (response.status === 401) {
    // If we have a valid session, this is likely a claim/permission error, not an auth error
    if (session?.accessToken) {
      console.warn('API returned 401 despite valid session. Likely insufficient claims or permissions.');
      // Don't redirect - let the calling code handle the error gracefully
      return response;
    }

    // No valid session - this is a real authentication failure
    console.error('Unauthorized API call (no valid session). Redirecting to login.');
    // SAFEGUARD: Never use auth pages as callback URLs to prevent redirect loops
    const pathname = window.location.pathname;
    const safeCallbackUrl = pathname.startsWith('/account-auth/') ? '/' : pathname;
    window.location.href = `/account-auth/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`;

    // Throw a specific error to signal that a redirect has been initiated.
    throw new Error('UNAUTHORIZED_REDIRECT');
  }

  return response;
}