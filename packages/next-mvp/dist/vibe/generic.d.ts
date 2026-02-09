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
export declare function vibeTablePath(collection: string, table: string, id?: number): string;
/**
 * Build path for collection table query endpoint.
 * @param collection - Collection name
 * @param table - Table name
 * @returns Query API path string
 */
export declare function vibeQueryPath(collection: string, table: string): string;
/**
 * Build path for collection table grid endpoint.
 * @param collection - Collection name
 * @param table - Table name
 * @returns Grid API path string
 */
export declare function vibeGridPath(collection: string, table: string): string;
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
 * @returns Unwrapped document with id from document_id, or null if invalid
 *
 * @example
 * const raw = { document_id: 123, data: '{"name":"John","email":"john@example.com"}' };
 * const unwrapped = unwrapVibeDocument(raw);
 * // => { id: 123, name: 'John', email: 'john@example.com' }
 */
export declare function unwrapVibeDocument<T extends Record<string, unknown> = Record<string, unknown>>(doc: VibeDocumentWrapper | Record<string, unknown> | null | undefined): (T & {
    id: number;
    document_id: number;
}) | null;
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
export declare function extractVibeDocuments<T extends Record<string, unknown> = Record<string, unknown>>(responseData: unknown): Array<T & {
    id: number;
    document_id: number;
}>;
/**
 * Generic table delegate for dynamic collection/table access.
 * Provides Prisma-like methods for any table.
 */
export declare class GenericTableDelegate<T extends Record<string, unknown> = Record<string, unknown>> {
    private collection;
    private tableName;
    private client;
    constructor(collection: string, tableName: string, client: VibeClient);
    /**
     * Find multiple records with optional filtering and pagination.
     */
    findMany(options?: FindManyOptions<T>): Promise<FindManyResult<T & {
        id: number;
        document_id: number;
    }>>;
    /**
     * Find a single record by ID.
     * Throws VibeNotFoundError if not found.
     */
    findUnique(options: {
        where: {
            id: number;
        };
    }): Promise<T & {
        id: number;
        document_id: number;
    }>;
    /**
     * Find a single record by ID, returns null if not found.
     */
    findUniqueOrNull(options: {
        where: {
            id: number;
        };
    }): Promise<(T & {
        id: number;
        document_id: number;
    }) | null>;
    /**
     * Find the first record matching the filter.
     */
    findFirst(options?: FindManyOptions<T>): Promise<(T & {
        id: number;
        document_id: number;
    }) | null>;
    /**
     * Create a new record.
     */
    create(options: {
        data: Partial<T>;
    }): Promise<T & {
        id: number;
        document_id: number;
    }>;
    /**
     * Update an existing record by ID.
     */
    update(options: {
        where: {
            id: number;
        };
        data: Partial<T>;
    }): Promise<T & {
        id: number;
        document_id: number;
    }>;
    /**
     * Delete a record by ID (soft delete).
     */
    delete(options: {
        where: {
            id: number;
        };
    }): Promise<T & {
        id: number;
        document_id: number;
    }>;
    /**
     * Count records matching the filter.
     */
    count(options?: {
        where?: FindManyOptions<T>['where'];
    }): Promise<number>;
}
/**
 * Generic collection accessor for dynamic table access.
 */
export declare class GenericCollection {
    private collectionName;
    private client;
    constructor(collectionName: string, client: VibeClient);
    /**
     * Get a table delegate for the specified table.
     *
     * @example
     * const idealResume = vibeCollection('ideal_resume');
     * const resumes = await idealResume.table('resumes').findMany();
     */
    table<T extends Record<string, unknown> = Record<string, unknown>>(tableName: string): GenericTableDelegate<T>;
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
export declare function vibeCollection(collectionName: string, config?: VibeClientConfig): GenericCollection;
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
export declare function vibeTable<T extends Record<string, unknown> = Record<string, unknown>>(collection: string, table: string, config?: VibeClientConfig): GenericTableDelegate<T>;
