export interface EnsureFreshConfig {
    idpBaseUrl: string;
    clientId: string;
    refreshEndpoint?: string;
}
export interface EnsureFreshOptions {
    /** Refresh if the access token is within this many ms of expiry. Default 60_000. */
    safetyWindowMs?: number;
    /** Max wait while another caller holds the refresh lock. Default 5000. */
    lockWaitMs?: number;
    /** Optional caller request id for lock attribution. */
    requestId?: string;
}
export type EnsureFreshResult = {
    ok: true;
    accessToken: string;
    accessTokenExpires: number;
    /** True if we refreshed (or a concurrent refresh completed); false if the stored token was already fresh. */
    refreshed: boolean;
} | {
    ok: false;
    code: string;
    message: string;
    status: number;
    terminal?: boolean;
    discardToken?: boolean;
    retryable?: boolean;
    resolution?: string;
};
export declare function ensureFreshAccessToken(sessionToken: string, config: EnsureFreshConfig, options?: EnsureFreshOptions): Promise<EnsureFreshResult>;
