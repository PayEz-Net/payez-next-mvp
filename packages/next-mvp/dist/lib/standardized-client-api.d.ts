/**
 * ERROR THROWN WHEN API RESPONSE FORMAT IS INVALID
 * This means the API is NOT following our standardized format
 */
export declare class ApiResponseFormatError extends Error {
    readonly endpoint: string;
    readonly rawResponse: unknown;
    constructor(message: string, endpoint: string, rawResponse: unknown);
}
/**
 * ERROR THROWN WHEN API RETURNS A STANDARDIZED ERROR RESPONSE
 * This is a properly formatted error from the API
 */
export declare class ApiBusinessLogicError extends Error {
    readonly errorCode: string;
    readonly operation: string;
    readonly details?: unknown | undefined;
    constructor(errorCode: string, message: string, operation: string, details?: unknown | undefined);
}
/**
 * ERROR THROWN WHEN VALIDATION FAILS
 * This is a properly formatted validation error from the API
 */
export declare class ApiValidationError extends Error {
    readonly operation: string;
    readonly validationErrors: Record<string, string[]>;
    readonly invalidValue?: unknown | undefined;
    readonly primaryField?: string | undefined;
    constructor(message: string, operation: string, validationErrors: Record<string, string[]>, invalidValue?: unknown | undefined, primaryField?: string | undefined);
}
/**
 * ERROR THROWN WHEN NETWORK/HTTP ISSUES OCCUR
 */
export declare class ApiNetworkError extends Error {
    readonly status: number;
    readonly endpoint: string;
    constructor(message: string, status: number, endpoint: string);
}
/**
 * SUCCESSFUL API CALL RESULT
 * This is what gets returned to the calling code for successful operations
 */
export interface ApiSuccessResult<TData> {
    /** Always true for success */
    success: true;
    /** The actual data - NO NESTING! Direct access! */
    data: TData;
    /** Human-readable success message from API */
    message: string;
    /** Operation code for tracking/debugging */
    operation_code: string;
    /** Server timestamp (if provided) */
    timestamp?: string;
}
/**
 * SUCCESSFUL PAGED API CALL RESULT
 * This is what gets returned for successful paged operations
 */
export interface ApiPagedResult<TData> {
    /** Always true for success */
    success: true;
    /** The actual data array - NO NESTING! Direct access! */
    items: TData[];
    /** Human-readable success message from API */
    message: string;
    /** Operation code for tracking/debugging */
    operation_code: string;
    /** Pagination information */
    pagination: {
        current_page: number;
        total_pages: number;
        page_size: number;
        total_items: number;
        has_next_page: boolean;
        has_previous_page: boolean;
    };
    /** Server timestamp (if provided) */
    timestamp?: string;
}
/**
 * FAILED API CALL RESULT
 * This is what gets returned to the calling code for failed operations
 */
export interface ApiErrorResult {
    /** Always false for errors */
    success: false;
    /** Standardized error code */
    error_code: string;
    /** Human-readable error message */
    message: string;
    /** Operation that failed */
    operation: string;
    /** Additional error details (if any) */
    details?: unknown;
    /** Validation errors (if any) */
    validation_errors?: Record<string, string[]>;
    /** Server-provided request identifier for tracing (only set on real errors) */
    request_id?: string;
}
/** UNION TYPE FOR ALL POSSIBLE API RESULTS */
export type ApiResult<TData> = ApiSuccessResult<TData> | ApiPagedResult<TData> | ApiErrorResult;
declare class StandardizedClientApiService {
    private baseUrl;
    constructor();
    /**
     * MAKES HTTP REQUEST AND VALIDATES RESPONSE FORMAT
     * This method ENFORCES standardized response format compliance
     * Will throw ApiResponseFormatError if format is invalid
     */
    private makeRequest;
    /**
     * CONVERTS VALIDATED STANDARDIZED RESPONSE TO CLIENT RESULT
     * This normalizes the response for client consumption
     */
    private convertToApiResult;
    /**
     * GET REQUEST - Returns typed result with direct data access
     */
    get<TData = unknown>(endpoint: string, sessionToken?: string): Promise<ApiResult<TData>>;
    /**
     * POST REQUEST - Returns typed result with direct data access
     */
    post<TData = unknown>(endpoint: string, data?: unknown, sessionToken?: string): Promise<ApiResult<TData>>;
    /**
     * PUT REQUEST - Returns typed result with direct data access
     */
    put<TData = unknown>(endpoint: string, data?: unknown, sessionToken?: string): Promise<ApiResult<TData>>;
    /**
     * DELETE REQUEST - Returns typed result with direct data access
     */
    delete<TData = unknown>(endpoint: string): Promise<ApiResult<TData>>;
}
export declare const standardizedApi: StandardizedClientApiService;
/**
 * TYPE-SAFE SUCCESS CHECK
 * Use this to check if API call was successful with proper type narrowing
 */
export declare function isApiSuccess<TData>(result: ApiResult<TData>): result is ApiSuccessResult<TData>;
/**
 * TYPE-SAFE PAGED SUCCESS CHECK
 * Use this to check if API call was successful paged response with proper type narrowing
 */
export declare function isApiPagedSuccess<TData>(result: ApiResult<TData>): result is ApiPagedResult<TData>;
/**
 * TYPE-SAFE ERROR CHECK
 * Use this to check if API call failed with proper type narrowing
 */
export declare function isApiError<TData>(result: ApiResult<TData>): result is ApiErrorResult;
/**
 * EXTRACT DATA FROM SUCCESS RESULT
 * Use this to get the data from a successful API call
 * Will throw if result is not successful
 */
export declare function extractApiData<TData>(result: ApiResult<TData>): TData;
/**
 * EXTRACT ITEMS FROM PAGED SUCCESS RESULT
 * Use this to get the items array from a successful paged API call
 * Will throw if result is not successful paged response
 */
export declare function extractApiItems<TData>(result: ApiResult<TData>): TData[];
export {};
