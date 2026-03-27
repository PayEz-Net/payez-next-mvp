import { NextRequest } from 'next/server';
/**
 * Centralized IDP fetch helper
 * - Injects Bearer from Redis session
 * - If access token is expired/near-expiry, triggers one refresh and retries fetch once
 * - Returns parsed JSON and HTTP status
 */
export interface IdpFetchResult<T = any> {
    ok: boolean;
    status: number;
    json: T | null;
    attemptedRefresh: boolean;
}
export declare function idpFetchJSON<T = any>(req: NextRequest, targetUrl: string, init?: RequestInit): Promise<IdpFetchResult<T>>;
