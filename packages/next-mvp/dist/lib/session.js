"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidSession = isValidSession;
exports.sanitizeSession = sanitizeSession;
/**
 * Strict session validation for client-side guards.
 * A session is considered valid when:
 * - a user object exists with non-empty id and email
 * - an accessToken string exists
 */
function isValidSession(session) {
    if (!session)
        return false;
    const u = session.user;
    const hasUser = !!u && typeof u.id === 'string' && u.id.length > 0 && typeof u.email === 'string' && u.email.length > 0;
    const hasAccessToken = typeof session.accessToken === 'string' && session.accessToken.length > 0;
    return hasUser && hasAccessToken;
}
/**
 * Sanitize session data - returns null if session is invalid
 */
function sanitizeSession(session) {
    if (!isValidSession(session))
        return null;
    return session;
}
