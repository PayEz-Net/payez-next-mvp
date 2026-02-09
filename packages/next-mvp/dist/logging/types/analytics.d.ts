export interface ErrorMetrics {
    totalErrors: number;
    errorCount: number;
    warnCount: number;
    fatalCount: number;
    topFailingRoutes: RouteError[];
    byCategory: CategoryCount[];
    topErrorCodes?: TopErrorCode[];
    hourlyTrend?: HourlyTrendPoint[];
    periodStart: string;
    periodEnd: string;
}
export interface RouteError {
    route: string;
    count: number;
    percentage: number;
}
export interface LevelCount {
    level: 'error' | 'warn' | 'fatal';
    count: number;
}
export interface CategoryCount {
    category: string;
    count: number;
}
export interface TopErrorCode {
    errorCode: string;
    count: number;
}
export interface HourlyTrendPoint {
    hour: string;
    count: number;
}
export interface ErrorDetail {
    timestamp: string;
    level: string;
    message: string;
    path: string;
    userId?: number;
    errorCode?: string;
}
export interface HealthMetrics {
    timeRange: string;
    apiHealth: {
        avgResponseTimeMs: number;
        p95ResponseTimeMs: number;
        p99ResponseTimeMs: number;
        requestCount: number;
        errorRate: number;
    };
    endpointBreakdown: EndpointHealth[];
    rateLimitHits: number;
    slowRequests: SlowRequest[];
}
export interface EndpointHealth {
    endpoint: string;
    avgDurationMs: number;
    p95DurationMs: number;
    requestCount: number;
    errorRate: number;
}
export interface SlowRequest {
    timestamp: string;
    path: string;
    durationMs: number;
    userId?: number;
}
export type TimeRange = '1h' | '24h' | '7d' | '30d';
