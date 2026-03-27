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
export declare const ANON_COOKIE_NAME: string;
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
export declare function generateAnonId(): string;
/**
 * Creates a new anonymous session in Redis
 */
export declare function createAnonSession(anonId?: string): Promise<AnonSessionData>;
/**
 * Retrieves an anonymous session from Redis
 */
export declare function getAnonSession(anonId: string): Promise<AnonSessionData | null>;
/**
 * Gets or creates an anonymous session
 */
export declare function getOrCreateAnonSession(anonId?: string): Promise<AnonSessionData>;
/**
 * Saves an anonymous session to Redis
 */
export declare function saveAnonSession(session: AnonSessionData): Promise<void>;
/**
 * Updates preferences in an anonymous session
 */
export declare function updateAnonPreferences(anonId: string, preferences: Partial<AnonSessionPreferences>): Promise<AnonSessionData | null>;
/**
 * Updates metrics in an anonymous session
 */
export declare function updateAnonMetrics(anonId: string, metrics: Partial<AnonSessionMetrics>): Promise<AnonSessionData | null>;
/**
 * Increments a numeric metric
 */
export declare function incrementAnonMetric(anonId: string, metricName: string, amount?: number): Promise<number>;
/**
 * Deletes an anonymous session
 */
export declare function deleteAnonSession(anonId: string): Promise<void>;
/**
 * Merges anonymous session data into user profile data
 * Call this when a user logs in to preserve their pre-login preferences
 */
export declare function mergeAnonSessionToUser(anonId: string, userId: string, mergeCallback?: (anonData: AnonSessionData, userId: string) => Promise<void>): Promise<AnonSessionData | null>;
