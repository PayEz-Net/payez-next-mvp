/**
 * BASE STANDARDIZED RESPONSE FORMAT
 * This is THE ONLY acceptable response format from our APIs
 */
export interface StandardizedApiResponse<TData = unknown> {
    /** REQUIRED: Operation success status */
    success: true;
    /** REQUIRED: The actual data payload */
    data: TData;
    /** REQUIRED: Human-readable success message */
    message: string;
    /** REQUIRED: Unique operation code for tracking */
    operation_code: string;
    /** Optional: Server timestamp */
    timestamp?: string;
    /** Optional: Request ID for tracing */
    request_id?: string;
}
/**
 * STANDARDIZED ERROR RESPONSE FORMAT
 * This is THE ONLY acceptable error format from our APIs
 */
export interface StandardizedErrorResponse {
    /** REQUIRED: Always false for errors */
    success: false;
    /** REQUIRED: Standard error code */
    error_code: string;
    /** REQUIRED: Human-readable error message */
    message: string;
    /** REQUIRED: Operation that failed */
    operation: string;
    /** Optional: Additional error details - can be any structure from IDP */
    details?: unknown;
    /** Optional: Validation errors */
    validation_errors?: Record<string, string[]>;
    /** Optional: Server timestamp */
    timestamp?: string;
    /** Optional: Request ID for tracing */
    request_id?: string;
}
/**
 * STANDARDIZED PAGINATED RESPONSE FORMAT
 * For endpoints that return paged data
 */
export interface StandardizedPagedResponse<TData = unknown> {
    /** REQUIRED: Always true for success */
    success: true;
    /** REQUIRED: Array of data items */
    data: TData[];
    /** REQUIRED: Human-readable success message */
    message: string;
    /** REQUIRED: Unique operation code */
    operation_code: string;
    /** REQUIRED: Pagination metadata */
    pagination: {
        /** Current page number (1-based) */
        current_page: number;
        /** Total number of pages */
        total_pages: number;
        /** Number of items per page */
        page_size: number;
        /** Total number of items across all pages */
        total_items: number;
        /** True if there are more pages after current */
        has_next_page: boolean;
        /** True if there are pages before current */
        has_previous_page: boolean;
    };
    /** Optional: Server timestamp */
    timestamp?: string;
    /** Optional: Request ID for tracing */
    request_id?: string;
}
/**
 * VALIDATION ERROR RESPONSE FORMAT
 * For input validation failures
 */
export interface StandardizedValidationResponse {
    /** REQUIRED: Always false for validation errors */
    success: false;
    /** REQUIRED: Always 'VALIDATION_ERROR' */
    error_code: 'VALIDATION_ERROR';
    /** REQUIRED: Summary message */
    message: string;
    /** REQUIRED: Operation that failed */
    operation: string;
    /** REQUIRED: Field-specific validation errors */
    payload: {
        /** Field name mapped to array of error messages */
        validation_errors: Record<string, string[]>;
        /** The invalid value that caused the error */
        invalid_value?: unknown;
        /** The field that caused the primary error */
        primary_field?: string;
    };
}
/** ALL POSSIBLE STANDARDIZED RESPONSES */
export type StandardizedResponse<TData = unknown> = StandardizedApiResponse<TData> | StandardizedPagedResponse<TData> | StandardizedErrorResponse | StandardizedValidationResponse;
/**
 * Type guard to check if response is a success response
 * THROWS if response doesn't match standardized format
 */
export declare function isSuccessResponse<TData = unknown>(response: unknown): response is StandardizedApiResponse<TData>;
/**
 * Type guard to check if response is a paged success response
 * THROWS if response doesn't match standardized format
 */
export declare function isPagedResponse<TData = unknown>(response: unknown): response is StandardizedPagedResponse<TData>;
/**
 * Type guard to check if response is an error response
 * THROWS if response doesn't match standardized format
 */
export declare function isErrorResponse(response: unknown): response is StandardizedErrorResponse;
/**
 * Type guard to check if response is a validation error
 * THROWS if response doesn't match standardized format
 */
export declare function isValidationErrorResponse(response: unknown): response is StandardizedValidationResponse;
/**
 * VALIDATES AND NORMALIZES API RESPONSES
 * This function BREAKS THE BUILD if responses don't match our standard
 * NO EXCEPTIONS - ZERO TOLERANCE FOR BAD RESPONSES
 */
export declare function validateStandardizedResponse<TData = unknown>(response: unknown, endpoint?: string): StandardizedResponse<TData>;
/** Extract the data type from a standardized response */
export type ExtractResponseData<T> = T extends StandardizedApiResponse<infer U> ? U : T extends StandardizedPagedResponse<infer U> ? U[] : never;
/** Extract the error code from an error response */
export type ExtractErrorCode<T> = T extends StandardizedErrorResponse ? T['error_code'] : T extends StandardizedValidationResponse ? T['error_code'] : never;
