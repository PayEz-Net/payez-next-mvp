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

import redis from './redis';
import { randomBytes } from 'crypto';
import { getAnonPrefix, getAnonCookieName } from './app-slug';

// Use app-slug prefixes for multi-app isolation
const getAnonKey = (id: string) => `${getAnonPrefix()}${id}`;

const ANON_SESSION_TTL = 90 * 24 * 60 * 60; // 90 days in seconds

// Export dynamic cookie name getter for external use
export const ANON_COOKIE_NAME = getAnonCookieName();

export interface AnonSessionPreferences {
  theme?: string;
  locale?: string;
  [key: string]: any;
}

export interface AnonSessionMetrics {
  resumeGenerationCount?: number;
  firstVisit?: number;
  lastVisit?: number;
  visitCount?: number;
  [key: string]: any;
}

export interface AnonSessionData {
  id: string;
  createdAt: number;
  updatedAt: number;
  preferences: AnonSessionPreferences;
  metrics: AnonSessionMetrics;
}

/**
 * Generates a new anonymous session ID
 */
export function generateAnonId(): string {
  return randomBytes(16).toString('hex');
}

// getAnonKey is defined above using app-slug prefix

/**
 * Creates a new anonymous session in Redis
 */
export async function createAnonSession(anonId?: string): Promise<AnonSessionData> {
  const id = anonId || generateAnonId();
  const now = Date.now();

  const session: AnonSessionData = {
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
  await redis.setex(key, ANON_SESSION_TTL, JSON.stringify(session));

  return session;
}

/**
 * Retrieves an anonymous session from Redis
 */
export async function getAnonSession(anonId: string): Promise<AnonSessionData | null> {
  if (!anonId) return null;

  const key = getAnonKey(anonId);
  const json = await redis.get(key);

  if (!json) return null;

  try {
    return JSON.parse(json) as AnonSessionData;
  } catch {
    return null;
  }
}

/**
 * Gets or creates an anonymous session
 */
export async function getOrCreateAnonSession(anonId?: string): Promise<AnonSessionData> {
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
export async function saveAnonSession(session: AnonSessionData): Promise<void> {
  session.updatedAt = Date.now();
  const key = getAnonKey(session.id);
  await redis.setex(key, ANON_SESSION_TTL, JSON.stringify(session));
}

/**
 * Updates preferences in an anonymous session
 */
export async function updateAnonPreferences(
  anonId: string,
  preferences: Partial<AnonSessionPreferences>
): Promise<AnonSessionData | null> {
  const session = await getAnonSession(anonId);
  if (!session) return null;

  session.preferences = { ...session.preferences, ...preferences };
  await saveAnonSession(session);

  return session;
}

/**
 * Updates metrics in an anonymous session
 */
export async function updateAnonMetrics(
  anonId: string,
  metrics: Partial<AnonSessionMetrics>
): Promise<AnonSessionData | null> {
  const session = await getAnonSession(anonId);
  if (!session) return null;

  session.metrics = { ...session.metrics, ...metrics };
  await saveAnonSession(session);

  return session;
}

/**
 * Increments a numeric metric
 */
export async function incrementAnonMetric(
  anonId: string,
  metricName: string,
  amount: number = 1
): Promise<number> {
  const session = await getAnonSession(anonId);
  if (!session) return 0;

  const currentValue = (session.metrics[metricName] as number) || 0;
  const newValue = currentValue + amount;
  session.metrics[metricName] = newValue;
  await saveAnonSession(session);

  return newValue;
}

/**
 * Deletes an anonymous session
 */
export async function deleteAnonSession(anonId: string): Promise<void> {
  if (!anonId) return;
  const key = getAnonKey(anonId);
  await redis.del(key);
}

/**
 * Merges anonymous session data into user profile data
 * Call this when a user logs in to preserve their pre-login preferences
 */
export async function mergeAnonSessionToUser(
  anonId: string,
  userId: string,
  mergeCallback?: (anonData: AnonSessionData, userId: string) => Promise<void>
): Promise<AnonSessionData | null> {
  const anonSession = await getAnonSession(anonId);
  if (!anonSession) return null;

  // If a merge callback is provided, use it to persist data to user profile
  if (mergeCallback) {
    await mergeCallback(anonSession, userId);
  }

  // Optionally delete the anonymous session after merge
  // await deleteAnonSession(anonId);

  return anonSession;
}

// ANON_COOKIE_NAME is already exported at the top of the file
