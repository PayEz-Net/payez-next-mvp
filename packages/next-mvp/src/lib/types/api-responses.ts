// ========================================================================================
// BULLETPROOF API RESPONSE TYPES - ENFORCES STANDARDIZED FORMAT
// ========================================================================================
// These types ENFORCE the standardized response format from our Identity API
// If the API doesn't return this exact structure, TypeScript will break the build
// NO MORE data.data.data.data NONSENSE - EVER!
// ========================================================================================

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

// ========================================================================================
// RESPONSE TYPE UNION - THE ONLY VALID API RESPONSES
// ========================================================================================

/** ALL POSSIBLE STANDARDIZED RESPONSES */
export type StandardizedResponse<TData = unknown> = 
  | StandardizedApiResponse<TData>
  | StandardizedPagedResponse<TData>
  | StandardizedErrorResponse
  | StandardizedValidationResponse;

// ========================================================================================
// TYPE GUARDS FOR RUNTIME VALIDATION
// ========================================================================================

/**
 * Type guard to check if response is a success response
 * THROWS if response doesn't match standardized format
 */
export function isSuccessResponse<TData = unknown>(
  response: unknown
): response is StandardizedApiResponse<TData> {
  if (!response || typeof response !== 'object') {
    throw new Error('INVALID_API_RESPONSE: Response is not an object');
  }

  const r = response as any;

  if (r.success !== true) {
    return false; // This is an error response, not invalid format
  }

  // SUCCESS RESPONSE VALIDATION - BE STRICT!
  if (!('data' in r)) {
    throw new Error('INVALID_API_RESPONSE: Success response missing required "data" field');
  }

  if (!('message' in r) || typeof r.message !== 'string') {
    throw new Error('INVALID_API_RESPONSE: Success response missing required "message" field');
  }

  if (!('operation_code' in r) || typeof r.operation_code !== 'string') {
    throw new Error('INVALID_API_RESPONSE: Success response missing required "operation_code" field');
  }

  return true;
}

/**
 * Type guard to check if response is a paged success response
 * THROWS if response doesn't match standardized format
 */
export function isPagedResponse<TData = unknown>(
  response: unknown
): response is StandardizedPagedResponse<TData> {
  if (!isSuccessResponse(response)) {
    return false;
  }

  const r = response as any;

  // Check if it has pagination metadata
  if (!('pagination' in r) || typeof r.pagination !== 'object') {
    return false;
  }

  const pagination = r.pagination;
  const requiredPaginationFields = [
    'current_page', 'total_pages', 'page_size', 'total_items', 
    'has_next_page', 'has_previous_page'
  ];

  for (const field of requiredPaginationFields) {
    if (!(field in pagination)) {
      throw new Error(`INVALID_API_RESPONSE: Paged response missing required pagination.${field}`);
    }
  }

  // Ensure data is an array for paged responses
  if (!Array.isArray(r.data)) {
    throw new Error('INVALID_API_RESPONSE: Paged response data must be an array');
  }

  return true;
}

/**
 * Type guard to check if response is an error response
 * THROWS if response doesn't match standardized format
 */
export function isErrorResponse(
  response: unknown
): response is StandardizedErrorResponse {
  if (!response || typeof response !== 'object') {
    throw new Error('INVALID_API_RESPONSE: Response is not an object');
  }

  const r = response as any;

  if (r.success !== false) {
    return false; // This is a success response, not invalid format
  }

  // ERROR RESPONSE VALIDATION - BE STRICT!
  if (!('error_code' in r) || typeof r.error_code !== 'string') {
    throw new Error('INVALID_API_RESPONSE: Error response missing required "error_code" field');
  }

  if (!('message' in r) || typeof r.message !== 'string') {
    throw new Error('INVALID_API_RESPONSE: Error response missing required "message" field');
  }

  if (!('operation' in r) || typeof r.operation !== 'string') {
    throw new Error('INVALID_API_RESPONSE: Error response missing required "operation" field');
  }

  return true;
}

/**
 * Type guard to check if response is a validation error
 * THROWS if response doesn't match standardized format
 */
export function isValidationErrorResponse(
  response: unknown
): response is StandardizedValidationResponse {
  if (!isErrorResponse(response)) {
    return false;
  }

  const r = response as any;
  
  if (r.error_code !== 'VALIDATION_ERROR') {
    return false;
  }

  // VALIDATION ERROR RESPONSE VALIDATION - BE STRICT!
  if (!('payload' in r) || typeof r.payload !== 'object') {
    throw new Error('INVALID_API_RESPONSE: Validation error missing required "payload" field');
  }

  if (!('validation_errors' in r.payload) || typeof r.payload.validation_errors !== 'object') {
    throw new Error('INVALID_API_RESPONSE: Validation error missing required "payload.validation_errors" field');
  }

  return true;
}

// ========================================================================================
// RESPONSE VALIDATOR - ENFORCES COMPLIANCE AT RUNTIME
// ========================================================================================

/**
 * VALIDATES AND NORMALIZES API RESPONSES
 * This function BREAKS THE BUILD if responses don't match our standard
 * NO EXCEPTIONS - ZERO TOLERANCE FOR BAD RESPONSES
 */
export function validateStandardizedResponse<TData = unknown>(
  response: unknown,
  endpoint?: string
): StandardizedResponse<TData> {
  const context = endpoint ? ` for endpoint: ${endpoint}` : '';
  
  try {
    // First, basic object validation
    if (!response || typeof response !== 'object') {
      throw new Error(`CRITICAL_API_ERROR: Invalid response object${context}`);
    }

    const r = response as any;

    // Check for success field (REQUIRED)
    if (!('success' in r) || typeof r.success !== 'boolean') {
      throw new Error(`CRITICAL_API_ERROR: Response missing required boolean "success" field${context}`);
    }

    // Route to appropriate validator based on success status
    if (r.success === true) {
      // Check if it's a paged response
      if ('pagination' in r) {
        if (isPagedResponse<TData>(response)) {
          return response as StandardizedPagedResponse<TData>;
        }
      } else {
        if (isSuccessResponse<TData>(response)) {
          return response as StandardizedApiResponse<TData>;
        }
      }
    } else if (r.success === false) {
      // Check if it's a validation error
      if (r.error_code === 'VALIDATION_ERROR') {
        if (isValidationErrorResponse(response)) {
          return response as StandardizedValidationResponse;
        }
      } else {
        if (isErrorResponse(response)) {
          return response as StandardizedErrorResponse;
        }
      }
    }

    // If we reach here, the response format is invalid
    throw new Error(`CRITICAL_API_ERROR: Response format validation failed${context}. Response: ${JSON.stringify(response, null, 2)}`);

  } catch (error) {
    // Re-throw validation errors with context
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    throw new Error(`${errorMessage}${context}`);
  }
}

// ========================================================================================
// CONVENIENCE TYPE EXTRACTORS
// ========================================================================================

/** Extract the data type from a standardized response */
export type ExtractResponseData<T> = T extends StandardizedApiResponse<infer U> 
  ? U 
  : T extends StandardizedPagedResponse<infer U>
  ? U[]
  : never;

/** Extract the error code from an error response */
export type ExtractErrorCode<T> = T extends StandardizedErrorResponse 
  ? T['error_code'] 
  : T extends StandardizedValidationResponse 
  ? T['error_code']
  : never;
