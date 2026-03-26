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

import { getRedis } from '../lib/redis';

// Dynamic import — winston is a peerDependency and may not be installed.
// We resolve the base class lazily so builds don't break without it.
let TransportBase: any;
try {
  TransportBase = require('winston-transport');
} catch {
  // Fallback: minimal base class for when winston is not installed
  TransportBase = class {
    constructor(_opts?: any) {}
    emit(_event: string, _info: any) {}
  };
}

/** Redis key for pending log entries */
const REDIS_LOG_KEY = 'vibe:logs:pending';
/** TTL in seconds: 1 week */
const REDIS_LOG_TTL = 7 * 24 * 60 * 60;

export interface VibeLogTransportOptions {
  /** Winston transport level */
  level?: string;
  /** Redis URL (optional, uses REDIS_URL env var by default) */
  redisUrl?: string;
  /** Vibe client ID (for log metadata) */
  vibeClientId?: string;
  /** App slug for identification */
  appSlug?: string;
  /** Minimum level to send to Vibe (default: 'warn') */
  minLevel?: string;
  /** Batch size before flush (default: 10) */
  batchSize?: number;
  /** Flush interval in ms (default: 5000) */
  flushInterval?: number;
  /** Enable/disable the transport (default: true if Redis available) */
  enabled?: boolean;
}

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  category?: string;
  meta?: Record<string, any>;
}

const LEVEL_ORDER: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Winston transport that buffers logs to Redis for Vibe drain processing
 */
export class VibeLogTransport extends TransportBase {
  private vibeClientId: string;
  private appSlug: string;
  private minLevelNum: number;
  private batchSize: number;
  private flushInterval: number;
  private enabled: boolean;
  private redisAvailable: boolean = false;

  private batch: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor(opts: VibeLogTransportOptions = {}) {
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
  log(info: any, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    if (!this.enabled) {
      callback();
      return;
    }

    const level = info.level?.replace(/\u001b\[\d+m/g, '') || 'info'; // Strip ANSI codes
    const levelNum = LEVEL_ORDER[level] ?? 2;

    // Only batch if at or above minimum level
    if (levelNum <= this.minLevelNum) {
      const entry: LogEntry = {
        level,
        message: info.message || '',
        timestamp: info.timestamp || new Date().toISOString(),
        category: this.extractCategory(info.message),
        meta: this.extractMeta(info),
      };

      this.batch.push(entry);

      // Flush immediately if batch is full or if error/fatal
      if (this.batch.length >= this.batchSize || level === 'error') {
        this.flush().catch(() => {}); // Ignore flush errors
      }
    }

    callback();
  }

  /**
   * Extract category from message prefix like [AUTH], [IDP], etc.
   */
  private extractCategory(message: string): string {
    const match = message.match(/^\[([A-Z-]+)\]/);
    return match ? match[1].toLowerCase() : 'app';
  }

  /**
   * Extract metadata from winston info object
   */
  private extractMeta(info: any): Record<string, any> {
    const { level, message, timestamp, ...rest } = info;
    return Object.keys(rest).length > 0 ? rest : {};
  }

  /**
   * Start the periodic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) return;

    this.flushTimer = setInterval(() => {
      if (this.batch.length > 0) {
        this.flush().catch(() => {});
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
  async flush(): Promise<void> {
    if (this.isFlushing || this.batch.length === 0) return;

    this.isFlushing = true;
    const entries = [...this.batch];
    this.batch = [];

    try {
      await this.sendToVibe(entries);
    } catch (err) {
      // On failure, put entries back (up to limit to prevent memory issues)
      if (this.batch.length < 100) {
        this.batch = [...entries, ...this.batch].slice(0, 100);
      }
      // Log to console as fallback
      console.error('[VibeLogTransport] Failed to flush logs:', err);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Push log entries to Redis for async drain processing
   */
  private async sendToVibe(entries: LogEntry[]): Promise<void> {
    if (entries.length === 0) return;

    const redis = getRedis();

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
  close(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush (best effort)
    if (this.batch.length > 0) {
      this.flush().catch(() => {});
    }
  }
}

/**
 * Create a configured VibeLogTransport instance
 * Returns null if Redis is not configured (REDIS_URL env var)
 */
export function createVibeLogTransport(opts?: VibeLogTransportOptions): VibeLogTransport | null {
  const transport = new VibeLogTransport(opts);

  // Return null if transport is disabled (no Redis)
  if (!transport['enabled']) {
    return null;
  }

  return transport;
}

export default VibeLogTransport;
