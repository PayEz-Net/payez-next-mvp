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
export declare function fetchWithAuth(url: string, options?: RequestInit): Promise<Response>;
