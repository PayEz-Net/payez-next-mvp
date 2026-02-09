"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRefreshTokenValid = isRefreshTokenValid;
exports.isRefreshTokenExpiring = isRefreshTokenExpiring;
exports.getRefreshTokenExpiration = getRefreshTokenExpiration;
exports.getRefreshTokenTimeRemaining = getRefreshTokenTimeRemaining;
exports.checkRefreshViability = checkRefreshViability;
const jwt_decode_1 = require("./jwt-decode");
const logger_1 = require("../config/logger");
function isRefreshTokenValid(token) {
    if (!token)
        return false;
    try {
        const decoded = (0, jwt_decode_1.jwtDecode)(token);
        if (!decoded)
            return false;
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp < now)
            return false;
        if (decoded.token_type !== 'refresh_token')
            return false;
        return true;
    }
    catch {
        return false;
    }
}
function isRefreshTokenExpiring(token, bufferMinutes = 60) {
    if (!token)
        return true;
    try {
        const decoded = (0, jwt_decode_1.jwtDecode)(token);
        if (!decoded?.exp)
            return true;
        const now = Math.floor(Date.now() / 1000);
        const buffer = bufferMinutes * 60;
        return decoded.exp <= (now + buffer);
    }
    catch {
        return true;
    }
}
function getRefreshTokenExpiration(token) {
    if (!token)
        return null;
    try {
        const decoded = (0, jwt_decode_1.jwtDecode)(token);
        if (!decoded?.exp)
            return null;
        return decoded.exp * 1000;
    }
    catch {
        return null;
    }
}
function getRefreshTokenTimeRemaining(token) {
    if (!token)
        return null;
    try {
        const decoded = (0, jwt_decode_1.jwtDecode)(token);
        if (!decoded?.exp)
            return null;
        const now = Math.floor(Date.now() / 1000);
        const timeRemaining = decoded.exp - now;
        return timeRemaining > 0 ? timeRemaining : null;
    }
    catch {
        return null;
    }
}
function checkRefreshViability(sessionData) {
    if (!sessionData)
        return { canRefresh: false, reason: 'session_missing' };
    let accessTokenExpired = false;
    let accessTokenTimeRemaining;
    if (sessionData.idpAccessTokenExpires) {
        const now = Date.now();
        let expiresAtMs = sessionData.idpAccessTokenExpires;
        if (typeof expiresAtMs === 'string')
            expiresAtMs = parseInt(expiresAtMs, 10);
        if (expiresAtMs < 1000000000000)
            expiresAtMs = expiresAtMs * 1000;
        accessTokenTimeRemaining = Math.floor((expiresAtMs - now) / 1000);
        const bufferSec = 5 * 60; // 5 minutes pre-expiry buffer
        accessTokenExpired = accessTokenTimeRemaining <= bufferSec;
        logger_1.tokenRefreshLogger.debug('[REFRESH_VIABILITY] Access token expiration check', { now, expiresAtMs, accessTokenTimeRemaining, bufferSec, accessTokenExpired });
    }
    if (!sessionData.idpRefreshToken)
        return { canRefresh: false, reason: 'no_refresh_token', accessTokenExpired, accessTokenTimeRemaining };
    if (sessionData.idpRefreshTokenExpires) {
        let refreshExpMs = sessionData.idpRefreshTokenExpires;
        if (typeof refreshExpMs === 'string')
            refreshExpMs = parseInt(refreshExpMs, 10);
        if (refreshExpMs < 1000000000000)
            refreshExpMs = refreshExpMs * 1000;
        const nowMs = Date.now();
        const timeRemainingSec = Math.floor((refreshExpMs - nowMs) / 1000);
        if (timeRemainingSec <= 0)
            return { canRefresh: false, reason: 'refresh_token_expired', accessTokenExpired, accessTokenTimeRemaining };
        return { canRefresh: true, reason: 'valid_refresh_token', timeRemaining: timeRemainingSec, expiresAt: new Date(refreshExpMs).toISOString(), accessTokenExpired, accessTokenTimeRemaining };
    }
    try {
        const decoded = (0, jwt_decode_1.jwtDecode)(sessionData.idpRefreshToken);
        const nowSec = Math.floor(Date.now() / 1000);
        if (!decoded?.exp || decoded.token_type !== 'refresh_token')
            return { canRefresh: false, reason: 'refresh_token_expired', accessTokenExpired, accessTokenTimeRemaining };
        const timeRemaining = decoded.exp - nowSec;
        if (timeRemaining <= 0)
            return { canRefresh: false, reason: 'refresh_token_expired', accessTokenExpired, accessTokenTimeRemaining };
        const expiresAtIso = new Date(decoded.exp * 1000).toISOString();
        return { canRefresh: true, reason: 'valid_refresh_token', timeRemaining, expiresAt: expiresAtIso, accessTokenExpired, accessTokenTimeRemaining };
    }
    catch (error) {
        logger_1.tokenRefreshLogger.debug('[REFRESH_VIABILITY] Failed to decode refresh token for viability', { error: error instanceof Error ? error.message : String(error) });
        return { canRefresh: false, reason: 'refresh_token_expired', accessTokenExpired, accessTokenTimeRemaining };
    }
}
