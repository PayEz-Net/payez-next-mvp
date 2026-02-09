/**
 * =============================================================================
 * VIBE LOGIN SESSIONS
 * =============================================================================
 *
 * Server-side utilities for managing login sessions in Vibe.
 * Tracks user logins with location, device info, and allows session control.
 *
 * This module uses the MVP's vibe client with proper auth token handling
 * for member-to-vibe calls.
 *
 * USAGE:
 * ------
 * import { createLoginSession, getUserSessions, revokeSession } from '@payez/next-mvp/vibe/sessions';
 *
 * // On login (requires user's access token):
 * await createLoginSession({
 *   idpUserId: 22,
 *   email: 'user@example.com',
 *   ipAddress: '1.2.3.4',
 *   userAgent: '...',
 *   location: { city: 'NYC', ... },
 *   accessToken: userAccessToken,  // Required for member-to-vibe
 * });
 *
 * // Admin: revoke a session
 * await revokeSession(sessionId, 'admin@example.com', accessToken, 'Suspicious activity');
 *
 * =============================================================================
 */
import type { IVibeLoginSession, SessionStatus } from './types';
import type { LocationInfo } from '../lib/geolocation';
import type { DeviceInfo } from '../lib/user-agent-parser';
export interface CreateSessionInput {
    /** IDP user ID */
    idpUserId: number;
    /** User email */
    email: string;
    /** User's display name */
    name?: string;
    /** Client IP address */
    ipAddress: string;
    /** User agent string */
    userAgent: string;
    /** Location info from geolocation lookup */
    location?: LocationInfo | null;
    /** Parsed device info */
    device?: DeviceInfo;
    /** OAuth provider used for login */
    oauthProvider?: string;
    /** Hashed session token for lookup */
    sessionTokenHash?: string;
    /**
     * User's access token - REQUIRED for member-to-vibe calls.
     * Without this, the request will fail with 401.
     */
    accessToken: string;
}
export interface SessionQueryOptions {
    status?: SessionStatus;
    page?: number;
    pageSize?: number;
}
/**
 * Create a new login session record.
 * Called when a user successfully logs in.
 *
 * @param input - Session creation parameters including accessToken
 * @returns The created session, or null on failure
 */
export declare function createLoginSession(input: CreateSessionInput): Promise<IVibeLoginSession | null>;
/**
 * Get all sessions for a specific user.
 *
 * @param idpUserId - The user's IDP ID
 * @param accessToken - User's access token for auth
 * @returns Array of sessions
 */
export declare function getUserSessions(idpUserId: number, accessToken: string): Promise<IVibeLoginSession[]>;
/**
 * Get all sessions (admin only).
 * Returns sessions from all users, sorted by most recent first.
 *
 * @param options - Query options
 * @param accessToken - Admin's access token
 * @returns Array of sessions with total count
 */
export declare function getAllSessions(options: SessionQueryOptions | undefined, accessToken: string): Promise<{
    sessions: IVibeLoginSession[];
    total: number;
}>;
/**
 * Get a single session by ID.
 *
 * @param sessionId - The session document ID
 * @param accessToken - Access token for auth
 */
export declare function getSessionById(sessionId: number, accessToken: string): Promise<IVibeLoginSession | null>;
/**
 * Revoke a specific session.
 * The user will be logged out on their next request.
 *
 * @param sessionId - The session document ID
 * @param adminEmail - Email of the admin performing the revocation
 * @param accessToken - Admin's access token
 * @param reason - Optional reason for revocation
 * @returns The updated session, or null on failure
 */
export declare function revokeSession(sessionId: number, adminEmail: string, accessToken: string, reason?: string): Promise<IVibeLoginSession | null>;
/**
 * Revoke all sessions for a specific user.
 * Useful when an account is compromised.
 *
 * @param idpUserId - The user's IDP ID
 * @param adminEmail - Email of the admin performing the revocation
 * @param accessToken - Admin's access token
 * @param reason - Optional reason for revocation
 * @returns Number of sessions revoked
 */
export declare function revokeAllUserSessions(idpUserId: number, adminEmail: string, accessToken: string, reason?: string): Promise<number>;
/**
 * Update the last_activity timestamp for a session.
 * Call this periodically during user activity.
 *
 * @param sessionId - The session document ID
 * @param accessToken - Access token for auth
 * @returns true if updated successfully
 */
export declare function updateSessionActivity(sessionId: number, accessToken: string): Promise<boolean>;
/**
 * Check if a session is still valid (not revoked/expired).
 * Use this in middleware to enforce session revocation.
 *
 * @param sessionId - The session document ID
 * @param accessToken - Access token for auth
 * @returns true if session is active and not expired
 */
export declare function isSessionValid(sessionId: number, accessToken: string): Promise<boolean>;
/**
 * Check if a user has any revoked sessions that need enforcement.
 * Returns the most recently revoked session if found.
 *
 * @param idpUserId - The user's IDP ID
 * @param accessToken - Access token for auth
 * @param sessionTokenHash - Optional token hash to check specific session
 * @returns Revoked session info if enforcement needed, null otherwise
 */
export declare function checkSessionRevocation(idpUserId: number, accessToken: string, sessionTokenHash?: string): Promise<IVibeLoginSession | null>;
/**
 * Get session statistics for admin dashboard.
 *
 * @param accessToken - Admin's access token
 */
export declare function getSessionStats(accessToken: string): Promise<{
    totalActive: number;
    totalRevoked: number;
    uniqueUsers: number;
    byCountry: Record<string, number>;
    byDevice: Record<string, number>;
    recentLogins: number;
}>;
