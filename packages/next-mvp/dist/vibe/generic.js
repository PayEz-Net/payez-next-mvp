"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericCollection = exports.GenericTableDelegate = void 0;
exports.vibeTablePath = vibeTablePath;
exports.vibeQueryPath = vibeQueryPath;
exports.vibeGridPath = vibeGridPath;
exports.unwrapVibeDocument = unwrapVibeDocument;
exports.extractVibeDocuments = extractVibeDocuments;
exports.vibeCollection = vibeCollection;
exports.vibeTable = vibeTable;
const client_1 = require("./client");
const errors_1 = require("./errors");
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
function vibeTablePath(collection, table, id) {
    const basePath = `/v1/collections/${collection}/tables/${table}`;
    return id !== undefined ? `${basePath}/${id}` : basePath;
}
/**
 * Build path for collection table query endpoint.
 * @param collection - Collection name
 * @param table - Table name
 * @returns Query API path string
 */
function vibeQueryPath(collection, table) {
    return `/v1/collections/${collection}/tables/${table}/query`;
}
/**
 * Build path for collection table grid endpoint.
 * @param collection - Collection name
 * @param table - Table name
 * @returns Grid API path string
 */
function vibeGridPath(collection, table) {
    return `/v1/collections/${collection}/tables/${table}/grid`;
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
function unwrapVibeDocument(doc) {
    if (!doc)
        return null;
    // Handle case where doc is already unwrapped (has schema fields directly)
    if (!('document_id' in doc) && !('data' in doc)) {
        return doc;
    }
    const wrapper = doc;
    let parsedData = {};
    if (typeof wrapper.data === 'string') {
        try {
            parsedData = JSON.parse(wrapper.data);
        }
        catch {
            console.warn('[vibe-generic] Failed to parse document data JSON:', wrapper.data);
            parsedData = {};
        }
    }
    else if (typeof wrapper.data === 'object' && wrapper.data !== null) {
        parsedData = wrapper.data;
    }
    // Preserve document_id as _vibe_doc_id for Vibe API update/delete paths only
    const documentId = wrapper.document_id ?? doc.document_id;
    if (documentId != null) {
        parsedData._vibe_doc_id = documentId;
    }
    return parsedData;
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
function extractVibeDocuments(responseData) {
    if (!responseData || typeof responseData !== 'object') {
        return [];
    }
    const data = responseData;
    // Try common response shapes
    const docs = data.data ??
        data.items ??
        data.documents ??
        (Array.isArray(responseData) ? responseData : null);
    if (!Array.isArray(docs)) {
        return [];
    }
    return docs
        .map((doc) => unwrapVibeDocument(doc))
        .filter((d) => d !== null);
}
// -----------------------------------------------------------------------------
// GENERIC TABLE DELEGATE
// -----------------------------------------------------------------------------
/**
 * Generic table delegate for dynamic collection/table access.
 * Provides Prisma-like methods for any table.
 */
class GenericTableDelegate {
    collection;
    tableName;
    client;
    constructor(collection, tableName, client) {
        this.collection = collection;
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
                if (value !== undefined && value !== null) {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        // Handle operator objects
                        for (const [op, val] of Object.entries(value)) {
                            if (Array.isArray(val)) {
                                val.forEach((v) => params.append(`filter[${key}][${op}][]`, String(v)));
                            }
                            else {
                                params.append(`filter[${key}][${op}]`, String(val));
                            }
                        }
                    }
                    else if (Array.isArray(value)) {
                        value.forEach((v) => params.append(`filter[${key}][]`, String(v)));
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
        const path = vibeTablePath(this.collection, this.tableName);
        const url = `${this.client.getBaseUrl()}${path}${queryString ? `?${queryString}` : ''}`;
        const response = await this.client.request(url, 'GET');
        const unwrapped = extractVibeDocuments(response);
        return {
            data: unwrapped,
            meta: response.meta || { total: unwrapped.length, limit: options?.take || 50, offset: options?.skip || 0 },
        };
    }
    /**
     * Find a single record by ID.
     * Throws VibeNotFoundError if not found.
     */
    async findUnique(options) {
        const path = vibeTablePath(this.collection, this.tableName, options.where.id);
        const url = `${this.client.getBaseUrl()}${path}`;
        const response = await this.client.request(url, 'GET');
        const unwrapped = unwrapVibeDocument(response.data);
        if (!unwrapped) {
            throw new errors_1.VibeNotFoundError(`Document ${options.where.id} not found in ${this.collection}/${this.tableName}`, 'NOT_FOUND', { collection: this.collection, table: this.tableName, id: options.where.id });
        }
        return unwrapped;
    }
    /**
     * Find a single record by ID, returns null if not found.
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
     */
    async findFirst(options) {
        const result = await this.findMany({ ...options, take: 1 });
        return result.data[0] || null;
    }
    /**
     * Create a new record.
     */
    async create(options) {
        const path = vibeTablePath(this.collection, this.tableName);
        const url = `${this.client.getBaseUrl()}${path}`;
        const response = await this.client.request(url, 'POST', options.data);
        const unwrapped = unwrapVibeDocument(response.data);
        if (!unwrapped) {
            throw new errors_1.VibeServiceError('Failed to parse created document');
        }
        return unwrapped;
    }
    /**
     * Update an existing record by ID.
     */
    async update(options) {
        const path = vibeTablePath(this.collection, this.tableName, options.where.id);
        const url = `${this.client.getBaseUrl()}${path}`;
        const response = await this.client.request(url, 'PUT', options.data);
        const unwrapped = unwrapVibeDocument(response.data);
        if (!unwrapped) {
            throw new errors_1.VibeServiceError('Failed to parse updated document');
        }
        return unwrapped;
    }
    /**
     * Delete a record by ID (soft delete).
     */
    async delete(options) {
        const path = vibeTablePath(this.collection, this.tableName, options.where.id);
        const url = `${this.client.getBaseUrl()}${path}`;
        const response = await this.client.request(url, 'DELETE');
        const unwrapped = unwrapVibeDocument(response.data);
        if (!unwrapped) {
            throw new errors_1.VibeServiceError('Failed to parse deleted document');
        }
        return unwrapped;
    }
    /**
     * Count records matching the filter.
     */
    async count(options) {
        const result = await this.findMany({ ...options, take: 0 });
        return result.meta.total;
    }
}
exports.GenericTableDelegate = GenericTableDelegate;
// -----------------------------------------------------------------------------
// GENERIC COLLECTION
// -----------------------------------------------------------------------------
/**
 * Generic collection accessor for dynamic table access.
 */
class GenericCollection {
    collectionName;
    client;
    constructor(collectionName, client) {
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
    table(tableName) {
        return new GenericTableDelegate(this.collectionName, tableName, this.client);
    }
}
exports.GenericCollection = GenericCollection;
// -----------------------------------------------------------------------------
// FACTORY FUNCTIONS
// -----------------------------------------------------------------------------
let defaultClient = null;
function getDefaultClient() {
    if (!defaultClient) {
        defaultClient = new client_1.VibeClient();
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
function vibeCollection(collectionName, config) {
    const client = config ? new client_1.VibeClient(config) : getDefaultClient();
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
function vibeTable(collection, table, config) {
    const client = config ? new client_1.VibeClient(config) : getDefaultClient();
    return new GenericTableDelegate(collection, table, client);
}
