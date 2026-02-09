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

import crypto from 'crypto';
import type { IVibeLoginSession, SessionStatus } from './types';
import type { LocationInfo } from '../lib/geolocation';
import type { DeviceInfo } from '../lib/user-agent-parser';

// -----------------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------------

// Sessions expire after 30 days
const SESSION_EXPIRY_DAYS = 30;

// Table name in vibe_app collection
const TABLE = 'login_sessions';
const COLLECTION = 'vibe_app';

// Environment variables
const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
};

/**
 * Generate HMAC-SHA256 signature for proxy authentication
 */
function generateHmacSignature(
  signingKey: string,
  timestamp: number,
  method: string,
  endpoint: string
): string {
  const stringToSign = `${timestamp}|${method}|${endpoint}`;
  return crypto
    .createHmac('sha256', Buffer.from(signingKey, 'base64'))
    .update(stringToSign)
    .digest('base64');
}

/**
 * Make a request through the IDP Vibe proxy
 */
async function vibeProxyRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  accessToken: string,
  body?: unknown
): Promise<T | null> {
  const idpUrl = getEnv('IDP_URL');
  const clientId = getEnv('VIBE_CLIENT_ID');
  const signingKey = getEnv('VIBE_HMAC_KEY');

  if (!idpUrl || !clientId || !signingKey) {
    console.error('[vibe-sessions] Missing env vars: IDP_URL, VIBE_CLIENT_ID, or VIBE_HMAC_KEY');
    return null;
  }

  const proxyUrl = `${idpUrl}/api/vibe/proxy`;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateHmacSignature(signingKey, timestamp, method, endpoint);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
    'X-Vibe-Client-Id': clientId,
    'X-Vibe-Timestamp': String(timestamp),
    'X-Vibe-Signature': signature,
  };

  try {
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        endpoint,
        method,
        data: body ?? null,
      }),
    });

    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[vibe-sessions] Proxy error ${response.status}:`, errorText);
      return null;
    }

    const data = await response.json();
    // Unwrap IDP envelope if present
    return (data?.data ?? data) as T;
  } catch (error) {
    console.error('[vibe-sessions] Proxy request failed:', error);
    return null;
  }
}

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// CREATE SESSION
// -----------------------------------------------------------------------------

/**
 * Create a new login session record.
 * Called when a user successfully logs in.
 *
 * @param input - Session creation parameters including accessToken
 * @returns The created session, or null on failure
 */
export async function createLoginSession(
  input: CreateSessionInput
): Promise<IVibeLoginSession | null> {
  if (!input.accessToken) {
    console.error('[vibe-sessions] accessToken is required for createLoginSession');
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const sessionData = {
    idp_user_id: input.idpUserId,
    email: input.email,
    name: input.name || null,

    // Location
    ip_address: input.ipAddress,
    city: input.location?.city || null,
    region: input.location?.region || null,
    country: input.location?.country || null,
    country_code: input.location?.countryCode || null,
    latitude: input.location?.latitude || null,
    longitude: input.location?.longitude || null,
    timezone: input.location?.timezone || null,

    // Device
    user_agent: input.userAgent,
    device_type: input.device?.deviceType || 'unknown',
    browser: input.device?.browser || 'Unknown',
    browser_version: input.device?.browserVersion || null,
    os: input.device?.os || 'Unknown',
    os_version: input.device?.osVersion || null,

    // Auth
    oauth_provider: input.oauthProvider || null,
    session_token_hash: input.sessionTokenHash || null,

    // Status
    status: 'active' as SessionStatus,
    revoked_by: null,
    revoked_at: null,
    revoke_reason: null,

    // Timestamps
    last_activity: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  const endpoint = `/v1/collections/${COLLECTION}/tables/${TABLE}`;
  const session = await vibeProxyRequest<IVibeLoginSession>(
    endpoint,
    'POST',
    input.accessToken,
    sessionData
  );

  if (session) {
    console.log(`[vibe-sessions] Created session for ${input.email} from ${input.ipAddress}`);
  }

  return session;
}

// -----------------------------------------------------------------------------
// GET SESSIONS
// -----------------------------------------------------------------------------

/**
 * Get all sessions for a specific user.
 *
 * @param idpUserId - The user's IDP ID
 * @param accessToken - User's access token for auth
 * @returns Array of sessions
 */
export async function getUserSessions(
  idpUserId: number,
  accessToken: string
): Promise<IVibeLoginSession[]> {
  const endpoint = `/v1/collections/${COLLECTION}/tables/${TABLE}/query`;
  const result = await vibeProxyRequest<{ data?: IVibeLoginSession[]; items?: IVibeLoginSession[] }>(
    endpoint,
    'POST',
    accessToken,
    {
      filter: [{ field: 'idp_user_id', operator: 'eq', value: idpUserId }],
      pageSize: 100,
    }
  );

  return result?.data || result?.items || [];
}

/**
 * Get all sessions (admin only).
 * Returns sessions from all users, sorted by most recent first.
 *
 * @param options - Query options
 * @param accessToken - Admin's access token
 * @returns Array of sessions with total count
 */
export async function getAllSessions(
  options: SessionQueryOptions = {},
  accessToken: string
): Promise<{ sessions: IVibeLoginSession[]; total: number }> {
  const page = options.page || 1;
  const pageSize = options.pageSize || 50;

  const query: Record<string, unknown> = {
    page,
    pageSize,
    orderBy: 'created_at',
    orderDir: 'desc',
  };

  if (options.status) {
    query.filter = [{ field: 'status', operator: 'eq', value: options.status }];
  }

  const endpoint = `/v1/collections/${COLLECTION}/tables/${TABLE}/query`;
  const result = await vibeProxyRequest<{
    data?: IVibeLoginSession[];
    items?: IVibeLoginSession[];
    meta?: { total?: number; totalCount?: number };
    totalCount?: number;
  }>(endpoint, 'POST', accessToken, query);

  const sessions = result?.data || result?.items || [];
  const total = result?.meta?.total ?? result?.meta?.totalCount ?? result?.totalCount ?? sessions.length;

  return { sessions, total };
}

/**
 * Get a single session by ID.
 *
 * @param sessionId - The session document ID
 * @param accessToken - Access token for auth
 */
export async function getSessionById(
  sessionId: number,
  accessToken: string
): Promise<IVibeLoginSession | null> {
  const endpoint = `/v1/collections/${COLLECTION}/tables/${TABLE}/${sessionId}`;
  return vibeProxyRequest<IVibeLoginSession>(endpoint, 'GET', accessToken);
}

// -----------------------------------------------------------------------------
// REVOKE SESSION
// -----------------------------------------------------------------------------

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
export async function revokeSession(
  sessionId: number,
  adminEmail: string,
  accessToken: string,
  reason?: string
): Promise<IVibeLoginSession | null> {
  const now = new Date().toISOString();

  const endpoint = `/v1/collections/${COLLECTION}/tables/${TABLE}/${sessionId}`;
  const session = await vibeProxyRequest<IVibeLoginSession>(
    endpoint,
    'PUT',
    accessToken,
    {
      status: 'revoked',
      revoked_by: adminEmail,
      revoked_at: now,
      revoke_reason: reason || 'Revoked by administrator',
    }
  );

  if (session) {
    console.log(`[vibe-sessions] Session ${sessionId} revoked by ${adminEmail}`);
  }

  return session;
}

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
export async function revokeAllUserSessions(
  idpUserId: number,
  adminEmail: string,
  accessToken: string,
  reason?: string
): Promise<number> {
  const sessions = await getUserSessions(idpUserId, accessToken);
  const activeSessions = sessions.filter(s => s.status === 'active');

  let revokedCount = 0;
  for (const session of activeSessions) {
    const result = await revokeSession(session.id, adminEmail, accessToken, reason);
    if (result) revokedCount++;
  }

  console.log(`[vibe-sessions] Revoked ${revokedCount} sessions for user ${idpUserId}`);
  return revokedCount;
}

// -----------------------------------------------------------------------------
// UPDATE ACTIVITY
// -----------------------------------------------------------------------------

/**
 * Update the last_activity timestamp for a session.
 * Call this periodically during user activity.
 *
 * @param sessionId - The session document ID
 * @param accessToken - Access token for auth
 * @returns true if updated successfully
 */
export async function updateSessionActivity(
  sessionId: number,
  accessToken: string
): Promise<boolean> {
  const endpoint = `/v1/collections/${COLLECTION}/tables/${TABLE}/${sessionId}`;
  const result = await vibeProxyRequest<IVibeLoginSession>(
    endpoint,
    'PUT',
    accessToken,
    { last_activity: new Date().toISOString() }
  );

  return result !== null;
}

// -----------------------------------------------------------------------------
// CHECK SESSION STATUS
// -----------------------------------------------------------------------------

/**
 * Check if a session is still valid (not revoked/expired).
 * Use this in middleware to enforce session revocation.
 *
 * @param sessionId - The session document ID
 * @param accessToken - Access token for auth
 * @returns true if session is active and not expired
 */
export async function isSessionValid(
  sessionId: number,
  accessToken: string
): Promise<boolean> {
  const session = await getSessionById(sessionId, accessToken);

  if (!session) return false;
  if (session.status !== 'active') return false;

  // Check expiry
  const expiresAt = new Date(session.expires_at);
  if (expiresAt < new Date()) {
    return false;
  }

  return true;
}

/**
 * Check if a user has any revoked sessions that need enforcement.
 * Returns the most recently revoked session if found.
 *
 * @param idpUserId - The user's IDP ID
 * @param accessToken - Access token for auth
 * @param sessionTokenHash - Optional token hash to check specific session
 * @returns Revoked session info if enforcement needed, null otherwise
 */
export async function checkSessionRevocation(
  idpUserId: number,
  accessToken: string,
  sessionTokenHash?: string
): Promise<IVibeLoginSession | null> {
  const sessions = await getUserSessions(idpUserId, accessToken);

  // If we have a specific token hash, check that session
  if (sessionTokenHash) {
    const matchingSession = sessions.find(s => s.session_token_hash === sessionTokenHash);
    if (matchingSession && matchingSession.status === 'revoked') {
      return matchingSession;
    }
  }

  // Otherwise, check if there are any recently revoked sessions
  // (revoked within the last hour - gives time for enforcement)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentlyRevoked = sessions.find(
    s =>
      s.status === 'revoked' &&
      s.revoked_at &&
      new Date(s.revoked_at) > oneHourAgo
  );

  return recentlyRevoked || null;
}

// -----------------------------------------------------------------------------
// STATISTICS
// -----------------------------------------------------------------------------

/**
 * Get session statistics for admin dashboard.
 *
 * @param accessToken - Admin's access token
 */
export async function getSessionStats(accessToken: string): Promise<{
  totalActive: number;
  totalRevoked: number;
  uniqueUsers: number;
  byCountry: Record<string, number>;
  byDevice: Record<string, number>;
  recentLogins: number; // Last 24 hours
}> {
  const { sessions } = await getAllSessions({ pageSize: 1000 }, accessToken);

  const stats = {
    totalActive: 0,
    totalRevoked: 0,
    uniqueUsers: new Set<number>(),
    byCountry: {} as Record<string, number>,
    byDevice: {} as Record<string, number>,
    recentLogins: 0,
  };

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  for (const session of sessions) {
    // Status counts
    if (session.status === 'active') stats.totalActive++;
    if (session.status === 'revoked') stats.totalRevoked++;

    // Unique users
    stats.uniqueUsers.add(session.idp_user_id);

    // By country
    const country = session.country_code || 'Unknown';
    stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;

    // By device type
    const device = session.device_type || 'unknown';
    stats.byDevice[device] = (stats.byDevice[device] || 0) + 1;

    // Recent logins
    if (new Date(session.created_at) > oneDayAgo) {
      stats.recentLogins++;
    }
  }

  return {
    totalActive: stats.totalActive,
    totalRevoked: stats.totalRevoked,
    uniqueUsers: stats.uniqueUsers.size,
    byCountry: stats.byCountry,
    byDevice: stats.byDevice,
    recentLogins: stats.recentLogins,
  };
}
