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

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query';

import { vibe, createVibeClient } from '../client';
import type {
  VibeTableName,
  VibeTableType,
  FindManyOptions,
  FindManyResult,
  CreateOptions,
  UpdateOptions,
  VibeClientConfig,
} from '../client';
import type { VibeError } from '../errors';

// -----------------------------------------------------------------------------
// QUERY KEY FACTORY
// -----------------------------------------------------------------------------

/**
 * Generate consistent query keys for Vibe queries.
 */
export const vibeKeys = {
  all: ['vibe'] as const,
  table: (table: VibeTableName) => [...vibeKeys.all, table] as const,
  list: (table: VibeTableName, options?: FindManyOptions<unknown>) =>
    [...vibeKeys.table(table), 'list', options] as const,
  detail: (table: VibeTableName, id: number) =>
    [...vibeKeys.table(table), 'detail', id] as const,
  count: (table: VibeTableName, options?: { where?: unknown }) =>
    [...vibeKeys.table(table), 'count', options] as const,
};

// -----------------------------------------------------------------------------
// USE VIBE QUERY HOOK
// -----------------------------------------------------------------------------

export interface UseVibeQueryOptions<T extends VibeTableName>
  extends Omit<
    UseQueryOptions<FindManyResult<VibeTableType<T>>, VibeError>,
    'queryKey' | 'queryFn'
  > {
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
export function useVibeQuery<T extends VibeTableName>(
  table: T,
  options?: FindManyOptions<VibeTableType<T>>,
  queryOptions?: UseVibeQueryOptions<T>
) {
  const client = queryOptions?.config ? createVibeClient(queryOptions.config) : vibe;

  return useQuery<FindManyResult<VibeTableType<T>>, VibeError>({
    queryKey: vibeKeys.list(table, options as FindManyOptions<unknown>),
    queryFn: () => (client[table] as any).findMany(options),
    ...queryOptions,
  });
}

// -----------------------------------------------------------------------------
// USE VIBE DETAIL HOOK
// -----------------------------------------------------------------------------

export interface UseVibeDetailOptions<T extends VibeTableName>
  extends Omit<
    UseQueryOptions<VibeTableType<T> | null, VibeError>,
    'queryKey' | 'queryFn'
  > {
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
export function useVibeDetail<T extends VibeTableName>(
  table: T,
  id: number | null | undefined,
  queryOptions?: UseVibeDetailOptions<T>
) {
  const client = queryOptions?.config ? createVibeClient(queryOptions.config) : vibe;

  return useQuery<VibeTableType<T> | null, VibeError>({
    queryKey: vibeKeys.detail(table, id!),
    queryFn: () => (client[table] as any).findUniqueOrNull({ where: { id } }),
    enabled: id != null && (queryOptions?.enabled ?? true),
    ...queryOptions,
  });
}

// -----------------------------------------------------------------------------
// USE VIBE COUNT HOOK
// -----------------------------------------------------------------------------

export interface UseVibeCountOptions<T extends VibeTableName>
  extends Omit<UseQueryOptions<number, VibeError>, 'queryKey' | 'queryFn'> {
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
export function useVibeCount<T extends VibeTableName>(
  table: T,
  options?: { where?: FindManyOptions<VibeTableType<T>>['where'] },
  queryOptions?: UseVibeCountOptions<T>
) {
  const client = queryOptions?.config ? createVibeClient(queryOptions.config) : vibe;

  return useQuery<number, VibeError>({
    queryKey: vibeKeys.count(table, options),
    queryFn: () => (client[table] as any).count(options),
    ...queryOptions,
  });
}

// -----------------------------------------------------------------------------
// USE VIBE MUTATION HOOK
// -----------------------------------------------------------------------------

type MutationOperation = 'create' | 'update' | 'delete';

type MutationInput<T extends VibeTableName, Op extends MutationOperation> =
  Op extends 'create' ? CreateOptions<VibeTableType<T>>['data'] :
  Op extends 'update' ? UpdateOptions<VibeTableType<T>> :
  Op extends 'delete' ? { id: number } :
  never;

type MutationResult<T extends VibeTableName, Op extends MutationOperation> =
  Op extends 'create' ? VibeTableType<T> :
  Op extends 'update' ? VibeTableType<T> :
  Op extends 'delete' ? VibeTableType<T> :
  never;

export interface UseVibeMutationOptions<
  T extends VibeTableName,
  Op extends MutationOperation
> extends Omit<
  UseMutationOptions<MutationResult<T, Op>, VibeError, MutationInput<T, Op>>,
  'mutationFn'
> {
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
export function useVibeMutation<
  T extends VibeTableName,
  Op extends MutationOperation
>(
  table: T,
  operation: Op,
  mutationOptions?: UseVibeMutationOptions<T, Op>
) {
  const queryClient = useQueryClient();
  const client = mutationOptions?.config ? createVibeClient(mutationOptions.config) : vibe;
  const { invalidateOnSuccess = true, ...restOptions } = mutationOptions || {};

  const { onSuccess: userOnSuccess, ...otherOptions } = restOptions;

  return useMutation<MutationResult<T, Op>, VibeError, MutationInput<T, Op>>({
    mutationFn: async (input) => {
      const delegate = client[table] as any;

      switch (operation) {
        case 'create':
          return delegate.create({ data: input });
        case 'update':
          const updateInput = input as UpdateOptions<VibeTableType<T>>;
          return delegate.update(updateInput);
        case 'delete':
          const deleteInput = input as { id: number };
          return delegate.delete({ where: { id: deleteInput.id } });
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    },
    onSuccess: (...args) => {
      // Invalidate list queries for this table
      if (invalidateOnSuccess) {
        queryClient.invalidateQueries({ queryKey: vibeKeys.table(table) });
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
export function useVibeCreate<T extends VibeTableName>(
  table: T,
  options?: Omit<UseVibeMutationOptions<T, 'create'>, never>
) {
  return useVibeMutation(table, 'create', options);
}

/**
 * Convenience hook for updating records.
 */
export function useVibeUpdate<T extends VibeTableName>(
  table: T,
  options?: Omit<UseVibeMutationOptions<T, 'update'>, never>
) {
  return useVibeMutation(table, 'update', options);
}

/**
 * Convenience hook for deleting records.
 */
export function useVibeDelete<T extends VibeTableName>(
  table: T,
  options?: Omit<UseVibeMutationOptions<T, 'delete'>, never>
) {
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
export async function prefetchVibeQuery<T extends VibeTableName>(
  queryClient: ReturnType<typeof useQueryClient>,
  table: T,
  options?: FindManyOptions<VibeTableType<T>>,
  config?: VibeClientConfig
) {
  const client = config ? createVibeClient(config) : vibe;

  await queryClient.prefetchQuery({
    queryKey: vibeKeys.list(table, options as FindManyOptions<unknown>),
    queryFn: () => (client[table] as any).findMany(options),
  });
}

/**
 * Prefetch a single Vibe record for SSR/SSG.
 */
export async function prefetchVibeDetail<T extends VibeTableName>(
  queryClient: ReturnType<typeof useQueryClient>,
  table: T,
  id: number,
  config?: VibeClientConfig
) {
  const client = config ? createVibeClient(config) : vibe;

  await queryClient.prefetchQuery({
    queryKey: vibeKeys.detail(table, id),
    queryFn: () => (client[table] as any).findUniqueOrNull({ where: { id } }),
  });
}
