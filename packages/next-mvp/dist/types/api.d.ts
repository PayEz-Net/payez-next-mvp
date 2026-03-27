export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: ApiMeta;
    timestamp: string;
    requestId: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
    field?: string;
    resolution?: string;
    supportContact?: string;
    remainingAttempts?: number;
}
export interface ApiMeta {
    version: string;
    responseTime: number;
    operation?: string;
    rateLimit?: {
        limit: number;
        remaining: number;
        resetAt: string;
    };
    pagination?: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    cached?: boolean;
    filters?: Record<string, any>;
    aggregation?: Record<string, any>;
    resourceId?: string | number;
}
export interface ApiRequestContext {
    requestId: string;
    startTime: number;
    userAgent?: string;
    ipAddress?: string;
    userId?: string;
    sessionId?: string;
    endpoint: string;
    method: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
}
export interface ApiValidationError {
    field: string;
    message: string;
    code: string;
    value?: any;
}
export interface ApiAuthContext {
    accessToken: string | null;
    tokenType: string;
    refreshToken: string | null;
    userId?: string;
    roles?: string[];
    sessionId?: string;
    expiresAt?: number;
}
export interface ApiHandlerConfig {
    requireAuth?: boolean;
    requiredRoles?: readonly string[];
    rateLimit?: {
        windowMs: number;
        maxRequests: number;
    };
    validation?: {
        body?: any;
        query?: any;
        params?: any;
    };
    timeout?: number;
    retries?: number;
    cacheTtl?: number;
    tokenRefreshBuffer?: number;
}
export interface ApiMiddleware {
    name: string;
    execute: (context: ApiRequestContext, config: ApiHandlerConfig) => Promise<void>;
}
export declare enum ApiErrorCode {
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INVALID_TOKEN = "INVALID_TOKEN",
    INVALID_SESSION = "INVALID_SESSION",
    INVALID_2FA_TOKEN = "INVALID_2FA_TOKEN",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_REQUEST = "INVALID_REQUEST",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    INVALID_FORMAT = "INVALID_FORMAT",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    NOT_FOUND = "NOT_FOUND",
    RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
    CONFLICT = "CONFLICT",
    BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION",
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    TIMEOUT = "TIMEOUT",
    CIRCUIT_BREAKER_OPEN = "CIRCUIT_BREAKER_OPEN",
    UPSTREAM_SERVICE_ERROR = "UPSTREAM_SERVICE_ERROR",
    NETWORK_ERROR = "NETWORK_ERROR",
    CONNECTION_ERROR = "CONNECTION_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR"
}
export declare const ApiErrorMessages: Record<ApiErrorCode, string>;
export type ApiSuccessResponse<T> = ApiResponse<T> & {
    success: true;
    data: T;
    message: string;
    operation_code: string;
};
export type ApiErrorResponse = ApiResponse<never> & {
    success: false;
    error: ApiError;
};
export declare class ApiResponseBuilder {
    private context;
    private config;
    constructor(context: ApiRequestContext, config?: ApiHandlerConfig);
    success<T>(data: T, meta?: Partial<ApiMeta>): ApiSuccessResponse<T>;
    error(code: ApiErrorCode, message?: string, details?: Record<string, any>, field?: string): ApiErrorResponse;
    private getResolution;
}
