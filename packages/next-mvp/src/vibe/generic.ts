/**
 * =============================================================================
 * VIBE GENERIC CLIENT - DYNAMIC COLLECTION/TABLE ACCESS
 * =============================================================================
 *
 * Provides dynamic access to any Vibe collection and table.
 * Use this when you need to work with tables not predefined in the typed client.
 *
 * Usage:
 *   import { vibeCollection, vibeTablePath, unwrapVibeDocument } from '@payez/next-mvp/vibe'
 *
 *   // Dynamic collection access
 *   const idealResume = vibeCollection('ideal_resume');
 *   const resumes = await idealResume.table('resumes').findMany();
 *
 *   // Path builders for custom fetch calls
 *   const path = vibeTablePath('ideal_resume', 'resumes', 123);
 *   // => '/v1/collections/ideal_resume/tables/resumes/123'
 *
 *   // Document unwrapping (Vibe stores data as JSON string in 'data' field)
 *   const unwrapped = unwrapVibeDocument(rawDoc);
 *
 * =============================================================================
 */

import { VibeClient, VibeClientConfig, FindManyOptions, FindManyResult } from './client';
import type { VibeResponse, VibeMeta } from './types';
import { VibeError, VibeNotFoundError, VibeServiceError } from './errors';

// -----------------------------------------------------------------------------
// PATH BUILDERS
// -----------------------------------------------------------------------------

/**
 * Build path for collection table operations.
 * @param collection - Collection name (e.g., 'ideal_resume', 'vibe_app')
 * @param table - Table name (e.g., 'resumes', 'users')
 * @param id - Optional document ID
 * @returns API path string
 *
 * @example
 * vibeTablePath('ideal_resume', 'resumes')
 * // => '/v1/collections/ideal_resume/tables/resumes'
 *
 * vibeTablePath('ideal_resume', 'resumes', 123)
 * // => '/v1/collections/ideal_resume/tables/resumes/123'
 */
export function vibeTablePath(collection: string, table: string, id?: number): string {
  const basePath = `/v1/collections/${collection}/tables/${table}`;
  return id !== undefined ? `${basePath}/${id}` : basePath;
}

/**
 * Build path for collection table query endpoint.
 * @param collection - Collection name
 * @param table - Table name
 * @returns Query API path string
 */
export function vibeQueryPath(collection: string, table: string): string {
  return `/v1/collections/${collection}/tables/${table}/query`;
}

/**
 * Build path for collection table grid endpoint.
 * @param collection - Collection name
 * @param table - Table name
 * @returns Grid API path string
 */
export function vibeGridPath(collection: string, table: string): string {
  return `/v1/collections/${collection}/tables/${table}/grid`;
}

// -----------------------------------------------------------------------------
// DOCUMENT UNWRAPPING
// -----------------------------------------------------------------------------

/**
 * Vibe document wrapper structure.
 * Vibe stores actual table data as JSON string in the 'data' field.
 */
export interface VibeDocumentWrapper {
  document_id: number;
  client_id?: number;
  user_id?: number;
  collection?: string;
  table_name?: string;
  data: string | Record<string, unknown>;
  collection_schema_id?: number;
  created_at?: string;
  created_by?: number;
  updated_at?: string | null;
  updated_by?: number | null;
  deleted_at?: string | null;
}

/**
 * Unwrap a Vibe document response.
 * Vibe returns documents with a wrapper where actual data is a JSON string.
 *
 * @param doc - Raw Vibe document (wrapper format)
 * @returns Unwrapped document with schema fields only.
 *          Storage-layer document_id preserved as _vibe_doc_id for update/delete paths.
 *          See PayEz-Core/docs/vibe-primary-key-standard.md
 *
 * @example
 * const raw = { document_id: 123, data: '{"user_id":15,"name":"John","email":"john@example.com"}' };
 * const unwrapped = unwrapVibeDocument(raw);
 * // => { user_id: 15, name: 'John', email: 'john@example.com', _vibe_doc_id: 123 }
 */
export function unwrapVibeDocument<T extends Record<string, unknown> = Record<string, unknown>>(
  doc: VibeDocumentWrapper | Record<string, unknown> | null | undefined
): (T & { _vibe_doc_id?: number }) | null {
  if (!doc) return null;

  // Handle case where doc is already unwrapped (has schema fields directly)
  if (!('document_id' in doc) && !('data' in doc)) {
    return doc as T & { _vibe_doc_id?: number };
  }

  const wrapper = doc as VibeDocumentWrapper;
  let parsedData: Record<string, unknown> = {};

  if (typeof wrapper.data === 'string') {
    try {
      parsedData = JSON.parse(wrapper.data);
    } catch {
      console.warn('[vibe-generic] Failed to parse document data JSON:', wrapper.data);
      parsedData = {};
    }
  } else if (typeof wrapper.data === 'object' && wrapper.data !== null) {
    parsedData = wrapper.data;
  }

  // Preserve document_id as _vibe_doc_id for Vibe API update/delete paths only
  const documentId = wrapper.document_id ?? (doc as any).document_id;
  if (documentId != null) {
    parsedData._vibe_doc_id = documentId;
  }

  return parsedData as T & { _vibe_doc_id?: number };
}

/**
 * Extract and unwrap array of documents from Vibe response.
 *
 * @param responseData - Raw Vibe API response
 * @returns Array of unwrapped documents
 *
 * @example
 * const response = await fetch('/api/vibe/data/ideal_resume/resumes');
 * const data = await response.json();
 * const resumes = extractVibeDocuments(data);
 */
export function extractVibeDocuments<T extends Record<string, unknown> = Record<string, unknown>>(
  responseData: unknown
): Array<T & { _vibe_doc_id?: number }> {
  if (!responseData || typeof responseData !== 'object') {
    return [];
  }

  const data = responseData as Record<string, unknown>;

  // Try common response shapes
  const docs =
    data.data ??
    data.items ??
    data.documents ??
    (Array.isArray(responseData) ? responseData : null);

  if (!Array.isArray(docs)) {
    return [];
  }

  return docs
    .map((doc) => unwrapVibeDocument<T>(doc))
    .filter((d): d is T & { _vibe_doc_id?: number } => d !== null);
}

// -----------------------------------------------------------------------------
// GENERIC TABLE DELEGATE
// -----------------------------------------------------------------------------

/**
 * Generic table delegate for dynamic collection/table access.
 * Provides Prisma-like methods for any table.
 */
export class GenericTableDelegate<T extends Record<string, unknown> = Record<string, unknown>> {
  private collection: string;
  private tableName: string;
  private client: VibeClient;

  constructor(collection: string, tableName: string, client: VibeClient) {
    this.collection = collection;
    this.tableName = tableName;
    this.client = client;
  }

  /**
   * Find multiple records with optional filtering and pagination.
   */
  async findMany(options?: FindManyOptions<T>): Promise<FindManyResult<T & { _vibe_doc_id?: number }>> {
    const params = new URLSearchParams();

    // Build filter params
    if (options?.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            // Handle operator objects
            for (const [op, val] of Object.entries(value as Record<string, unknown>)) {
              if (Array.isArray(val)) {
                val.forEach((v) => params.append(`filter[${key}][${op}][]`, String(v)));
              } else {
                params.append(`filter[${key}][${op}]`, String(val));
              }
            }
          } else if (Array.isArray(value)) {
            value.forEach((v) => params.append(`filter[${key}][]`, String(v)));
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
    const path = vibeTablePath(this.collection, this.tableName);
    const url = `${this.client.getBaseUrl()}${path}${queryString ? `?${queryString}` : ''}`;

    const response = await this.client.request<VibeDocumentWrapper[]>(url, 'GET');
    const unwrapped = extractVibeDocuments<T>(response);

    return {
      data: unwrapped,
      meta: response.meta || { total: unwrapped.length, limit: options?.take || 50, offset: options?.skip || 0 },
    };
  }

  /**
   * Find a single record by ID.
   * Throws VibeNotFoundError if not found.
   */
  async findUnique(options: { where: { id: number } }): Promise<T & { _vibe_doc_id?: number }> {
    const path = vibeTablePath(this.collection, this.tableName, options.where.id);
    const url = `${this.client.getBaseUrl()}${path}`;
    const response = await this.client.request<VibeDocumentWrapper>(url, 'GET');
    const unwrapped = unwrapVibeDocument<T>(response.data);
    if (!unwrapped) {
      throw new VibeNotFoundError(
        `Document ${options.where.id} not found in ${this.collection}/${this.tableName}`,
        'NOT_FOUND',
        { collection: this.collection, table: this.tableName, id: options.where.id }
      );
    }
    return unwrapped;
  }

  /**
   * Find a single record by ID, returns null if not found.
   */
  async findUniqueOrNull(options: { where: { id: number } }): Promise<(T & { _vibe_doc_id?: number }) | null> {
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
   */
  async findFirst(options?: FindManyOptions<T>): Promise<(T & { _vibe_doc_id?: number }) | null> {
    const result = await this.findMany({ ...options, take: 1 });
    return result.data[0] || null;
  }

  /**
   * Create a new record.
   */
  async create(options: { data: Partial<T> }): Promise<T & { _vibe_doc_id?: number }> {
    const path = vibeTablePath(this.collection, this.tableName);
    const url = `${this.client.getBaseUrl()}${path}`;
    const response = await this.client.request<VibeDocumentWrapper>(url, 'POST', options.data);
    const unwrapped = unwrapVibeDocument<T>(response.data);
    if (!unwrapped) {
      throw new VibeServiceError('Failed to parse created document');
    }
    return unwrapped;
  }

  /**
   * Update an existing record by ID.
   */
  async update(options: { where: { id: number }; data: Partial<T> }): Promise<T & { _vibe_doc_id?: number }> {
    const path = vibeTablePath(this.collection, this.tableName, options.where.id);
    const url = `${this.client.getBaseUrl()}${path}`;
    const response = await this.client.request<VibeDocumentWrapper>(url, 'PUT', options.data);
    const unwrapped = unwrapVibeDocument<T>(response.data);
    if (!unwrapped) {
      throw new VibeServiceError('Failed to parse updated document');
    }
    return unwrapped;
  }

  /**
   * Delete a record by ID (soft delete).
   */
  async delete(options: { where: { id: number } }): Promise<T & { _vibe_doc_id?: number }> {
    const path = vibeTablePath(this.collection, this.tableName, options.where.id);
    const url = `${this.client.getBaseUrl()}${path}`;
    const response = await this.client.request<VibeDocumentWrapper>(url, 'DELETE');
    const unwrapped = unwrapVibeDocument<T>(response.data);
    if (!unwrapped) {
      throw new VibeServiceError('Failed to parse deleted document');
    }
    return unwrapped;
  }

  /**
   * Count records matching the filter.
   */
  async count(options?: { where?: FindManyOptions<T>['where'] }): Promise<number> {
    const result = await this.findMany({ ...options, take: 0 });
    return result.meta.total;
  }
}

// -----------------------------------------------------------------------------
// GENERIC COLLECTION
// -----------------------------------------------------------------------------

/**
 * Generic collection accessor for dynamic table access.
 */
export class GenericCollection {
  private collectionName: string;
  private client: VibeClient;

  constructor(collectionName: string, client: VibeClient) {
    this.collectionName = collectionName;
    this.client = client;
  }

  /**
   * Get a table delegate for the specified table.
   *
   * @example
   * const idealResume = vibeCollection('ideal_resume');
   * const resumes = await idealResume.table('resumes').findMany();
   */
  table<T extends Record<string, unknown> = Record<string, unknown>>(tableName: string): GenericTableDelegate<T> {
    return new GenericTableDelegate<T>(this.collectionName, tableName, this.client);
  }
}

// -----------------------------------------------------------------------------
// FACTORY FUNCTIONS
// -----------------------------------------------------------------------------

let defaultClient: VibeClient | null = null;

function getDefaultClient(): VibeClient {
  if (!defaultClient) {
    defaultClient = new VibeClient();
  }
  return defaultClient;
}

/**
 * Get a generic collection accessor for dynamic table access.
 *
 * @param collectionName - Name of the collection (e.g., 'ideal_resume', 'vibe_app')
 * @param config - Optional client configuration
 * @returns GenericCollection instance
 *
 * @example
 * import { vibeCollection } from '@payez/next-mvp/vibe';
 *
 * const idealResume = vibeCollection('ideal_resume');
 * const resumes = await idealResume.table('resumes').findMany({ take: 10 });
 * const resume = await idealResume.table('resumes').findUnique({ where: { id: 123 } });
 */
export function vibeCollection(collectionName: string, config?: VibeClientConfig): GenericCollection {
  const client = config ? new VibeClient(config) : getDefaultClient();
  return new GenericCollection(collectionName, client);
}

/**
 * Create a generic table delegate directly.
 *
 * @param collection - Collection name
 * @param table - Table name
 * @param config - Optional client configuration
 * @returns GenericTableDelegate instance
 *
 * @example
 * import { vibeTable } from '@payez/next-mvp/vibe';
 *
 * const resumes = vibeTable('ideal_resume', 'resumes');
 * const allResumes = await resumes.findMany();
 */
export function vibeTable<T extends Record<string, unknown> = Record<string, unknown>>(
  collection: string,
  table: string,
  config?: VibeClientConfig
): GenericTableDelegate<T> {
  const client = config ? new VibeClient(config) : getDefaultClient();
  return new GenericTableDelegate<T>(collection, table, client);
}
