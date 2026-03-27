"use strict";
/**
 * Site Logger Utility
 *
 * Logs user activity events to the site_logs table via Redis buffer.
 * Fire-and-forget - logging failures never break the app.
 *
 * Uses Redis queue (vibe:site-logs:pending) which is drained by
 * DotNetPert's SiteLogDrainBackgroundService to Vibe site_logs table.
 *
 * @version 1.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.siteEvents = void 0;
exports.configureSiteLogger = configureSiteLogger;
exports.logSiteEvent = logSiteEvent;
exports.getClientIp = getClientIp;
const redis_1 = require("./redis");
// Redis key for site logs (separate from data_logs)
const REDIS_SITE_LOG_KEY = 'vibe:site-logs:pending';
const REDIS_LOG_TTL = 7 * 24 * 60 * 60; // 1 week
let _config = {};
/**
 * Configure the site logger with app-specific settings
 */
function configureSiteLogger(config) {
    _config = { ..._config, ...config };
}
/**
 * Log a site event to the site_logs table
 * Fire-and-forget - never awaited in critical path
 */
async function logSiteEvent(entry) {
    try {
        const redis = (0, redis_1.getRedis)();
        const logRecord = JSON.stringify({
            log_level: entry.level,
            category: entry.category,
            message: entry.message,
            context: entry.context || {},
            user_id: entry.user_id ? (typeof entry.user_id === 'number' ? entry.user_id : null) : null,
            session_id: entry.session_id || null,
            url: entry.url || null,
            user_agent: entry.user_agent || null,
            ip_address: entry.ip_address || null,
            created_at: new Date().toISOString(),
            app_slug: _config.app_slug || process.env.APP_SLUG || process.env.CLIENT_ID || 'unknown',
            vibe_client_id: _config.vibe_client_id || process.env.VIBE_CLIENT_ID || '',
        });
        // Fire and forget - use .then().catch() to not block
        console.log('[site-logger] Pushing to Redis:', REDIS_SITE_LOG_KEY, entry.category, entry.message);
        redis.lpush(REDIS_SITE_LOG_KEY, logRecord).then((result) => {
            console.log('[site-logger] Redis push success, queue length:', result);
            redis.expire(REDIS_SITE_LOG_KEY, REDIS_LOG_TTL).catch(() => { });
        }).catch(err => {
            console.error('[site-logger] Redis push failed:', err.message);
        });
    }
    catch (error) {
        // Fail silently - logging should never break the app
        console.error('[site-logger] Failed to log event:', error);
    }
}
/**
 * Helper to extract client IP from request headers
 */
function getClientIp(headers) {
    const getHeader = (name) => {
        if (headers instanceof Headers) {
            return headers.get(name);
        }
        const value = headers[name];
        return Array.isArray(value) ? value[0] : value || null;
    };
    return (getHeader('x-forwarded-for')?.split(',')[0]?.trim() ||
        getHeader('x-real-ip') ||
        getHeader('cf-connecting-ip') ||
        null);
}
/**
 * Pre-built event loggers for common auth events
 */
exports.siteEvents = {
    loginSuccess: (opts) => {
        logSiteEvent({
            level: 'info',
            category: 'auth',
            message: 'User logged in',
            context: { method: opts.method || 'password', provider: opts.provider },
            user_id: opts.user_id,
            session_id: opts.session_id,
            url: opts.url || '/auth/login',
            user_agent: opts.user_agent,
            ip_address: opts.ip_address,
        });
    },
    loginFailed: (opts) => {
        logSiteEvent({
            level: 'warn',
            category: 'auth',
            message: 'Login failed',
            context: { reason: opts.reason, email: opts.email },
            url: opts.url || '/auth/login',
            user_agent: opts.user_agent,
            ip_address: opts.ip_address,
        });
    },
    logout: (opts) => {
        logSiteEvent({
            level: 'info',
            category: 'auth',
            message: 'User logged out',
            context: { trigger: opts.trigger || 'user' },
            user_id: opts.user_id,
            session_id: opts.session_id,
            url: opts.url || '/auth/logout',
            user_agent: opts.user_agent,
            ip_address: opts.ip_address,
        });
    },
    twoFactorSuccess: (opts) => {
        logSiteEvent({
            level: 'info',
            category: 'auth',
            message: '2FA verified',
            context: { method: opts.method },
            user_id: opts.user_id,
            session_id: opts.session_id,
            url: opts.url || '/auth/2fa',
            user_agent: opts.user_agent,
            ip_address: opts.ip_address,
        });
    },
    twoFactorFailed: (opts) => {
        logSiteEvent({
            level: 'warn',
            category: 'auth',
            message: '2FA verification failed',
            context: { method: opts.method, attempts: opts.attempts },
            user_id: opts.user_id,
            url: opts.url || '/auth/2fa',
            user_agent: opts.user_agent,
            ip_address: opts.ip_address,
        });
    },
    sessionCreated: (opts) => {
        logSiteEvent({
            level: 'info',
            category: 'session',
            message: 'Session created',
            context: { device_type: opts.device_type },
            user_id: opts.user_id,
            session_id: opts.session_id,
            user_agent: opts.user_agent,
            ip_address: opts.ip_address,
        });
    },
    adminAccess: (opts) => {
        logSiteEvent({
            level: 'info',
            category: 'navigation',
            message: 'Admin panel accessed',
            context: { page: opts.page },
            user_id: opts.user_id,
            session_id: opts.session_id,
            url: opts.page,
            user_agent: opts.user_agent,
            ip_address: opts.ip_address,
        });
    },
    pageView: (opts) => {
        logSiteEvent({
            level: 'info',
            category: 'page_view',
            message: 'Page viewed',
            context: { referrer: opts.referrer },
            user_id: opts.user_id,
            session_id: opts.session_id,
            url: opts.url,
            user_agent: opts.user_agent,
            ip_address: opts.ip_address,
        });
    },
    error: (opts) => {
        logSiteEvent({
            level: 'error',
            category: 'error',
            message: opts.message,
            context: { error: opts.error, stack: opts.stack },
            user_id: opts.user_id,
            url: opts.url,
            user_agent: opts.user_agent,
            ip_address: opts.ip_address,
        });
    },
    userAction: (opts) => {
        logSiteEvent({
            level: 'info',
            category: 'user_action',
            message: opts.action,
            context: { target: opts.target },
            user_id: opts.user_id,
            session_id: opts.session_id,
            url: opts.url,
            user_agent: opts.user_agent,
            ip_address: opts.ip_address,
        });
    },
};
exports.default = { logSiteEvent, getClientIp, siteEvents: exports.siteEvents, configureSiteLogger };
