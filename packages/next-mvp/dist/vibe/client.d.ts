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
import type { VibeMeta, VibeResponse, VibeTableName, VibeTableType } from './types';
export type { VibeTableName, VibeTableType } from './types';
export interface VibeRetryConfig {
    /** Max retries for 5xx errors (default: 3) */
    maxRetries?: number;
    /** Base delay in ms for exponential backoff (default: 1000) */
    baseDelay?: number;
    /** Max delay in ms (default: 10000) */
    maxDelay?: number;
    /** Whether to retry on 429 with Retry-After header (default: true) */
    retryOnRateLimit?: boolean;
}
export interface VibeClientConfig {
    /** Base URL for the Vibe API (defaults to VIBE_API_URL env var) */
    baseUrl?: string;
    /** Vibe Client ID (defaults to VIBE_CLIENT_ID env var) */
    clientId?: string;
    /**
     * IDP URL for proxy requests (defaults to IDP_URL env var)
     * Used with appSigningKey for secure proxy-based Vibe access.
     */
    idpUrl?: string;
    /**
     * Vibe HMAC key for proxy authentication (defaults to VIBE_HMAC_KEY env var)
     * Base64-encoded signing key from Vibe Credentials tab.
     * When set, requests are routed through the IDP proxy instead of directly to Vibe.
     */
    appSigningKey?: string;
    /** Custom fetch function (for testing or custom auth) */
    fetch?: typeof fetch;
    /** Retry configuration for transient errors */
    retry?: VibeRetryConfig;
}
/** Comparison operators for filters */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'nin';
/** Filter value - can be simple value or operator object */
export type FilterValue<T> = T | {
    [K in FilterOperator]?: T;
};
/** Where clause for queries */
export type WhereClause<T> = {
    [K in keyof T]?: FilterValue<T[K]>;
};
/** Order direction */
export type OrderDirection = 'asc' | 'desc';
/** Order by clause */
export type OrderByClause<T> = {
    [K in keyof T]?: OrderDirection;
};
/** Options for findMany */
export interface FindManyOptions<T> {
    where?: WhereClause<T>;
    orderBy?: OrderByClause<T>;
    take?: number;
    skip?: number;
}
/** Options for findUnique */
export interface FindUniqueOptions {
    where: {
        id: number;
    };
}
/** Options for create */
export interface CreateOptions<T> {
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>;
}
/** Options for update */
export interface UpdateOptions<T> {
    where: {
        id: number;
    };
    data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;
}
/** Options for delete */
export interface DeleteOptions {
    where: {
        id: number;
    };
}
/** Options for count */
export interface CountOptions<T> {
    where?: WhereClause<T>;
}
/** Result of findMany with metadata */
export interface FindManyResult<T> {
    data: T[];
    meta: VibeMeta;
}
/**
 * Delegate class for table operations.
 * Provides Prisma-style methods for a specific table.
 */
export declare class VibeTableDelegate<T extends VibeTableName> {
    private tableName;
    private client;
    constructor(tableName: T, client: VibeClient);
    /**
     * Find multiple records with optional filtering and pagination.
     */
    findMany(options?: FindManyOptions<VibeTableType<T>>): Promise<FindManyResult<VibeTableType<T>>>;
    /**
     * Find a single record by ID.
     * Throws VibeNotFoundError if not found.
     */
    findUnique(options: FindUniqueOptions): Promise<VibeTableType<T>>;
    /**
     * Find a single record by ID.
     * Returns null if not found (instead of throwing).
     */
    findUniqueOrNull(options: FindUniqueOptions): Promise<VibeTableType<T> | null>;
    /**
     * Find the first record matching the filter.
     * Returns null if none found.
     */
    findFirst(options?: FindManyOptions<VibeTableType<T>>): Promise<VibeTableType<T> | null>;
    /**
     * Create a new record.
     */
    create(options: CreateOptions<VibeTableType<T>>): Promise<VibeTableType<T>>;
    /**
     * Update an existing record by ID.
     * Throws VibeNotFoundError if not found.
     */
    update(options: UpdateOptions<VibeTableType<T>>): Promise<VibeTableType<T>>;
    /**
     * Delete a record by ID (soft delete).
     * Throws VibeNotFoundError if not found.
     */
    delete(options: DeleteOptions): Promise<VibeTableType<T>>;
    /**
     * Count records matching the filter.
     */
    count(options?: CountOptions<VibeTableType<T>>): Promise<number>;
    /**
     * Create multiple records in a batch.
     */
    createMany(options: {
        data: CreateOptions<VibeTableType<T>>['data'][];
    }): Promise<{
        count: number;
    }>;
}
/**
 * Main Vibe client class.
 * Provides access to all Vibe App tables via table delegates.
 */
export declare class VibeClient {
    private config;
    users: VibeTableDelegate<'users'>;
    login_sessions: VibeTableDelegate<'login_sessions'>;
    profiles: VibeTableDelegate<'profiles'>;
    settings: VibeTableDelegate<'settings'>;
    files: VibeTableDelegate<'files'>;
    notifications: VibeTableDelegate<'notifications'>;
    activity_log: VibeTableDelegate<'activity_log'>;
    tags: VibeTableDelegate<'tags'>;
    comments: VibeTableDelegate<'comments'>;
    site_logs: VibeTableDelegate<'site_logs'>;
    constructor(config?: VibeClientConfig);
    /**
     * Check if the client is configured to use proxy mode (IDP proxy).
     * MVP always uses proxy mode - direct Vibe access is not supported.
     */
    private useProxyMode;
    /**
     * Generate HMAC-SHA256 signature for IDP proxy authentication.
     * Message format: {timestamp}|{method}|{endpoint}
     */
    private generateProxySignature;
    /**
     * Make a request through the IDP Vibe proxy.
     * The proxy handles credential injection securely.
     */
    private requestViaProxy;
    /**
     * Get the configured base URL.
     */
    getBaseUrl(): string;
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
    request<T>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: unknown, authToken?: string): Promise<VibeResponse<T>>;
    /**
     * Parse error response body, handling non-JSON responses gracefully.
     */
    private parseErrorResponse;
    /**
     * Fetch the schema for type generation.
     */
    getSchema(): Promise<Record<string, {
        columns: Array<{
            name: string;
            type: string;
            nullable: boolean;
        }>;
    }>>;
}
/**
 * Default Vibe client instance.
 * Uses environment variables for configuration.
 *
 * Usage:
 *   import { vibe } from '@payez/next-mvp/vibe'
 *   const users = await vibe.users.findMany()
 */
export declare const vibe: VibeClient;
/**
 * Create a new Vibe client with custom configuration.
 *
 * Usage:
 *   import { createVibeClient } from '@payez/next-mvp/vibe'
 *   const customVibe = createVibeClient({ baseUrl: 'https://custom-api.example.com' })
 */
export declare function createVibeClient(config: VibeClientConfig): VibeClient;
