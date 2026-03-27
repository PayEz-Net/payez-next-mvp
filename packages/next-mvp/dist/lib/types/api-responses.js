"use strict";
// ========================================================================================
// BULLETPROOF API RESPONSE TYPES - ENFORCES STANDARDIZED FORMAT
// ========================================================================================
// These types ENFORCE the standardized response format from our Identity API
// If the API doesn't return this exact structure, TypeScript will break the build
// NO MORE data.data.data.data NONSENSE - EVER!
// ========================================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSuccessResponse = isSuccessResponse;
exports.isPagedResponse = isPagedResponse;
exports.isErrorResponse = isErrorResponse;
exports.isValidationErrorResponse = isValidationErrorResponse;
exports.validateStandardizedResponse = validateStandardizedResponse;
// ========================================================================================
// TYPE GUARDS FOR RUNTIME VALIDATION
// ========================================================================================
/**
 * Type guard to check if response is a success response
 * THROWS if response doesn't match standardized format
 */
function isSuccessResponse(response) {
    if (!response || typeof response !== 'object') {
        throw new Error('INVALID_API_RESPONSE: Response is not an object');
    }
    const r = response;
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
function isPagedResponse(response) {
    if (!isSuccessResponse(response)) {
        return false;
    }
    const r = response;
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
function isErrorResponse(response) {
    if (!response || typeof response !== 'object') {
        throw new Error('INVALID_API_RESPONSE: Response is not an object');
    }
    const r = response;
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
function isValidationErrorResponse(response) {
    if (!isErrorResponse(response)) {
        return false;
    }
    const r = response;
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
function validateStandardizedResponse(response, endpoint) {
    const context = endpoint ? ` for endpoint: ${endpoint}` : '';
    try {
        // First, basic object validation
        if (!response || typeof response !== 'object') {
            throw new Error(`CRITICAL_API_ERROR: Invalid response object${context}`);
        }
        const r = response;
        // Check for success field (REQUIRED)
        if (!('success' in r) || typeof r.success !== 'boolean') {
            throw new Error(`CRITICAL_API_ERROR: Response missing required boolean "success" field${context}`);
        }
        // Route to appropriate validator based on success status
        if (r.success === true) {
            // Check if it's a paged response
            if ('pagination' in r) {
                if (isPagedResponse(response)) {
                    return response;
                }
            }
            else {
                if (isSuccessResponse(response)) {
                    return response;
                }
            }
        }
        else if (r.success === false) {
            // Check if it's a validation error
            if (r.error_code === 'VALIDATION_ERROR') {
                if (isValidationErrorResponse(response)) {
                    return response;
                }
            }
            else {
                if (isErrorResponse(response)) {
                    return response;
                }
            }
        }
        // If we reach here, the response format is invalid
        throw new Error(`CRITICAL_API_ERROR: Response format validation failed${context}. Response: ${JSON.stringify(response, null, 2)}`);
    }
    catch (error) {
        // Re-throw validation errors with context
        const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
        throw new Error(`${errorMessage}${context}`);
    }
}
