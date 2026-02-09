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
export class VibeError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, unknown>
  ) {
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

  static fromResponse(response: {
    success: false;
    error: { code: string; message: string; details?: Record<string, unknown> };
  }, status: number): VibeError {
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

/**
 * Thrown when a requested resource is not found (404)
 */
export class VibeNotFoundError extends VibeError {
  constructor(
    message: string = 'Resource not found',
    code: string = 'NOT_FOUND',
    details?: Record<string, unknown>
  ) {
    super(message, code, 404, details);
    this.name = 'VibeNotFoundError';
  }
}

/**
 * Thrown when input validation fails (400)
 */
export class VibeValidationError extends VibeError {
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(
    message: string = 'Validation failed',
    details?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'VibeValidationError';

    // Extract field-level errors if present
    if (details?.fieldErrors) {
      this.fieldErrors = details.fieldErrors as Record<string, string[]>;
    }
  }
}

/**
 * Thrown when authentication/authorization fails (401/403)
 */
export class VibeAuthError extends VibeError {
  constructor(
    message: string = 'Authentication required',
    code: string = 'UNAUTHORIZED',
    details?: Record<string, unknown>
  ) {
    super(message, code, 401, details);
    this.name = 'VibeAuthError';
  }
}

/**
 * Thrown when rate limit is exceeded (429)
 */
export class VibeRateLimitError extends VibeError {
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Rate limit exceeded',
    details?: Record<string, unknown>
  ) {
    super(message, 'RATE_LIMITED', 429, details);
    this.name = 'VibeRateLimitError';

    // Extract retry-after if present
    if (details?.retryAfter) {
      this.retryAfter = details.retryAfter as number;
    }
  }
}

/**
 * Thrown when there's a conflict (e.g., duplicate entry) (409)
 */
export class VibeConflictError extends VibeError {
  constructor(
    message: string = 'Resource conflict',
    details?: Record<string, unknown>
  ) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'VibeConflictError';
  }
}

/**
 * Thrown when the Vibe API is unavailable (503)
 */
export class VibeServiceError extends VibeError {
  constructor(
    message: string = 'Vibe service unavailable',
    details?: Record<string, unknown>
  ) {
    super(message, 'SERVICE_UNAVAILABLE', 503, details);
    this.name = 'VibeServiceError';
  }
}
