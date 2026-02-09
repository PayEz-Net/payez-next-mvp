import { TimeRange } from '../types';
/**
 * Combined hook for admin analytics
 * Fetches both error and health metrics
 */
export declare function useAdminAnalytics(timeRange?: TimeRange): {
    errorMetrics: {
        data: import("../types").ErrorMetrics | null;
        loading: boolean;
        error: string | null;
    };
    healthMetrics: {
        data: import("../types").HealthMetrics | null;
        loading: boolean;
        error: string | null;
    };
    auditLog: {
        log: (entry: Omit<import("../types").AuditLogEntry, "id" | "timestamp">) => Promise<void>;
        writing: boolean;
        error: string | null;
    };
    loading: boolean;
    error: string | null;
};
