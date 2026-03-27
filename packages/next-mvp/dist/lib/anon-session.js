"use strict";
/**
 * Anonymous Session Store for `@payez/next-mvp`
 *
 * Provides Redis-backed anonymous sessions for tracking user preferences
 * before they log in. When a user logs in, their anonymous session can be
 * merged into their authenticated session.
 *
 * Key features:
 * - Generates a unique visitor ID on first visit
 * - Stores preferences (theme, locale, etc.) in Redis
 * - Tracks usage metrics (resume count for free tier, etc.)
 * - Provides merge functionality when user authenticates
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ANON_COOKIE_NAME = void 0;
exports.generateAnonId = generateAnonId;
exports.createAnonSession = createAnonSession;
exports.getAnonSession = getAnonSession;
exports.getOrCreateAnonSession = getOrCreateAnonSession;
exports.saveAnonSession = saveAnonSession;
exports.updateAnonPreferences = updateAnonPreferences;
exports.updateAnonMetrics = updateAnonMetrics;
exports.incrementAnonMetric = incrementAnonMetric;
exports.deleteAnonSession = deleteAnonSession;
exports.mergeAnonSessionToUser = mergeAnonSessionToUser;
const redis_1 = __importDefault(require("./redis"));
const crypto_1 = require("crypto");
const app_slug_1 = require("./app-slug");
// Use app-slug prefixes for multi-app isolation
const getAnonKey = (id) => `${(0, app_slug_1.getAnonPrefix)()}${id}`;
const ANON_SESSION_TTL = 90 * 24 * 60 * 60; // 90 days in seconds
// Export dynamic cookie name getter for external use
exports.ANON_COOKIE_NAME = (0, app_slug_1.getAnonCookieName)();
/**
 * Generates a new anonymous session ID
 */
function generateAnonId() {
    return (0, crypto_1.randomBytes)(16).toString('hex');
}
// getAnonKey is defined above using app-slug prefix
/**
 * Creates a new anonymous session in Redis
 */
async function createAnonSession(anonId) {
    const id = anonId || generateAnonId();
    const now = Date.now();
    const session = {
        id,
        createdAt: now,
        updatedAt: now,
        preferences: {},
        metrics: {
            firstVisit: now,
            lastVisit: now,
            visitCount: 1,
        },
    };
    const key = getAnonKey(id);
    await redis_1.default.setex(key, ANON_SESSION_TTL, JSON.stringify(session));
    return session;
}
/**
 * Retrieves an anonymous session from Redis
 */
async function getAnonSession(anonId) {
    if (!anonId)
        return null;
    const key = getAnonKey(anonId);
    const json = await redis_1.default.get(key);
    if (!json)
        return null;
    try {
        return JSON.parse(json);
    }
    catch {
        return null;
    }
}
/**
 * Gets or creates an anonymous session
 */
async function getOrCreateAnonSession(anonId) {
    if (anonId) {
        const existing = await getAnonSession(anonId);
        if (existing) {
            // Update last visit
            existing.updatedAt = Date.now();
            existing.metrics.lastVisit = Date.now();
            existing.metrics.visitCount = (existing.metrics.visitCount || 0) + 1;
            await saveAnonSession(existing);
            return existing;
        }
    }
    // Create new session
    return createAnonSession(anonId);
}
/**
 * Saves an anonymous session to Redis
 */
async function saveAnonSession(session) {
    session.updatedAt = Date.now();
    const key = getAnonKey(session.id);
    await redis_1.default.setex(key, ANON_SESSION_TTL, JSON.stringify(session));
}
/**
 * Updates preferences in an anonymous session
 */
async function updateAnonPreferences(anonId, preferences) {
    const session = await getAnonSession(anonId);
    if (!session)
        return null;
    session.preferences = { ...session.preferences, ...preferences };
    await saveAnonSession(session);
    return session;
}
/**
 * Updates metrics in an anonymous session
 */
async function updateAnonMetrics(anonId, metrics) {
    const session = await getAnonSession(anonId);
    if (!session)
        return null;
    session.metrics = { ...session.metrics, ...metrics };
    await saveAnonSession(session);
    return session;
}
/**
 * Increments a numeric metric
 */
async function incrementAnonMetric(anonId, metricName, amount = 1) {
    const session = await getAnonSession(anonId);
    if (!session)
        return 0;
    const currentValue = session.metrics[metricName] || 0;
    const newValue = currentValue + amount;
    session.metrics[metricName] = newValue;
    await saveAnonSession(session);
    return newValue;
}
/**
 * Deletes an anonymous session
 */
async function deleteAnonSession(anonId) {
    if (!anonId)
        return;
    const key = getAnonKey(anonId);
    await redis_1.default.del(key);
}
/**
 * Merges anonymous session data into user profile data
 * Call this when a user logs in to preserve their pre-login preferences
 */
async function mergeAnonSessionToUser(anonId, userId, mergeCallback) {
    const anonSession = await getAnonSession(anonId);
    if (!anonSession)
        return null;
    // If a merge callback is provided, use it to persist data to user profile
    if (mergeCallback) {
        await mergeCallback(anonSession, userId);
    }
    // Optionally delete the anonymous session after merge
    // await deleteAnonSession(anonId);
    return anonSession;
}
// ANON_COOKIE_NAME is already exported at the top of the file
