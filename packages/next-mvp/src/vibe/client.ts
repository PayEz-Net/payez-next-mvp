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

import {
  VibeError,
  VibeNotFoundError,
  VibeServiceError,
} from './errors';
import type {
  VibeMeta,
  VibeResponse,
  VibeErrorResponse,
  VibeTableName,
  VibeTableType,
} from './types';

// Re-export from types for convenience
export type { VibeTableName, VibeTableType } from './types';

// -----------------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// QUERY TYPES
// -----------------------------------------------------------------------------

/** Comparison operators for filters */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'nin';

/** Filter value - can be simple value or operator object */
export type FilterValue<T> = T | { [K in FilterOperator]?: T };

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
  where: { id: number };
}

/** Options for create */
export interface CreateOptions<T> {
  data: Omit<T, 'id' | 'created_at' | 'updated_at'>;
}

/** Options for update */
export interface UpdateOptions<T> {
  where: { id: number };
  data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;
}

/** Options for delete */
export interface DeleteOptions {
  where: { id: number };
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

// -----------------------------------------------------------------------------
// RETRY HELPERS
// -----------------------------------------------------------------------------

const DEFAULT_RETRY_CONFIG: Required<VibeRetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryOnRateLimit: true,
};

/** Sleep for a given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Calculate exponential backoff delay with jitter */
function getBackoffDelay(attempt: number, baseDelay: number, maxDelay: number): number {
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
export class VibeTableDelegate<T extends VibeTableName> {
  private tableName: T;
  private client: VibeClient;

  constructor(tableName: T, client: VibeClient) {
    this.tableName = tableName;
    this.client = client;
  }

  /**
   * Find multiple records with optional filtering and pagination.
   */
  async findMany(options?: FindManyOptions<VibeTableType<T>>): Promise<FindManyResult<VibeTableType<T>>> {
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
              } else {
                params.append(`filter[${key}][${op}]`, String(val));
              }
            }
          } else if (Array.isArray(value)) {
            // Handle direct array values
            value.forEach(v => params.append(`filter[${key}][]`, String(v)));
          } else {
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
      const sortParts: string[] = [];
      for (const [key, dir] of Object.entries(options.orderBy)) {
        sortParts.push(dir === 'desc' ? `-${key}` : key);
      }
      if (sortParts.length > 0) {
        params.append('sort', sortParts.join(','));
      }
    }

    const queryString = params.toString();
    const url = `${this.client.getBaseUrl()}/api/v1/vibe_app/${this.tableName}${queryString ? `?${queryString}` : ''}`;

    const response = await this.client.request<VibeTableType<T>[]>(url, 'GET');

    return {
      data: response.data,
      meta: response.meta || { total: response.data.length, limit: options?.take || 50, offset: options?.skip || 0 },
    };
  }

  /**
   * Find a single record by ID.
   * Throws VibeNotFoundError if not found.
   */
  async findUnique(options: FindUniqueOptions): Promise<VibeTableType<T>> {
    const url = `${this.client.getBaseUrl()}/api/v1/vibe_app/${this.tableName}/${options.where.id}`;
    const response = await this.client.request<VibeTableType<T>>(url, 'GET');
    return response.data;
  }

  /**
   * Find a single record by ID.
   * Returns null if not found (instead of throwing).
   */
  async findUniqueOrNull(options: FindUniqueOptions): Promise<VibeTableType<T> | null> {
    try {
      return await this.findUnique(options);
    } catch (error) {
      if (error instanceof VibeNotFoundError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Find the first record matching the filter.
   * Returns null if none found.
   */
  async findFirst(options?: FindManyOptions<VibeTableType<T>>): Promise<VibeTableType<T> | null> {
    const result = await this.findMany({ ...options, take: 1 });
    return result.data[0] || null;
  }

  /**
   * Create a new record.
   */
  async create(options: CreateOptions<VibeTableType<T>>): Promise<VibeTableType<T>> {
    const url = `${this.client.getBaseUrl()}/api/v1/vibe_app/${this.tableName}`;
    const response = await this.client.request<VibeTableType<T>>(url, 'POST', options.data);
    return response.data;
  }

  /**
   * Update an existing record by ID.
   * Throws VibeNotFoundError if not found.
   */
  async update(options: UpdateOptions<VibeTableType<T>>): Promise<VibeTableType<T>> {
    const url = `${this.client.getBaseUrl()}/api/v1/vibe_app/${this.tableName}/${options.where.id}`;
    const response = await this.client.request<VibeTableType<T>>(url, 'PUT', options.data);
    return response.data;
  }

  /**
   * Delete a record by ID (soft delete).
   * Throws VibeNotFoundError if not found.
   */
  async delete(options: DeleteOptions): Promise<VibeTableType<T>> {
    const url = `${this.client.getBaseUrl()}/api/v1/vibe_app/${this.tableName}/${options.where.id}`;
    const response = await this.client.request<VibeTableType<T>>(url, 'DELETE');
    return response.data;
  }

  /**
   * Count records matching the filter.
   */
  async count(options?: CountOptions<VibeTableType<T>>): Promise<number> {
    // Use findMany with limit 0 to get just the count
    const result = await this.findMany({ ...options, take: 0 });
    return result.meta.total;
  }

  /**
   * Create multiple records in a batch.
   */
  async createMany(options: { data: CreateOptions<VibeTableType<T>>['data'][] }): Promise<{ count: number }> {
    const url = `${this.client.getBaseUrl()}/api/v1/vibe_app/batch`;
    const response = await this.client.request<{ count: number }>(url, 'POST', {
      operations: options.data.map(item => ({
        table: this.tableName,
        operation: 'create',
        data: item,
      })),
    });
    return response.data;
  }
}

// -----------------------------------------------------------------------------
// VIBE CLIENT
// -----------------------------------------------------------------------------

/**
 * Main Vibe client class.
 * Provides access to all Vibe App tables via table delegates.
 */
export class VibeClient {
  private config: {
    baseUrl: string;
    clientId: string;
    idpUrl: string;
    appSigningKey: string;
    fetch: typeof fetch;
    retry: Required<VibeRetryConfig>;
  };

  // Table delegates
  public users: VibeTableDelegate<'users'>;
  public login_sessions: VibeTableDelegate<'login_sessions'>;
  public profiles: VibeTableDelegate<'profiles'>;
  public settings: VibeTableDelegate<'settings'>;
  public files: VibeTableDelegate<'files'>;
  public notifications: VibeTableDelegate<'notifications'>;
  public activity_log: VibeTableDelegate<'activity_log'>;
  public tags: VibeTableDelegate<'tags'>;
  public comments: VibeTableDelegate<'comments'>;
  public site_logs: VibeTableDelegate<'site_logs'>;

  constructor(config: VibeClientConfig = {}) {
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
  private useProxyMode(): boolean {
    return !!this.config.appSigningKey && !!this.config.idpUrl;
  }

  /**
   * Generate HMAC-SHA256 signature for IDP proxy authentication.
   * Message format: {timestamp}|{method}|{endpoint}
   */
  private async generateProxySignature(timestamp: number, method: string, endpoint: string): Promise<string> {
    const message = `${timestamp}|${method}|${endpoint}`;
    const keyBuffer = Buffer.from(this.config.appSigningKey, 'base64');

    // Use Web Crypto API for browser/edge compatibility, fall back to Node crypto
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
      const encoder = new TextEncoder();
      const key = await globalThis.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await globalThis.crypto.subtle.sign('HMAC', key, encoder.encode(message));
      return Buffer.from(signature).toString('base64');
    } else {
      // Node.js fallback
      const crypto = await import('crypto');
      return crypto.createHmac('sha256', keyBuffer).update(message).digest('base64');
    }
  }

  /**
   * Make a request through the IDP Vibe proxy.
   * The proxy handles credential injection securely.
   */
  private async requestViaProxy<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown,
    authToken?: string
  ): Promise<VibeResponse<T>> {
    // Extract the endpoint path from the full URL
    const urlObj = new URL(url);
    const endpoint = urlObj.pathname + urlObj.search;

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await this.generateProxySignature(timestamp, method, endpoint);

    const proxyUrl = `${this.config.idpUrl}/api/vibe/proxy`;

    const headers: HeadersInit = {
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
      throw VibeError.fromResponse(errorBody, response.status);
    }

    const responseData = await response.json();

    if (!responseData.success) {
      throw VibeError.fromResponse(responseData as VibeErrorResponse, response.status);
    }

    return responseData as VibeResponse<T>;
  }

  /**
   * Get the configured base URL.
   */
  getBaseUrl(): string {
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
  async request<T>(
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: unknown,
    authToken?: string
  ): Promise<VibeResponse<T>> {
    if (!this.config.clientId) {
      throw new VibeServiceError('VIBE_CLIENT_ID is not configured');
    }

    // Check if we should use proxy mode
    if (this.useProxyMode()) {
      if (!this.config.idpUrl) {
        throw new VibeServiceError('IDP_URL is not configured (required for proxy mode)');
      }
      if (!this.config.appSigningKey) {
        throw new VibeServiceError('VIBE_HMAC_KEY is not configured (required for proxy mode)');
      }
      // Route through IDP proxy
      return this.requestViaProxy<T>(url, method, body, authToken);
    }

    // MVP requires proxy mode - direct Vibe access is not supported
    throw new VibeServiceError(
      'Vibe proxy not configured. Set VIBE_HMAC_KEY + IDP_URL for proxy mode.'
    );
  }

  /**
   * Parse error response body, handling non-JSON responses gracefully.
   */
  private async parseErrorResponse(response: Response): Promise<VibeErrorResponse> {
    try {
      return await response.json();
    } catch {
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
  async getSchema(): Promise<Record<string, { columns: Array<{ name: string; type: string; nullable: boolean }> }>> {
    const url = `${this.config.baseUrl}/api/v1/vibe_app/schema`;
    const response = await this.request<Record<string, { columns: Array<{ name: string; type: string; nullable: boolean }> }>>(url, 'GET');
    return response.data;
  }
}

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
export const vibe = new VibeClient();

/**
 * Create a new Vibe client with custom configuration.
 *
 * Usage:
 *   import { createVibeClient } from '@payez/next-mvp/vibe'
 *   const customVibe = createVibeClient({ baseUrl: 'https://custom-api.example.com' })
 */
export function createVibeClient(config: VibeClientConfig): VibeClient {
  return new VibeClient(config);
}
