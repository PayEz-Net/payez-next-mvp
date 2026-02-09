"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseBuilder = exports.ApiErrorMessages = exports.ApiErrorCode = void 0;
var ApiErrorCode;
(function (ApiErrorCode) {
    ApiErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ApiErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ApiErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ApiErrorCode["INVALID_TOKEN"] = "INVALID_TOKEN";
    ApiErrorCode["INVALID_SESSION"] = "INVALID_SESSION";
    ApiErrorCode["INVALID_2FA_TOKEN"] = "INVALID_2FA_TOKEN";
    ApiErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    ApiErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ApiErrorCode["TOO_MANY_REQUESTS"] = "TOO_MANY_REQUESTS";
    ApiErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ApiErrorCode["INVALID_REQUEST"] = "INVALID_REQUEST";
    ApiErrorCode["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
    ApiErrorCode["INVALID_FORMAT"] = "INVALID_FORMAT";
    ApiErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ApiErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ApiErrorCode["RESOURCE_CONFLICT"] = "RESOURCE_CONFLICT";
    ApiErrorCode["CONFLICT"] = "CONFLICT";
    ApiErrorCode["BUSINESS_RULE_VIOLATION"] = "BUSINESS_RULE_VIOLATION";
    ApiErrorCode["NOT_IMPLEMENTED"] = "NOT_IMPLEMENTED";
    ApiErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ApiErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ApiErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ApiErrorCode["TIMEOUT"] = "TIMEOUT";
    ApiErrorCode["CIRCUIT_BREAKER_OPEN"] = "CIRCUIT_BREAKER_OPEN";
    ApiErrorCode["UPSTREAM_SERVICE_ERROR"] = "UPSTREAM_SERVICE_ERROR";
    ApiErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    ApiErrorCode["CONNECTION_ERROR"] = "CONNECTION_ERROR";
    ApiErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(ApiErrorCode || (exports.ApiErrorCode = ApiErrorCode = {}));
exports.ApiErrorMessages = { [ApiErrorCode.UNAUTHORIZED]: 'Authentication required', [ApiErrorCode.FORBIDDEN]: 'Access denied', [ApiErrorCode.TOKEN_EXPIRED]: 'Authentication token has expired', [ApiErrorCode.INVALID_TOKEN]: 'Invalid authentication token', [ApiErrorCode.INVALID_SESSION]: 'Invalid session - please log in again', [ApiErrorCode.INVALID_2FA_TOKEN]: 'Invalid or expired 2FA verification token', [ApiErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions for this resource', [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded', [ApiErrorCode.TOO_MANY_REQUESTS]: 'Too many requests', [ApiErrorCode.VALIDATION_ERROR]: 'Request validation failed', [ApiErrorCode.INVALID_REQUEST]: 'Invalid request format', [ApiErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing', [ApiErrorCode.INVALID_FORMAT]: 'Invalid data format', [ApiErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found', [ApiErrorCode.NOT_FOUND]: 'Not found', [ApiErrorCode.RESOURCE_CONFLICT]: 'Resource conflict', [ApiErrorCode.CONFLICT]: 'Conflict', [ApiErrorCode.BUSINESS_RULE_VIOLATION]: 'Business rule violation', [ApiErrorCode.NOT_IMPLEMENTED]: 'Feature not yet implemented', [ApiErrorCode.INTERNAL_ERROR]: 'Internal error occurred', [ApiErrorCode.INTERNAL_SERVER_ERROR]: 'Internal server error', [ApiErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable', [ApiErrorCode.TIMEOUT]: 'Request timeout', [ApiErrorCode.CIRCUIT_BREAKER_OPEN]: 'Service circuit breaker is open', [ApiErrorCode.UPSTREAM_SERVICE_ERROR]: 'Upstream service error', [ApiErrorCode.NETWORK_ERROR]: 'Network error', [ApiErrorCode.CONNECTION_ERROR]: 'Connection error', [ApiErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred' };
class ApiResponseBuilder {
    context;
    config;
    constructor(context, config = {}) { this.context = context; this.config = config; }
    success(data, meta) { return { success: true, data, message: meta?.operation ? `${meta.operation.replace(/-/g, ' ')} completed successfully` : 'Operation completed successfully', operation_code: meta?.operation || 'unknown-operation', meta: { version: '1.0', responseTime: Date.now() - this.context.startTime, ...meta }, timestamp: new Date().toISOString(), requestId: this.context.requestId }; }
    error(code, message, details, field) { const errorMessage = message || exports.ApiErrorMessages[code]; const enhancedDetails = { ...details, ...(this.context.endpoint && { endpoint: this.context.endpoint }), ...(this.context.method && { method: this.context.method }), timestamp: new Date().toISOString() }; return { success: false, error: { code, message: errorMessage, details: enhancedDetails, field, resolution: this.getResolution(code), supportContact: process.env.SUPPORT_CONTACT }, meta: { version: '1.0', responseTime: Date.now() - this.context.startTime }, timestamp: new Date().toISOString(), requestId: this.context.requestId }; }
    getResolution(code) { const resolutions = { [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 'Please try again later', [ApiErrorCode.TOKEN_EXPIRED]: 'Please refresh your session', [ApiErrorCode.UNAUTHORIZED]: 'Please log in again', [ApiErrorCode.SERVICE_UNAVAILABLE]: 'Please try again in a few minutes', [ApiErrorCode.CIRCUIT_BREAKER_OPEN]: 'Service is temporarily unavailable. Please try again later.' }; return resolutions[code]; }
}
exports.ApiResponseBuilder = ApiResponseBuilder;
