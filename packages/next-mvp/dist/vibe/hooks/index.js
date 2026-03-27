"use strict";
/**
 * =============================================================================
 * VIBE REACT QUERY HOOKS
 * =============================================================================
 *
 * React Query wrappers for Vibe App operations.
 * Provides caching, refetching, and mutation handling out of the box.
 *
 * Usage:
 *   import { useVibeQuery, useVibeMutation } from '@payez/next-mvp/vibe/hooks'
 *
 *   // Query with auto caching
 *   const { data, isLoading, error } = useVibeQuery('users', {
 *     where: { status: 'active' },
 *     take: 10
 *   })
 *
 *   // Mutations
 *   const createUser = useVibeMutation('users', 'create')
 *   await createUser.mutateAsync({ email: 'test@example.com' })
 *
 * =============================================================================
 */
'use client';
/**
 * =============================================================================
 * VIBE REACT QUERY HOOKS
 * =============================================================================
 *
 * React Query wrappers for Vibe App operations.
 * Provides caching, refetching, and mutation handling out of the box.
 *
 * Usage:
 *   import { useVibeQuery, useVibeMutation } from '@payez/next-mvp/vibe/hooks'
 *
 *   // Query with auto caching
 *   const { data, isLoading, error } = useVibeQuery('users', {
 *     where: { status: 'active' },
 *     take: 10
 *   })
 *
 *   // Mutations
 *   const createUser = useVibeMutation('users', 'create')
 *   await createUser.mutateAsync({ email: 'test@example.com' })
 *
 * =============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.vibeKeys = void 0;
exports.useVibeQuery = useVibeQuery;
exports.useVibeDetail = useVibeDetail;
exports.useVibeCount = useVibeCount;
exports.useVibeMutation = useVibeMutation;
exports.useVibeCreate = useVibeCreate;
exports.useVibeUpdate = useVibeUpdate;
exports.useVibeDelete = useVibeDelete;
exports.prefetchVibeQuery = prefetchVibeQuery;
exports.prefetchVibeDetail = prefetchVibeDetail;
const react_query_1 = require("@tanstack/react-query");
const client_1 = require("../client");
// -----------------------------------------------------------------------------
// QUERY KEY FACTORY
// -----------------------------------------------------------------------------
/**
 * Generate consistent query keys for Vibe queries.
 */
exports.vibeKeys = {
    all: ['vibe'],
    table: (table) => [...exports.vibeKeys.all, table],
    list: (table, options) => [...exports.vibeKeys.table(table), 'list', options],
    detail: (table, id) => [...exports.vibeKeys.table(table), 'detail', id],
    count: (table, options) => [...exports.vibeKeys.table(table), 'count', options],
};
/**
 * React Query hook for fetching Vibe data.
 *
 * @param table - The table to query
 * @param options - Query options (where, take, skip, orderBy)
 * @param queryOptions - React Query options
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useVibeQuery('users', {
 *   where: { status: 'active' },
 *   take: 10,
 *   orderBy: { created_at: 'desc' }
 * })
 * ```
 */
function useVibeQuery(table, options, queryOptions) {
    const client = queryOptions?.config ? (0, client_1.createVibeClient)(queryOptions.config) : client_1.vibe;
    return (0, react_query_1.useQuery)({
        queryKey: exports.vibeKeys.list(table, options),
        queryFn: () => client[table].findMany(options),
        ...queryOptions,
    });
}
/**
 * React Query hook for fetching a single Vibe record by ID.
 *
 * @param table - The table to query
 * @param id - The record ID
 * @param queryOptions - React Query options
 *
 * @example
 * ```tsx
 * const { data: user, isLoading } = useVibeDetail('users', 123)
 * ```
 */
function useVibeDetail(table, id, queryOptions) {
    const client = queryOptions?.config ? (0, client_1.createVibeClient)(queryOptions.config) : client_1.vibe;
    return (0, react_query_1.useQuery)({
        queryKey: exports.vibeKeys.detail(table, id),
        queryFn: () => client[table].findUniqueOrNull({ where: { id } }),
        enabled: id != null && (queryOptions?.enabled ?? true),
        ...queryOptions,
    });
}
/**
 * React Query hook for counting Vibe records.
 *
 * @param table - The table to query
 * @param options - Count options (where)
 * @param queryOptions - React Query options
 *
 * @example
 * ```tsx
 * const { data: count } = useVibeCount('users', { where: { status: 'active' } })
 * ```
 */
function useVibeCount(table, options, queryOptions) {
    const client = queryOptions?.config ? (0, client_1.createVibeClient)(queryOptions.config) : client_1.vibe;
    return (0, react_query_1.useQuery)({
        queryKey: exports.vibeKeys.count(table, options),
        queryFn: () => client[table].count(options),
        ...queryOptions,
    });
}
/**
 * React Query mutation hook for Vibe operations.
 *
 * @param table - The table to mutate
 * @param operation - The operation type (create, update, delete)
 * @param mutationOptions - React Query mutation options
 *
 * @example
 * ```tsx
 * const createUser = useVibeMutation('users', 'create')
 *
 * // Create a user
 * await createUser.mutateAsync({
 *   email: 'test@example.com',
 *   name: 'Test User'
 * })
 *
 * const updateUser = useVibeMutation('users', 'update')
 *
 * // Update a user
 * await updateUser.mutateAsync({
 *   where: { id: 123 },
 *   data: { name: 'Updated Name' }
 * })
 *
 * const deleteUser = useVibeMutation('users', 'delete')
 *
 * // Delete a user
 * await deleteUser.mutateAsync({ id: 123 })
 * ```
 */
function useVibeMutation(table, operation, mutationOptions) {
    const queryClient = (0, react_query_1.useQueryClient)();
    const client = mutationOptions?.config ? (0, client_1.createVibeClient)(mutationOptions.config) : client_1.vibe;
    const { invalidateOnSuccess = true, ...restOptions } = mutationOptions || {};
    const { onSuccess: userOnSuccess, ...otherOptions } = restOptions;
    return (0, react_query_1.useMutation)({
        mutationFn: async (input) => {
            const delegate = client[table];
            switch (operation) {
                case 'create':
                    return delegate.create({ data: input });
                case 'update':
                    const updateInput = input;
                    return delegate.update(updateInput);
                case 'delete':
                    const deleteInput = input;
                    return delegate.delete({ where: { id: deleteInput.id } });
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
        },
        onSuccess: (...args) => {
            // Invalidate list queries for this table
            if (invalidateOnSuccess) {
                queryClient.invalidateQueries({ queryKey: exports.vibeKeys.table(table) });
            }
            // Call user's onSuccess if provided
            userOnSuccess?.(...args);
        },
        ...otherOptions,
    });
}
// -----------------------------------------------------------------------------
// CONVENIENCE HOOKS
// -----------------------------------------------------------------------------
/**
 * Convenience hook for creating records.
 */
function useVibeCreate(table, options) {
    return useVibeMutation(table, 'create', options);
}
/**
 * Convenience hook for updating records.
 */
function useVibeUpdate(table, options) {
    return useVibeMutation(table, 'update', options);
}
/**
 * Convenience hook for deleting records.
 */
function useVibeDelete(table, options) {
    return useVibeMutation(table, 'delete', options);
}
// -----------------------------------------------------------------------------
// PREFETCH UTILITIES
// -----------------------------------------------------------------------------
/**
 * Prefetch Vibe data for SSR/SSG.
 *
 * @example
 * ```tsx
 * // In getServerSideProps or generateStaticParams
 * await prefetchVibeQuery(queryClient, 'users', { take: 10 })
 * ```
 */
async function prefetchVibeQuery(queryClient, table, options, config) {
    const client = config ? (0, client_1.createVibeClient)(config) : client_1.vibe;
    await queryClient.prefetchQuery({
        queryKey: exports.vibeKeys.list(table, options),
        queryFn: () => client[table].findMany(options),
    });
}
/**
 * Prefetch a single Vibe record for SSR/SSG.
 */
async function prefetchVibeDetail(queryClient, table, id, config) {
    const client = config ? (0, client_1.createVibeClient)(config) : client_1.vibe;
    await queryClient.prefetchQuery({
        queryKey: exports.vibeKeys.detail(table, id),
        queryFn: () => client[table].findUniqueOrNull({ where: { id } }),
    });
}
