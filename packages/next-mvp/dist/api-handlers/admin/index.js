"use strict";
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
 * import { getAuthOptions } from '@payez/next-mvp/auth/auth-options';
 *
 * export const GET = createGetTableDataHandler({ getAuthOptions });
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStatsHandler = exports.createRedisSessionRevokeHandler = exports.createRedisSessionsHandler = exports.createSiteLogsQueueHandler = exports.createSiteLogsDrainHandler = exports.createSiteLogsStatsHandler = exports.createSiteLogsHandler = exports.createAnalyticsHandler = exports.createAuditHandler = exports.createUsersHandler = exports.createSessionsHandler = exports.createQueryHandler = exports.createDeleteRecordHandler = exports.createUpdateRecordHandler = exports.createGetRecordHandler = exports.createGetTableDataHandler = exports.createGetTablesHandler = exports.createGetCollectionsHandler = void 0;
var vibe_data_1 = require("./vibe-data");
Object.defineProperty(exports, "createGetCollectionsHandler", { enumerable: true, get: function () { return vibe_data_1.createGetCollectionsHandler; } });
Object.defineProperty(exports, "createGetTablesHandler", { enumerable: true, get: function () { return vibe_data_1.createGetTablesHandler; } });
Object.defineProperty(exports, "createGetTableDataHandler", { enumerable: true, get: function () { return vibe_data_1.createGetTableDataHandler; } });
Object.defineProperty(exports, "createGetRecordHandler", { enumerable: true, get: function () { return vibe_data_1.createGetRecordHandler; } });
Object.defineProperty(exports, "createUpdateRecordHandler", { enumerable: true, get: function () { return vibe_data_1.createUpdateRecordHandler; } });
Object.defineProperty(exports, "createDeleteRecordHandler", { enumerable: true, get: function () { return vibe_data_1.createDeleteRecordHandler; } });
Object.defineProperty(exports, "createQueryHandler", { enumerable: true, get: function () { return vibe_data_1.createQueryHandler; } });
var sessions_1 = require("./sessions");
Object.defineProperty(exports, "createSessionsHandler", { enumerable: true, get: function () { return sessions_1.createSessionsHandler; } });
var users_1 = require("./users");
Object.defineProperty(exports, "createUsersHandler", { enumerable: true, get: function () { return users_1.createUsersHandler; } });
var audit_1 = require("./audit");
Object.defineProperty(exports, "createAuditHandler", { enumerable: true, get: function () { return audit_1.createAuditHandler; } });
var analytics_1 = require("./analytics");
Object.defineProperty(exports, "createAnalyticsHandler", { enumerable: true, get: function () { return analytics_1.createAnalyticsHandler; } });
var site_logs_1 = require("./site-logs");
Object.defineProperty(exports, "createSiteLogsHandler", { enumerable: true, get: function () { return site_logs_1.createSiteLogsHandler; } });
Object.defineProperty(exports, "createSiteLogsStatsHandler", { enumerable: true, get: function () { return site_logs_1.createSiteLogsStatsHandler; } });
Object.defineProperty(exports, "createSiteLogsDrainHandler", { enumerable: true, get: function () { return site_logs_1.createSiteLogsDrainHandler; } });
Object.defineProperty(exports, "createSiteLogsQueueHandler", { enumerable: true, get: function () { return site_logs_1.createSiteLogsQueueHandler; } });
var redis_sessions_1 = require("./redis-sessions");
Object.defineProperty(exports, "createRedisSessionsHandler", { enumerable: true, get: function () { return redis_sessions_1.createRedisSessionsHandler; } });
Object.defineProperty(exports, "createRedisSessionRevokeHandler", { enumerable: true, get: function () { return redis_sessions_1.createRedisSessionRevokeHandler; } });
var stats_1 = require("./stats");
Object.defineProperty(exports, "createStatsHandler", { enumerable: true, get: function () { return stats_1.createStatsHandler; } });
