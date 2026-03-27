"use strict";
/**
 * Vibe Log Transport for Winston
 *
 * Buffers log entries to Redis for async processing by Vibe log drain.
 * This avoids the "log database errors to database" chicken-and-egg problem.
 *
 * Features:
 * - Async batch writing (doesn't block main thread)
 * - Configurable minimum log level
 * - Redis buffering with 1-week TTL
 * - Graceful degradation on failure
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VibeLogTransport = void 0;
exports.createVibeLogTransport = createVibeLogTransport;
const redis_1 = require("../lib/redis");
// Dynamic import — winston is a peerDependency and may not be installed.
// We resolve the base class lazily so builds don't break without it.
let TransportBase;
try {
    TransportBase = require('winston-transport');
}
catch {
    // Fallback: minimal base class for when winston is not installed
    TransportBase = class {
        constructor(_opts) { }
        emit(_event, _info) { }
    };
}
/** Redis key for pending log entries */
const REDIS_LOG_KEY = 'vibe:logs:pending';
/** TTL in seconds: 1 week */
const REDIS_LOG_TTL = 7 * 24 * 60 * 60;
const LEVEL_ORDER = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
/**
 * Winston transport that buffers logs to Redis for Vibe drain processing
 */
class VibeLogTransport extends TransportBase {
    vibeClientId;
    appSlug;
    minLevelNum;
    batchSize;
    flushInterval;
    enabled;
    redisAvailable = false;
    batch = [];
    flushTimer = null;
    isFlushing = false;
    constructor(opts = {}) {
        super(opts);
        this.vibeClientId = opts.vibeClientId || process.env.VIBE_CLIENT_ID || '';
        this.appSlug = opts.appSlug || process.env.APP_SLUG || process.env.CLIENT_ID || 'mvp-app';
        this.minLevelNum = LEVEL_ORDER[opts.minLevel || 'warn'] ?? 1;
        this.batchSize = opts.batchSize || 10;
        this.flushInterval = opts.flushInterval || 5000;
        // Enable if Redis URL is configured
        const redisUrl = opts.redisUrl || process.env.REDIS_URL || '';
        this.enabled = opts.enabled !== false && !!redisUrl;
        this.redisAvailable = !!redisUrl;
        if (this.enabled) {
            this.startFlushTimer();
        }
    }
    /**
     * Winston transport log method
     */
    log(info, callback) {
        setImmediate(() => this.emit('logged', info));
        if (!this.enabled) {
            callback();
            return;
        }
        const level = info.level?.replace(/\u001b\[\d+m/g, '') || 'info'; // Strip ANSI codes
        const levelNum = LEVEL_ORDER[level] ?? 2;
        // Only batch if at or above minimum level
        if (levelNum <= this.minLevelNum) {
            const entry = {
                level,
                message: info.message || '',
                timestamp: info.timestamp || new Date().toISOString(),
                category: this.extractCategory(info.message),
                meta: this.extractMeta(info),
            };
            this.batch.push(entry);
            // Flush immediately if batch is full or if error/fatal
            if (this.batch.length >= this.batchSize || level === 'error') {
                this.flush().catch(() => { }); // Ignore flush errors
            }
        }
        callback();
    }
    /**
     * Extract category from message prefix like [AUTH], [IDP], etc.
     */
    extractCategory(message) {
        const match = message.match(/^\[([A-Z-]+)\]/);
        return match ? match[1].toLowerCase() : 'app';
    }
    /**
     * Extract metadata from winston info object
     */
    extractMeta(info) {
        const { level, message, timestamp, ...rest } = info;
        return Object.keys(rest).length > 0 ? rest : {};
    }
    /**
     * Start the periodic flush timer
     */
    startFlushTimer() {
        if (this.flushTimer)
            return;
        this.flushTimer = setInterval(() => {
            if (this.batch.length > 0) {
                this.flush().catch(() => { });
            }
        }, this.flushInterval);
        // Don't prevent process exit
        if (this.flushTimer.unref) {
            this.flushTimer.unref();
        }
    }
    /**
     * Flush batch to Vibe
     */
    async flush() {
        if (this.isFlushing || this.batch.length === 0)
            return;
        this.isFlushing = true;
        const entries = [...this.batch];
        this.batch = [];
        try {
            await this.sendToVibe(entries);
        }
        catch (err) {
            // On failure, put entries back (up to limit to prevent memory issues)
            if (this.batch.length < 100) {
                this.batch = [...entries, ...this.batch].slice(0, 100);
            }
            // Log to console as fallback
            console.error('[VibeLogTransport] Failed to flush logs:', err);
        }
        finally {
            this.isFlushing = false;
        }
    }
    /**
     * Push log entries to Redis for async drain processing
     */
    async sendToVibe(entries) {
        if (entries.length === 0)
            return;
        const redis = (0, redis_1.getRedis)();
        // Format entries for the drain to process
        const logRecords = entries.map(e => JSON.stringify({
            level: e.level,
            message: e.message,
            timestamp: e.timestamp,
            source: 'next-mvp',
            app_slug: this.appSlug,
            vibe_client_id: this.vibeClientId,
            category: e.category,
            error_code: e.meta?.errorCode || e.meta?.error_code,
            stack: e.meta?.stack,
            request_id: e.meta?.requestId || e.meta?.request_id,
            user_id: e.meta?.userId || e.meta?.user_id,
            path: e.meta?.path,
            method: e.meta?.method,
            status_code: e.meta?.statusCode || e.meta?.status_code,
            duration_ms: e.meta?.durationMs || e.meta?.duration_ms,
            meta: e.meta,
            queued_at: new Date().toISOString(),
        }));
        // LPUSH all entries (newest first, drain will RPOP for FIFO)
        await redis.lpush(REDIS_LOG_KEY, ...logRecords);
        // Reset TTL on each write (1 week from last activity)
        await redis.expire(REDIS_LOG_KEY, REDIS_LOG_TTL);
    }
    /**
     * Close transport and flush remaining logs
     */
    close() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        // Final flush (best effort)
        if (this.batch.length > 0) {
            this.flush().catch(() => { });
        }
    }
}
exports.VibeLogTransport = VibeLogTransport;
/**
 * Create a configured VibeLogTransport instance
 * Returns null if Redis is not configured (REDIS_URL env var)
 */
function createVibeLogTransport(opts) {
    const transport = new VibeLogTransport(opts);
    // Return null if transport is disabled (no Redis)
    if (!transport['enabled']) {
        return null;
    }
    return transport;
}
exports.default = VibeLogTransport;
