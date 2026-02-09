"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTokenExpiries = computeTokenExpiries;
const jwt_decode_1 = require("./jwt-decode");
const logger_1 = require("../config/logger");
function computeTokenExpiries(opts) {
    const { accessToken, refreshToken, preferJwt = true, fallbackAccessMs, fallbackRefreshMs } = opts;
    let decodedAccessToken;
    let decodedRefreshToken;
    let accessMs;
    let refreshMs;
    if (preferJwt && accessToken) {
        try {
            decodedAccessToken = (0, jwt_decode_1.jwtDecode)(accessToken);
            if (decodedAccessToken?.exp)
                accessMs = decodedAccessToken.exp * 1000;
        }
        catch (e) {
            logger_1.logger.warn('[TOKEN_EXPIRY] Failed to decode access token', { error: e instanceof Error ? e.message : String(e) });
        }
    }
    if (accessMs === undefined && typeof fallbackAccessMs === 'number')
        accessMs = fallbackAccessMs;
    if (preferJwt && refreshToken) {
        try {
            decodedRefreshToken = (0, jwt_decode_1.jwtDecode)(refreshToken);
            if (decodedRefreshToken?.exp)
                refreshMs = decodedRefreshToken.exp * 1000;
        }
        catch (e) {
            logger_1.logger.warn('[TOKEN_EXPIRY] Failed to decode refresh token', { error: e instanceof Error ? e.message : String(e) });
        }
    }
    if (refreshMs === undefined && typeof fallbackRefreshMs === 'number')
        refreshMs = fallbackRefreshMs;
    if (typeof accessMs !== 'number')
        accessMs = Date.now();
    return { accessTokenExpires: accessMs, refreshTokenExpires: refreshMs, decodedAccessToken, decodedRefreshToken };
}
