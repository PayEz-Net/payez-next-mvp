"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPayEzRateLimitResponse = createPayEzRateLimitResponse;
function createPayEzRateLimitResponse(retryAfterSeconds, remainingAttempts = 0) {
    return { success: false, message: 'Too many failed attempts', user_info: null, errors: [{ code: 'RateLimitExceeded', message: 'Too many failed authentication attempts', resolution: `Please try again in ${retryAfterSeconds} seconds`, remainingAttempts }] };
}
