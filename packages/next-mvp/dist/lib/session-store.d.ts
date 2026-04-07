/**
 * Session Store for `@payez/next-mvp` using ioredis
 *
 * This module provides a Redis-backed session store that is compatible with the
 * `ioredis` client. It handles the creation, retrieval, and deletion of
 * session data, which is the single source of truth for authentication.
 *
 * Includes advanced distributed refresh coordination with version control.
 */
import { SessionData } from '../models/SessionModel';
export type { SessionData } from '../models/SessionModel';
export interface RefreshLockInfo {
    sessionToken: string;
    acquiredAt: number;
    acquiredBy: string;
    lockVersion: number;
}
/**
 * Generates a new session token.
 * @returns A new session token string.
 */
export declare function generateSessionToken(): string;
/**
 * Creates a new session in Redis.
 *
 * @param data The session data to store.
 * @returns The generated session token (redisSessionId).
 */
export declare function createSession(data: SessionData): Promise<string>;
/**
 * Retrieves a session from Redis.
 *
 * @param sessionToken The session token (redisSessionId) to look up.
 * @returns The session data, or null if not found.
 */
export declare function getSession(sessionToken: string): Promise<SessionData | null>;
/**
 * Retrieves a Better Auth session from Redis.
 * Better Auth uses key format: ba:{appSlug}:{token}
 *
 * @param sessionToken The session token to look up.
 * @param appSlug The app slug (defaults to 'idealvibe_online' or extracted from env).
 * @returns The session data, or null if not found.
 */
export declare function getBetterAuthSession(sessionToken: string, appSlug?: string): Promise<SessionData | null>;
/**
 * Refresh session TTL without reading/writing data (sliding window expiry).
 */
export declare function touchSession(token: string): Promise<void>;
/**
 * Retrieves a session along with a version identifier for optimistic locking.
 * @param sessionToken The session token to look up.
 * @returns An object with session and version, or null if not found.
 */
export declare function getSessionWithVersion(sessionToken: string): Promise<{
    session: SessionData;
    version: string;
} | null>;
/**
 * Checks if the access token in a session is still fresh (not expired).
 * @param sessionToken The session token to check.
 * @param currentAccessToken The current access token to compare.
 * @param currentVersion Optional version to check for changes.
 * @returns Object with freshness status and latest token info.
 */
export declare function isAccessTokenFresh(sessionToken: string, currentAccessToken: string, currentVersion?: string): Promise<{
    isFresh: boolean;
    latestAccessToken?: string;
    latestVersion?: string;
    versionChanged: boolean;
}>;
/**
 * Deletes a session from Redis.
 * @param sessionToken The session token to delete.
 */
export declare function deleteSession(sessionToken: string): Promise<void>;
/**
 * Sets a session directly (for testing or migrations).
 * @param sessionToken The session token.
 * @param data The session data.
 */
export declare function setSession(sessionToken: string, data: SessionData): Promise<void>;
/**
 * Updates tokens within an existing session.
 * @param sessionToken The session token to update.
 * @param updates Partial session data to update.
 * @returns The updated session data, or null if the session was not found.
 */
export declare function updateSession(sessionToken: string, updates: Partial<SessionData>): Promise<SessionData | null>;
/**
 * Transitions a session to a MFA-completed state.
 * @param sessionToken The session token to update.
 * @param tokens The new tokens received after MFA completion.
 * @param mfaMethod The MFA method used (email, sms, totp) - required for token refresh.
 * @returns The updated session data.
 */
export declare function transitionTo2FASession(sessionToken: string, tokens: {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
    idpAccessToken?: string;
    idpRefreshToken?: string;
    idpAccessTokenExpires?: number;
    idpRefreshTokenExpires?: number;
}, mfaMethod?: 'email' | 'sms' | 'totp'): Promise<SessionData | null>;
/**
 * Updates IDP tokens and their expiries in an existing session.
 * @param sessionToken The session token to update.
 * @param idpAccessToken The new IDP access token.
 * @param idpRefreshToken The new IDP refresh token.
 * @param idpAccessTokenExpires The access token expiry timestamp.
 * @param idpRefreshTokenExpires The refresh token expiry timestamp (optional).
 * @returns The updated session data.
 */
export declare function updateTokens(sessionToken: string, idpAccessToken: string, idpRefreshToken: string, idpAccessTokenExpires: number, idpRefreshTokenExpires?: number): Promise<SessionData | null>;
/**
 * Marks a session as having completed MFA.
 * @param sessionToken The session token to update.
 * @returns The updated session data.
 */
export declare function mark2FAComplete(sessionToken: string): Promise<SessionData | null>;
/**
 * Checks if MFA is complete for a session.
 * @param sessionToken The session token.
 * @returns True if MFA is complete.
 */
export declare function is2FAComplete(sessionToken: string): Promise<boolean>;
/**
 * Gets IDP tokens from a session.
 * @param sessionToken The session token.
 * @returns The tokens or null if session not found.
 */
export declare function getTokens(sessionToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    idpAccessToken: string;
    idpRefreshToken: string;
} | null>;
/**
 * Refreshes a JWT session (placeholder for compatibility).
 * @param sessionToken The session token.
 * @returns The session data or null.
 */
export declare function refreshJWTSession(sessionToken: string): Promise<SessionData | null>;
/**
 * Clears all sessions (for testing only).
 */
export declare function clearAllSessions(): Promise<void>;
/**
 * Lists all sessions (for testing/debugging only).
 * @returns An empty array (placeholder).
 */
export declare function listAllSessions(): Promise<string[]>;
/**
 * Attempt to acquire a refresh lock for a session
 * Uses Redis SET with NX (Not eXists) for atomic lock acquisition
 */
export declare function acquireRefreshLock(sessionToken: string, requestId: string, maxWaitMs?: number): Promise<{
    acquired: boolean;
    lockInfo?: RefreshLockInfo;
}>;
/**
 * Release a refresh lock
 * Uses Lua script to ensure atomic validation and release
 */
export declare function releaseRefreshLock(sessionToken: string, requestId: string, lockVersion?: number): Promise<boolean>;
/**
 * Check if a refresh lock exists for a session
 */
export declare function checkRefreshLock(sessionToken: string): Promise<RefreshLockInfo | null>;
/**
 * Simple check if a refresh is currently in progress for a session
 */
export declare function isRefreshInProgress(sessionToken: string): Promise<boolean>;
/**
 * Force cleanup of expired or orphaned refresh locks
 */
export declare function cleanupRefreshLocks(): Promise<number>;
