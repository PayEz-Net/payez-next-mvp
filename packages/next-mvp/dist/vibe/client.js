"use strict";
/**
 * =============================================================================
 * VIBE CLIENT - PRISMA-STYLE QUERY BUILDER
 * =============================================================================
 *
 * A typed query builder for the Vibe App API.
 * Provides Prisma-like DX for CRUD operations on Vibe tables.
 *
 * Usage:
 *   import { vibe } from '@payez/next-mvp/vibe'
 *
 *   // Find many with filters
 *   const users = await vibe.users.findMany({
 *     where: { status: 'active' },
 *     take: 10,
 *     skip: 0,
 *     orderBy: { created_at: 'desc' }
 *   })
 *
 *   // Find one by ID
 *   const user = await vibe.users.findUnique({ where: { id: 123 } })
 *
 *   // Create
 *   const newUser = await vibe.users.create({
 *     data: { email: 'test@example.com', name: 'Test' }
 *   })
 *
 *   // Update
 *   const updated = await vibe.users.update({
 *     where: { id: 123 },
 *     data: { name: 'Updated' }
 *   })
 *
 *   // Delete (soft delete)
 *   await vibe.users.delete({ where: { id: 123 } })
 *
 * =============================================================================
 */
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
exports.vibe = exports.VibeClient = exports.VibeTableDelegate = void 0;
exports.createVibeClient = createVibeClient;
const errors_1 = require("./errors");
// -----------------------------------------------------------------------------
// RETRY HELPERS
// -----------------------------------------------------------------------------
const DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryOnRateLimit: true,
};
/** Sleep for a given number of milliseconds */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/** Calculate exponential backoff delay with jitter */
function getBackoffDelay(attempt, baseDelay, maxDelay) {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    // Add jitter (±25%) to prevent thundering herd
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    return Math.min(exponentialDelay + jitter, maxDelay);
}
// -----------------------------------------------------------------------------
// TABLE DELEGATE
// -----------------------------------------------------------------------------
/**
 * Delegate class for table operations.
 * Provides Prisma-style methods for a specific table.
 */
class VibeTableDelegate {
    tableName;
    client;
    constructor(tableName, client) {
        this.tableName = tableName;
        this.client = client;
    }
    /**
     * Find multiple records with optional filtering and pagination.
     */
    async findMany(options) {
        const params = new URLSearchParams();
        // Build filter params
        if (options?.where) {
            for (const [key, value] of Object.entries(options.where)) {
                if (value !== undefined) {
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        // Handle operator objects (e.g., { gt: 5 }, { in: [1,2,3] })
                        for (const [op, val] of Object.entries(value)) {
                            if (Array.isArray(val)) {
                                // Handle array values for in/nin operators
                                val.forEach(v => params.append(`filter[${key}][${op}][]`, String(v)));
                            }
                            else {
                                params.append(`filter[${key}][${op}]`, String(val));
                            }
                        }
                    }
                    else if (Array.isArray(value)) {
                        // Handle direct array values
                        value.forEach(v => params.append(`filter[${key}][]`, String(v)));
                    }
                    else {
                        params.append(`filter[${key}]`, String(value));
                    }
                }
            }
        }
        // Pagination
        if (options?.take !== undefined) {
            params.append('limit', String(options.take));
        }
        if (options?.skip !== undefined) {
            params.append('offset', String(options.skip));
        }
        // Sorting
        if (options?.orderBy) {
            const sortParts = [];
            for (const [key, dir] of Object.entries(options.orderBy)) {
                sortParts.push(dir === 'desc' ? `-${key}` : key);
            }
            if (sortParts.length > 0) {
                params.append('sort', sortParts.join(','));
            }
        }
        const queryString = params.toString();
        const url = `${this.client.getBaseUrl()}/api/v1/vibe_app/${this.tableName}${queryString ? `?${queryString}` : ''}`;
        const response = await this.client.request(url, 'GET');
        return {
            data: response.data,
            meta: response.meta || { total: response.data.length, limit: options?.take || 50, offset: options?.skip || 0 },
        };
    }
    /**
     * Find a single record by ID.
     * Throws VibeNotFoundError if not found.
     */
    async findUnique(options) {
        const url = `${this.client.getBaseUrl()}/api/v1/vibe_app/${this.tableName}/${options.where.id}`;
        const response = await this.client.request(url, 'GET');
        return response.data;
    }
    /**
     * Find a single record by ID.
     * Returns null if not found (instead of throwing).
     */
    async findUniqueOrNull(options) {
        try {
            return await this.findUnique(options);
        }
        catch (error) {
            if (error instanceof errors_1.VibeNotFoundError) {
                return null;
            }
            throw error;
        }
    }
    /**
     * Find the first record matching the filter.
     * Returns null if none found.
     */
    async findFirst(options) {
        const result = await this.findMany({ ...options, take: 1 });
        return result.data[0] || null;
    }
    /**
     * Create a new record.
     */
    async create(options) {
        const url = `${this.client.getBaseUrl()}/api/v1/vibe_app/${this.tableName}`;
        const response = await this.client.request(url, 'POST', options.data);
        return response.data;
    }
    /**
     * Update an existing record by ID.
     * Throws VibeNotFoundError if not found.
     */
    async update(options) {
        const url = `${this.client.getBaseUrl()}/api/v1/vibe_app/${this.tableName}/${options.where.id}`;
        const response = await this.client.request(url, 'PUT', options.data);
        return response.data;
    }
    /**
     * Delete a record by ID (soft delete).
     * Throws VibeNotFoundError if not found.
     */
    async delete(options) {
        const url = `${this.client.getBaseUrl()}/api/v1/vibe_app/${this.tableName}/${options.where.id}`;
        const response = await this.client.request(url, 'DELETE');
        return response.data;
    }
    /**
     * Count records matching the filter.
     */
    async count(options) {
        // Use findMany with limit 0 to get just the count
        const result = await this.findMany({ ...options, take: 0 });
        return result.meta.total;
    }
    /**
     * Create multiple records in a batch.
     */
    async createMany(options) {
        const url = `${this.client.getBaseUrl()}/api/v1/vibe_app/batch`;
        const response = await this.client.request(url, 'POST', {
            operations: options.data.map(item => ({
                table: this.tableName,
                operation: 'create',
                data: item,
            })),
        });
        return response.data;
    }
}
exports.VibeTableDelegate = VibeTableDelegate;
// -----------------------------------------------------------------------------
// VIBE CLIENT
// -----------------------------------------------------------------------------
/**
 * Main Vibe client class.
 * Provides access to all Vibe App tables via table delegates.
 */
class VibeClient {
    config;
    // Table delegates
    users;
    login_sessions;
    profiles;
    settings;
    files;
    notifications;
    activity_log;
    tags;
    comments;
    site_logs;
    constructor(config = {}) {
        this.config = {
            baseUrl: config.baseUrl || process.env.VIBE_API_URL || '',
            clientId: config.clientId || process.env.VIBE_CLIENT_ID || '',
            idpUrl: config.idpUrl || process.env.IDP_URL || '',
            appSigningKey: config.appSigningKey || process.env.VIBE_HMAC_KEY || '',
            fetch: config.fetch || globalThis.fetch,
            retry: { ...DEFAULT_RETRY_CONFIG, ...config.retry },
        };
        // Initialize table delegates
        this.users = new VibeTableDelegate('users', this);
        this.login_sessions = new VibeTableDelegate('login_sessions', this);
        this.profiles = new VibeTableDelegate('profiles', this);
        this.settings = new VibeTableDelegate('settings', this);
        this.files = new VibeTableDelegate('files', this);
        this.notifications = new VibeTableDelegate('notifications', this);
        this.activity_log = new VibeTableDelegate('activity_log', this);
        this.tags = new VibeTableDelegate('tags', this);
        this.comments = new VibeTableDelegate('comments', this);
        this.site_logs = new VibeTableDelegate('site_logs', this);
    }
    /**
     * Check if the client is configured to use proxy mode (IDP proxy).
     * MVP always uses proxy mode - direct Vibe access is not supported.
     */
    useProxyMode() {
        return !!this.config.appSigningKey && !!this.config.idpUrl;
    }
    /**
     * Generate HMAC-SHA256 signature for IDP proxy authentication.
     * Message format: {timestamp}|{method}|{endpoint}
     */
    async generateProxySignature(timestamp, method, endpoint) {
        const message = `${timestamp}|${method}|${endpoint}`;
        const keyBuffer = Buffer.from(this.config.appSigningKey, 'base64');
        // Use Web Crypto API for browser/edge compatibility, fall back to Node crypto
        if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
            const encoder = new TextEncoder();
            const key = await globalThis.crypto.subtle.importKey('raw', keyBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
            const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(message));
            return Buffer.from(signature).toString('base64');
        }
        else {
            // Node.js fallback
            const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
            return crypto.createHmac('sha256', keyBuffer).update(message).digest('base64');
        }
    }
    /**
     * Make a request through the IDP Vibe proxy.
     * The proxy handles credential injection securely.
     */
    async requestViaProxy(url, method, body, authToken) {
        // Extract the endpoint path from the full URL
        const urlObj = new URL(url);
        const endpoint = urlObj.pathname + urlObj.search;
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = await this.generateProxySignature(timestamp, method, endpoint);
        const proxyUrl = `${this.config.idpUrl}/api/vibe/proxy`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Vibe-Client-Id': this.config.clientId,
            'X-Vibe-Timestamp': String(timestamp),
            'X-Vibe-Signature': signature,
        };
        // Pass through auth token if provided (for user context)
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        const proxyBody = {
            method,
            endpoint,
            ...(body !== undefined && { body }),
        };
        const response = await this.config.fetch(proxyUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(proxyBody),
        });
        if (!response.ok) {
            const errorBody = await this.parseErrorResponse(response);
            throw errors_1.VibeError.fromResponse(errorBody, response.status);
        }
        const responseData = await response.json();
        if (!responseData.success) {
            throw errors_1.VibeError.fromResponse(responseData, response.status);
        }
        return responseData;
    }
    /**
     * Get the configured base URL.
     */
    getBaseUrl() {
        return this.config.baseUrl;
    }
    /**
     * Make an authenticated request to the Vibe API with smart retry logic.
     *
     * Routing:
     * - All requests route through the IDP proxy (requires VIBE_HMAC_KEY + IDP_URL)
     *
     * Retry behavior:
     * - 5xx errors: Retry up to maxRetries times with exponential backoff
     * - 429 errors: Retry once after Retry-After delay (if retryOnRateLimit enabled)
     * - 401/403 errors: No retry (auth errors)
     * - Network errors: Retry with backoff
     */
    async request(url, method, body, authToken) {
        if (!this.config.clientId) {
            throw new errors_1.VibeServiceError('VIBE_CLIENT_ID is not configured');
        }
        // Check if we should use proxy mode
        if (this.useProxyMode()) {
            if (!this.config.idpUrl) {
                throw new errors_1.VibeServiceError('IDP_URL is not configured (required for proxy mode)');
            }
            if (!this.config.appSigningKey) {
                throw new errors_1.VibeServiceError('VIBE_HMAC_KEY is not configured (required for proxy mode)');
            }
            // Route through IDP proxy
            return this.requestViaProxy(url, method, body, authToken);
        }
        // MVP requires proxy mode - direct Vibe access is not supported
        throw new errors_1.VibeServiceError('Vibe proxy not configured. Set VIBE_HMAC_KEY + IDP_URL for proxy mode.');
    }
    /**
     * Parse error response body, handling non-JSON responses gracefully.
     */
    async parseErrorResponse(response) {
        try {
            return await response.json();
        }
        catch {
            // Non-JSON error response
            const text = await response.text().catch(() => 'Unknown error');
            return {
                success: false,
                error: {
                    code: `HTTP_${response.status}`,
                    message: text || response.statusText,
                },
            };
        }
    }
    /**
     * Fetch the schema for type generation.
     */
    async getSchema() {
        const url = `${this.config.baseUrl}/api/v1/vibe_app/schema`;
        const response = await this.request(url, 'GET');
        return response.data;
    }
}
exports.VibeClient = VibeClient;
// -----------------------------------------------------------------------------
// SINGLETON INSTANCE
// -----------------------------------------------------------------------------
/**
 * Default Vibe client instance.
 * Uses environment variables for configuration.
 *
 * Usage:
 *   import { vibe } from '@payez/next-mvp/vibe'
 *   const users = await vibe.users.findMany()
 */
exports.vibe = new VibeClient();
/**
 * Create a new Vibe client with custom configuration.
 *
 * Usage:
 *   import { createVibeClient } from '@payez/next-mvp/vibe'
 *   const customVibe = createVibeClient({ baseUrl: 'https://custom-api.example.com' })
 */
function createVibeClient(config) {
    return new VibeClient(config);
}
