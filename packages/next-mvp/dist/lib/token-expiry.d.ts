export interface TokenExpiryOptions {
    accessToken?: string;
    refreshToken?: string;
    preferJwt?: boolean;
    fallbackAccessMs?: number;
    fallbackRefreshMs?: number;
}
export interface TokenExpiryResult {
    accessTokenExpires: number;
    refreshTokenExpires?: number;
    decodedAccessToken?: any;
    decodedRefreshToken?: any;
}
export declare function computeTokenExpiries(opts: TokenExpiryOptions): TokenExpiryResult;
