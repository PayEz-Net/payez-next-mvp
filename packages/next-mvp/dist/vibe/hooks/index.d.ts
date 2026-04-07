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
import { useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import type { VibeTableName, VibeTableType, FindManyOptions, FindManyResult, CreateOptions, UpdateOptions, VibeClientConfig } from '../client';
import type { VibeError } from '../errors';
/**
 * Generate consistent query keys for Vibe queries.
 */
export declare const vibeKeys: {
    all: readonly ["vibe"];
    table: (table: VibeTableName) => readonly ["vibe", keyof import("..").VibeTableTypes];
    list: (table: VibeTableName, options?: FindManyOptions<unknown>) => readonly ["vibe", keyof import("..").VibeTableTypes, "list", FindManyOptions<unknown> | undefined];
    detail: (table: VibeTableName, id: number) => readonly ["vibe", keyof import("..").VibeTableTypes, "detail", number];
    count: (table: VibeTableName, options?: {
        where?: unknown;
    }) => readonly ["vibe", keyof import("..").VibeTableTypes, "count", {
        where?: unknown;
    } | undefined];
};
export interface UseVibeQueryOptions<T extends VibeTableName> extends Omit<UseQueryOptions<FindManyResult<VibeTableType<T>>, VibeError>, 'queryKey' | 'queryFn'> {
    /** Vibe client config (optional - uses default if not provided) */
    config?: VibeClientConfig;
}
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
export declare function useVibeQuery<T extends VibeTableName>(table: T, options?: FindManyOptions<VibeTableType<T>>, queryOptions?: UseVibeQueryOptions<T>): import("@tanstack/react-query").UseQueryResult<FindManyResult<VibeTableType<T>>, VibeError>;
export interface UseVibeDetailOptions<T extends VibeTableName> extends Omit<UseQueryOptions<VibeTableType<T> | null, VibeError>, 'queryKey' | 'queryFn'> {
    /** Vibe client config (optional - uses default if not provided) */
    config?: VibeClientConfig;
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
export declare function useVibeDetail<T extends VibeTableName>(table: T, id: number | null | undefined, queryOptions?: UseVibeDetailOptions<T>): import("@tanstack/react-query").UseQueryResult<import("@tanstack/react-query").NoInfer<VibeTableType<T> | null>, VibeError>;
export interface UseVibeCountOptions<T extends VibeTableName> extends Omit<UseQueryOptions<number, VibeError>, 'queryKey' | 'queryFn'> {
    /** Vibe client config (optional - uses default if not provided) */
    config?: VibeClientConfig;
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
export declare function useVibeCount<T extends VibeTableName>(table: T, options?: {
    where?: FindManyOptions<VibeTableType<T>>['where'];
}, queryOptions?: UseVibeCountOptions<T>): import("@tanstack/react-query").UseQueryResult<number, VibeError>;
type MutationOperation = 'create' | 'update' | 'delete';
type MutationInput<T extends VibeTableName, Op extends MutationOperation> = Op extends 'create' ? CreateOptions<VibeTableType<T>>['data'] : Op extends 'update' ? UpdateOptions<VibeTableType<T>> : Op extends 'delete' ? {
    id: number;
} : never;
type MutationResult<T extends VibeTableName, Op extends MutationOperation> = Op extends 'create' ? VibeTableType<T> : Op extends 'update' ? VibeTableType<T> : Op extends 'delete' ? VibeTableType<T> : never;
export interface UseVibeMutationOptions<T extends VibeTableName, Op extends MutationOperation> extends Omit<UseMutationOptions<MutationResult<T, Op>, VibeError, MutationInput<T, Op>>, 'mutationFn'> {
    /** Vibe client config (optional - uses default if not provided) */
    config?: VibeClientConfig;
    /** Automatically invalidate list queries after mutation (default: true) */
    invalidateOnSuccess?: boolean;
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
export declare function useVibeMutation<T extends VibeTableName, Op extends MutationOperation>(table: T, operation: Op, mutationOptions?: UseVibeMutationOptions<T, Op>): import("@tanstack/react-query").UseMutationResult<MutationResult<T, Op>, VibeError, MutationInput<T, Op>, unknown>;
/**
 * Convenience hook for creating records.
 */
export declare function useVibeCreate<T extends VibeTableName>(table: T, options?: Omit<UseVibeMutationOptions<T, 'create'>, never>): import("@tanstack/react-query").UseMutationResult<VibeTableType<T>, VibeError, Omit<VibeTableType<T>, "created_at" | "id" | "updated_at">, unknown>;
/**
 * Convenience hook for updating records.
 */
export declare function useVibeUpdate<T extends VibeTableName>(table: T, options?: Omit<UseVibeMutationOptions<T, 'update'>, never>): import("@tanstack/react-query").UseMutationResult<VibeTableType<T>, VibeError, UpdateOptions<VibeTableType<T>>, unknown>;
/**
 * Convenience hook for deleting records.
 */
export declare function useVibeDelete<T extends VibeTableName>(table: T, options?: Omit<UseVibeMutationOptions<T, 'delete'>, never>): import("@tanstack/react-query").UseMutationResult<VibeTableType<T>, VibeError, {
    id: number;
}, unknown>;
/**
 * Prefetch Vibe data for SSR/SSG.
 *
 * @example
 * ```tsx
 * // In getServerSideProps or generateStaticParams
 * await prefetchVibeQuery(queryClient, 'users', { take: 10 })
 * ```
 */
export declare function prefetchVibeQuery<T extends VibeTableName>(queryClient: ReturnType<typeof useQueryClient>, table: T, options?: FindManyOptions<VibeTableType<T>>, config?: VibeClientConfig): Promise<void>;
/**
 * Prefetch a single Vibe record for SSR/SSG.
 */
export declare function prefetchVibeDetail<T extends VibeTableName>(queryClient: ReturnType<typeof useQueryClient>, table: T, id: number, config?: VibeClientConfig): Promise<void>;
export {};
