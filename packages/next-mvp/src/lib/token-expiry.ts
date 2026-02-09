import { jwtDecode } from './jwt-decode';
import { logger } from '../config/logger';

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

export function computeTokenExpiries(opts: TokenExpiryOptions): TokenExpiryResult {
  const { accessToken, refreshToken, preferJwt = true, fallbackAccessMs, fallbackRefreshMs } = opts;
  let decodedAccessToken: any | undefined;
  let decodedRefreshToken: any | undefined;
  let accessMs: number | undefined;
  let refreshMs: number | undefined;

  if (preferJwt && accessToken) {
    try { decodedAccessToken = jwtDecode(accessToken); if (decodedAccessToken?.exp) accessMs = decodedAccessToken.exp * 1000; }
    catch (e) { logger.warn('[TOKEN_EXPIRY] Failed to decode access token', { error: e instanceof Error ? e.message : String(e) }); }
  }
  if (accessMs === undefined && typeof fallbackAccessMs === 'number') accessMs = fallbackAccessMs;

  if (preferJwt && refreshToken) {
    try { decodedRefreshToken = jwtDecode(refreshToken); if (decodedRefreshToken?.exp) refreshMs = decodedRefreshToken.exp * 1000; }
    catch (e) { logger.warn('[TOKEN_EXPIRY] Failed to decode refresh token', { error: e instanceof Error ? e.message : String(e) }); }
  }
  if (refreshMs === undefined && typeof fallbackRefreshMs === 'number') refreshMs = fallbackRefreshMs;

  if (typeof accessMs !== 'number') accessMs = Date.now();
  return { accessTokenExpires: accessMs, refreshTokenExpires: refreshMs, decodedAccessToken, decodedRefreshToken };
}
