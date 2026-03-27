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
/**
 * Base error class for all Vibe API errors
 */
export declare class VibeError extends Error {
    readonly code: string;
    readonly status: number;
    readonly details?: Record<string, unknown>;
    constructor(message: string, code: string, status: number, details?: Record<string, unknown>);
    toJSON(): {
        name: string;
        message: string;
        code: string;
        status: number;
        details: Record<string, unknown> | undefined;
    };
    static fromResponse(response: {
        success: false;
        error: {
            code: string;
            message: string;
            details?: Record<string, unknown>;
        };
    }, status: number): VibeError;
}
/**
 * Thrown when a requested resource is not found (404)
 */
export declare class VibeNotFoundError extends VibeError {
    constructor(message?: string, code?: string, details?: Record<string, unknown>);
}
/**
 * Thrown when input validation fails (400)
 */
export declare class VibeValidationError extends VibeError {
    readonly fieldErrors?: Record<string, string[]>;
    constructor(message?: string, details?: Record<string, unknown>);
}
/**
 * Thrown when authentication/authorization fails (401/403)
 */
export declare class VibeAuthError extends VibeError {
    constructor(message?: string, code?: string, details?: Record<string, unknown>);
}
/**
 * Thrown when rate limit is exceeded (429)
 */
export declare class VibeRateLimitError extends VibeError {
    readonly retryAfter?: number;
    constructor(message?: string, details?: Record<string, unknown>);
}
/**
 * Thrown when there's a conflict (e.g., duplicate entry) (409)
 */
export declare class VibeConflictError extends VibeError {
    constructor(message?: string, details?: Record<string, unknown>);
}
/**
 * Thrown when the Vibe API is unavailable (503)
 */
export declare class VibeServiceError extends VibeError {
    constructor(message?: string, details?: Record<string, unknown>);
}
