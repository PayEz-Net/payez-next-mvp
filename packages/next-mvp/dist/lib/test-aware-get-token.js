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
const logger_1 = require("../config/logger");
const auth_1 = require("../server/auth");
const app_slug_1 = require("./app-slug");
async function getTokenTestAware(req) {
    if (process.env.TEST_MODE === 'true') {
        try {
            let secret = process.env.NEXTAUTH_SECRET;
            if (!secret || secret.trim() === '') {
                const { getIDPClientConfig } = await Promise.resolve().then(() => __importStar(require('./idp-client-config')));
                const idpConfig = await getIDPClientConfig();
                secret = idpConfig.nextAuthSecret;
            }
            // Use app-slug prefixed cookie name
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
    // Production path: use Better Auth session
    const session = await (0, auth_1.getSession)(req);
    if (!session)
        return null;
    // Return a token-like object for backward compatibility with callers
    // that access token.sub, token.email, token.sessionToken, token.roles, etc.
    return {
        sub: session.user?.id,
        email: session.user?.email,
        name: session.user?.name,
        sessionToken: session.session?.token,
        roles: session.user?.roles || [],
        ...(session.user || {}),
    };
}
