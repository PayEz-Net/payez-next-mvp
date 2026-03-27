"use strict";
// Utility to convert unknown errors or standardized API JSON into a friendly string
// Keeps UI clean by avoiding raw JSON rendering.
Object.defineProperty(exports, "__esModule", { value: true });
exports.toFriendlyErrorMessage = toFriendlyErrorMessage;
function toFriendlyErrorMessage(err) {
    try {
        // If it's already a string, try to parse JSON first
        if (typeof err === 'string') {
            const trimmed = err.trim();
            if (looksLikeJson(trimmed)) {
                const parsed = JSON.parse(trimmed);
                return fromStructured(parsed);
            }
            return normalizeMessage(trimmed);
        }
        // If it's an Error
        if (err instanceof Error) {
            return normalizeMessage(err.message);
        }
        // Try to handle plain objects
        if (err && typeof err === 'object') {
            return fromStructured(err);
        }
        // Fallback
        return 'Something went wrong. Please try again.';
    }
    catch {
        return 'Something went wrong. Please try again.';
    }
}
function looksLikeJson(input) {
    return (input.startsWith('{') && input.endsWith('}')) || (input.startsWith('[') && input.endsWith(']'));
}
function fromStructured(obj) {
    // StandardizedResponse shapes we use across the app
    const success = get(obj, ['success']);
    const message = get(obj, ['message']) || get(obj, ['error', 'message']);
    const code = get(obj, ['error', 'code']) || get(obj, ['error_code']);
    const status = get(obj, ['status']) || get(obj, ['error', 'status']);
    // Prefer the message if present
    if (message) {
        return normalizeMessage(message, code, status);
    }
    // If we have a code or status, map it
    if (code || status) {
        return normalizeMessage(undefined, code, status);
    }
    // As a last resort, do not dump raw JSON — provide generic fallback
    return 'We could not complete your request. Please try again.';
}
function normalizeMessage(message, code, status) {
    const msg = (message || '').toLowerCase();
    const c = (code || '').toUpperCase();
    // Map well-known codes first
    switch (c) {
        case 'TIMEOUT':
        case 'REQUEST_TIMEOUT':
            return 'Request timed out. Please try again.';
        case 'TOO_MANY_REQUESTS':
        case 'RATE_LIMIT_EXCEEDED':
            return 'Too many attempts. Please wait a moment and try again.';
        case 'SERVICE_UNAVAILABLE':
            return 'Service temporarily unavailable. Please try again shortly.';
        case 'UNAUTHORIZED':
        case 'INVALID_SESSION':
        case 'TOKEN_EXPIRED':
            return 'Your session has expired. Please log in again.';
        case 'VALIDATION_ERROR':
            return 'Please check the code and try again.';
    }
    // Map by HTTP-ish status if provided
    if (status === 408)
        return 'Request timed out. Please try again.';
    if (status === 429)
        return 'Too many attempts. Please wait a moment and try again.';
    if (status === 401)
        return 'Your session has expired. Please log in again.';
    if (status === 503)
        return 'Service temporarily unavailable. Please try again shortly.';
    // Heuristic by message content
    if (msg.includes('timeout'))
        return 'Request timed out. Please try again.';
    if (msg.includes('too many request') || msg.includes('rate limit'))
        return 'Too many attempts. Please wait a moment and try again.';
    if (msg.includes('unauthorized') || msg.includes('authentication failed') || msg.includes('session expired'))
        return 'Your session has expired. Please log in again.';
    if (msg.includes('network') || msg.includes('failed to fetch'))
        return 'Network error. Check your connection and try again.';
    // Default to the original message if we have one
    if (message && message.trim())
        return message;
    return 'We could not complete your request. Please try again.';
}
function get(obj, path) {
    let cur = obj;
    for (const p of path) {
        if (cur == null || typeof cur !== 'object' || !(p in cur))
            return undefined;
        cur = cur[p];
    }
    return cur;
}
