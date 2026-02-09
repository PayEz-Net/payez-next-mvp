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
import Transport from 'winston-transport';
export interface VibeLogTransportOptions extends Transport.TransportStreamOptions {
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
/**
 * Winston transport that buffers logs to Redis for Vibe drain processing
 */
export declare class VibeLogTransport extends Transport {
    private vibeClientId;
    private appSlug;
    private minLevelNum;
    private batchSize;
    private flushInterval;
    private enabled;
    private redisAvailable;
    private batch;
    private flushTimer;
    private isFlushing;
    constructor(opts?: VibeLogTransportOptions);
    /**
     * Winston transport log method
     */
    log(info: any, callback: () => void): void;
    /**
     * Extract category from message prefix like [AUTH], [IDP], etc.
     */
    private extractCategory;
    /**
     * Extract metadata from winston info object
     */
    private extractMeta;
    /**
     * Start the periodic flush timer
     */
    private startFlushTimer;
    /**
     * Flush batch to Vibe
     */
    flush(): Promise<void>;
    /**
     * Push log entries to Redis for async drain processing
     */
    private sendToVibe;
    /**
     * Close transport and flush remaining logs
     */
    close(): void;
}
/**
 * Create a configured VibeLogTransport instance
 * Returns null if Redis is not configured (REDIS_URL env var)
 */
export declare function createVibeLogTransport(opts?: VibeLogTransportOptions): VibeLogTransport | null;
export default VibeLogTransport;
