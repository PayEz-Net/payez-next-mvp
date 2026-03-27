export declare function isRefreshTokenValid(token: string): boolean;
export declare function isRefreshTokenExpiring(token: string, bufferMinutes?: number): boolean;
export declare function getRefreshTokenExpiration(token: string): number | null;
export declare function getRefreshTokenTimeRemaining(token: string): number | null;
export interface RefreshViabilityCheck {
    canRefresh: boolean;
    reason: 'valid_refresh_token' | 'no_refresh_token' | 'refresh_token_expired' | 'session_missing';
    timeRemaining?: number;
    expiresAt?: string;
    accessTokenExpired?: boolean;
    accessTokenTimeRemaining?: number;
}
export declare function checkRefreshViability(sessionData: any): RefreshViabilityCheck;
