"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenTestAware = getTokenTestAware;
const jwt_1 = require("next-auth/jwt");
const logger_1 = require("../config/logger");
const nextauth_secret_1 = require("./nextauth-secret");
const app_slug_1 = require("./app-slug");
async function getTokenTestAware(req) {
    let secret = process.env.NEXTAUTH_SECRET;
    if (!secret || secret.trim() === '') {
        try {
            secret = await (0, nextauth_secret_1.resolveNextAuthSecret)();
        }
        catch (e) {
            logger_1.logger.error('[GET_TOKEN] Failed to resolve NEXTAUTH_SECRET', { error: e instanceof Error ? e.message : String(e) });
            return null;
        }
    }
    if (process.env.TEST_MODE === 'true') {
        try {
            // Use app-slug prefixed cookie name (must match auth-options.ts)
            const cookieName = (0, app_slug_1.getSessionCookieName)();
            const cookies = req.headers.get('cookie');
            if (!cookies) {
                logger_1.logger.debug('[GET_TOKEN] No cookies in request');
                return null;
            }
            const cookieValue = cookies.split(';').find(c => c.trim().startsWith(`${cookieName}=`))?.split('=')[1];
            if (!cookieValue) {
                logger_1.logger.debug('[GET_TOKEN] Session token cookie not found');
                return null;
            }
            const { jwtVerify } = await Promise.resolve().then(() => __importStar(require('jose')));
            const secretKey = new TextEncoder().encode(secret);
            const { payload } = await jwtVerify(cookieValue, secretKey);
            logger_1.logger.debug('[GET_TOKEN] TEST_MODE token decoded:', { hasPayload: !!payload, redisSessionId: payload.redisSessionId, sub: payload.sub });
            return payload;
        }
        catch (error) {
            logger_1.logger.error('[GET_TOKEN] TEST_MODE token decode error:', { error: error instanceof Error ? error.message : String(error) });
            return null;
        }
    }
    // Use app-slug prefixed cookie name (must match auth-options.ts)
    // In production, NextAuth uses __Secure- prefix for cookies
    const cookieName = process.env.NODE_ENV === 'production' ? (0, app_slug_1.getSecureSessionCookieName)() : (0, app_slug_1.getSessionCookieName)();
    return await (0, jwt_1.getToken)({ req, secret, cookieName });
}
