"use strict";
/**
 * =============================================================================
 * VIBE API ERROR CLASSES
 * =============================================================================
 *
 * Typed error classes for Vibe API operations.
 * These provide specific error handling for different failure scenarios.
 *
 * Usage:
 *   try {
 *     await vibe.users.findUnique({ where: { id: 123 } })
 *   } catch (error) {
 *     if (error instanceof VibeNotFoundError) {
 *       // Handle 404
 *     } else if (error instanceof VibeValidationError) {
 *       // Handle validation errors
 *     }
 *   }
 *
 * =============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VibeServiceError = exports.VibeConflictError = exports.VibeRateLimitError = exports.VibeAuthError = exports.VibeValidationError = exports.VibeNotFoundError = exports.VibeError = void 0;
/**
 * Base error class for all Vibe API errors
 */
class VibeError extends Error {
    code;
    status;
    details;
    constructor(message, code, status, details) {
        super(message);
        this.name = 'VibeError';
        this.code = code;
        this.status = status;
        this.details = details;
        // Maintains proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, VibeError);
        }
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            status: this.status,
            details: this.details,
        };
    }
    static fromResponse(response, status) {
        const { code, message, details } = response.error;
        switch (code) {
            case 'NOT_FOUND':
            case 'DOCUMENT_NOT_FOUND':
            case 'TABLE_NOT_FOUND':
                return new VibeNotFoundError(message, code, details);
            case 'VALIDATION_ERROR':
            case 'INVALID_INPUT':
                return new VibeValidationError(message, details);
            case 'UNAUTHORIZED':
            case 'INVALID_CREDENTIALS':
            case 'INVALID_CLIENT_ID':
                return new VibeAuthError(message, code, details);
            case 'RATE_LIMITED':
                return new VibeRateLimitError(message, details);
            case 'CONFLICT':
            case 'DUPLICATE_ENTRY':
                return new VibeConflictError(message, details);
            default:
                return new VibeError(message, code, status, details);
        }
    }
}
exports.VibeError = VibeError;
/**
 * Thrown when a requested resource is not found (404)
 */
class VibeNotFoundError extends VibeError {
    constructor(message = 'Resource not found', code = 'NOT_FOUND', details) {
        super(message, code, 404, details);
        this.name = 'VibeNotFoundError';
    }
}
exports.VibeNotFoundError = VibeNotFoundError;
/**
 * Thrown when input validation fails (400)
 */
class VibeValidationError extends VibeError {
    fieldErrors;
    constructor(message = 'Validation failed', details) {
        super(message, 'VALIDATION_ERROR', 400, details);
        this.name = 'VibeValidationError';
        // Extract field-level errors if present
        if (details?.fieldErrors) {
            this.fieldErrors = details.fieldErrors;
        }
    }
}
exports.VibeValidationError = VibeValidationError;
/**
 * Thrown when authentication/authorization fails (401/403)
 */
class VibeAuthError extends VibeError {
    constructor(message = 'Authentication required', code = 'UNAUTHORIZED', details) {
        super(message, code, 401, details);
        this.name = 'VibeAuthError';
    }
}
exports.VibeAuthError = VibeAuthError;
/**
 * Thrown when rate limit is exceeded (429)
 */
class VibeRateLimitError extends VibeError {
    retryAfter;
    constructor(message = 'Rate limit exceeded', details) {
        super(message, 'RATE_LIMITED', 429, details);
        this.name = 'VibeRateLimitError';
        // Extract retry-after if present
        if (details?.retryAfter) {
            this.retryAfter = details.retryAfter;
        }
    }
}
exports.VibeRateLimitError = VibeRateLimitError;
/**
 * Thrown when there's a conflict (e.g., duplicate entry) (409)
 */
class VibeConflictError extends VibeError {
    constructor(message = 'Resource conflict', details) {
        super(message, 'CONFLICT', 409, details);
        this.name = 'VibeConflictError';
    }
}
exports.VibeConflictError = VibeConflictError;
/**
 * Thrown when the Vibe API is unavailable (503)
 */
class VibeServiceError extends VibeError {
    constructor(message = 'Vibe service unavailable', details) {
        super(message, 'SERVICE_UNAVAILABLE', 503, details);
        this.name = 'VibeServiceError';
    }
}
exports.VibeServiceError = VibeServiceError;
