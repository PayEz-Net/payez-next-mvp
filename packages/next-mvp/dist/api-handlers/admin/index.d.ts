/**
 * Admin API Handlers
 *
 * Provides admin-level API handlers for Vibe data access.
 * These handlers use service account credentials to bypass user filtering.
 *
 * Usage:
 * ------
 * // In your app's API route (e.g., app/api/admin/vibe/data/[collection]/[table]/route.ts)
 * import { createGetTableDataHandler } from '@payez/next-mvp/api-handlers/admin';
 *
 * export const GET = createGetTableDataHandler({ ... });
 */
export { createGetCollectionsHandler, createGetTablesHandler, createGetTableDataHandler, createGetRecordHandler, createUpdateRecordHandler, createDeleteRecordHandler, createQueryHandler, type AdminVibeHandlerConfig, } from './vibe-data';
export { createSessionsHandler, type AdminSessionsHandlerConfig, } from './sessions';
export { createUsersHandler, type AdminUsersHandlerConfig, } from './users';
export { createAuditHandler, type AdminAuditHandlerConfig, } from './audit';
export { createAnalyticsHandler, type AdminAnalyticsHandlerConfig, } from './analytics';
export { createSiteLogsHandler, createSiteLogsStatsHandler, createSiteLogsDrainHandler, createSiteLogsQueueHandler, type SiteLogsHandlerConfig, } from './site-logs';
export { createRedisSessionsHandler, createRedisSessionRevokeHandler, type RedisSessionsHandlerConfig, } from './redis-sessions';
export { createStatsHandler, type AdminStatsHandlerConfig, } from './stats';
