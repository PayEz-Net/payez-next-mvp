"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAdminAnalytics = useAdminAnalytics;
const useErrorMetrics_1 = require("./useErrorMetrics");
const useHealthMetrics_1 = require("./useHealthMetrics");
const useAuditLog_1 = require("./useAuditLog");
/**
 * Combined hook for admin analytics
 * Fetches both error and health metrics
 */
function useAdminAnalytics(timeRange = '24h') {
    const errorMetrics = (0, useErrorMetrics_1.useErrorMetrics)(timeRange);
    const healthMetrics = (0, useHealthMetrics_1.useHealthMetrics)(timeRange);
    const auditLog = (0, useAuditLog_1.useAuditLog)();
    return {
        errorMetrics,
        healthMetrics,
        auditLog,
        loading: errorMetrics.loading || healthMetrics.loading,
        error: errorMetrics.error || healthMetrics.error,
    };
}
