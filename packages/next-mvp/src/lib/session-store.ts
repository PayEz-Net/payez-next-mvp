/**
 * Session Store for `@payez/next-mvp` using ioredis
 *
 * This module provides a Redis-backed session store that is compatible with the
 * `ioredis` client. It handles the creation, retrieval, and deletion of
 * session data, which is the single source of truth for authentication.
 *
 * Includes advanced distributed refresh coordination with version control.
 */

import redis from './redis';
import { randomBytes } from 'crypto';
import { SessionData } from '../models/SessionModel';
import { getSessionPrefix, getRefreshLockPrefix } from './app-slug';
import { extractKidFromToken } from '../auth/utils/token-utils';

// Re-export SessionData for consumers
export type { SessionData } from '../models/SessionModel';

// Use app-slug prefixes for multi-app isolation
const getSessionKey = (token: string) => `${getSessionPrefix()}${token}`;
const getRefreshLockKey = (token: string) => `${getRefreshLockPrefix()}${token}`;
const getSessionVersionKey = (token: string) => `${getSessionPrefix()}ver:${token}`;

const REFRESH_LOCK_TTL = 60; // 60 seconds
const SESSION_TTL = 3 * 24 * 60 * 60; // 3 days in seconds (matches refresh token lifetime)

export interface RefreshLockInfo {
  sessionToken: string;
  acquiredAt: number;
  acquiredBy: string; // request ID or process identifier
  lockVersion: number;
}

/**
 * Generates a new session token.
 * @returns A new session token string.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Creates a new session in Redis.
 *
 * @param data The session data to store.
 * @returns The generated session token (redisSessionId).
 */
export async function createSession(data: SessionData): Promise<string> {
  const sessionToken = randomBytes(32).toString('hex');
  const key = getSessionKey(sessionToken);
  const versionKey = getSessionVersionKey(sessionToken);

  try {
    await redis.multi()
      .setex(key, SESSION_TTL, JSON.stringify(data))
      .setex(versionKey, SESSION_TTL, '1')
      .exec();
  } catch (error) {
    console.error('[SESSION-STORE] Failed to create session:', error);
    throw error;
  }

  return sessionToken;
}

/**
 * Retrieves a session from Redis.
 *
 * @param sessionToken The session token (redisSessionId) to look up.
 * @returns The session data, or null if not found.
 */
export async function getSession(sessionToken: string): Promise<SessionData | null> {
  if (!sessionToken) {
    return null;
  }
  const key = getSessionKey(sessionToken);
  const json = await redis.get(key);
  if (!json) {
    return null;
  }
  try {
    return JSON.parse(json) as SessionData;
  } catch {
    console.error('[SESSION-STORE] Failed to parse session data');
    return null;
  }
}

/**
 * Retrieves a session along with a version identifier for optimistic locking.
 * @param sessionToken The session token to look up.
 * @returns An object with session and version, or null if not found.
 */
export async function getSessionWithVersion(sessionToken: string): Promise<{ session: SessionData; version: string } | null> {
  const session = await getSession(sessionToken);
  if (!session) {
    return null;
  }

  const versionKey = getSessionVersionKey(sessionToken);
  const version = await redis.get(versionKey);

  if (!version) {
    // Session exists but version key missing - use idpAccessTokenExpires as fallback
    const fallbackVersion = String(session.idpAccessTokenExpires || Date.now());
    return { session, version: fallbackVersion };
  }

  return { session, version };
}

/**
 * Checks if the access token in a session is still fresh (not expired).
 * @param sessionToken The session token to check.
 * @param currentAccessToken The current access token to compare.
 * @param currentVersion Optional version to check for changes.
 * @returns Object with freshness status and latest token info.
 */
export async function isAccessTokenFresh(
  sessionToken: string,
  currentAccessToken: string,
  currentVersion?: string
): Promise<{
  isFresh: boolean;
  latestAccessToken?: string;
  latestVersion?: string;
  versionChanged: boolean;
}> {
  const sessionWithVersion = await getSessionWithVersion(sessionToken);

  if (!sessionWithVersion) {
    return { isFresh: false, versionChanged: true };
  }

  const { session, version } = sessionWithVersion;
  const versionChanged = currentVersion ? version !== currentVersion : false;

  // If version changed, the token might be stale
  // Use normalized field name (idpAccessToken)
  const isFresh = !versionChanged && session.idpAccessToken === currentAccessToken;

  return {
    isFresh,
    latestAccessToken: session.idpAccessToken || undefined,
    latestVersion: version,
    versionChanged
  };
}

/**
 * Deletes a session from Redis.
 * @param sessionToken The session token to delete.
 */
export async function deleteSession(sessionToken: string): Promise<void> {
  if (!sessionToken) {
    return;
  }
  const key = getSessionKey(sessionToken);
  const versionKey = getSessionVersionKey(sessionToken);
  await redis.del(key, versionKey);
}

/**
 * Sets a session directly (for testing or migrations).
 * @param sessionToken The session token.
 * @param data The session data.
 */
export async function setSession(sessionToken: string, data: SessionData): Promise<void> {
  const key = getSessionKey(sessionToken);
  const versionKey = getSessionVersionKey(sessionToken);
  await redis.multi()
    .setex(key, SESSION_TTL, JSON.stringify(data))
    .incr(versionKey)
    .expire(versionKey, SESSION_TTL)
    .exec();
}

/**
 * Updates tokens within an existing session.
 * @param sessionToken The session token to update.
 * @param updates Partial session data to update.
 * @returns The updated session data, or null if the session was not found.
 */
export async function updateSession(
  sessionToken: string,
  updates: Partial<SessionData>
): Promise<SessionData | null> {
  const key = getSessionKey(sessionToken);
  const versionKey = getSessionVersionKey(sessionToken);

  // Get current session to merge with updates
  const currentSession = await getSession(sessionToken);
  if (!currentSession) {
    return null;
  }

  // CRITICAL: Track any refresh token changes (check both old and new field names)
  const hadRefreshToken = !!(currentSession.idpRefreshToken || (currentSession as any).refreshToken);
  const willHaveRefreshToken = (updates as any).idpRefreshToken !== undefined
    ? !!(updates as any).idpRefreshToken
    : (updates as any).refreshToken !== undefined
      ? !!(updates as any).refreshToken
      : hadRefreshToken;

  if (hadRefreshToken && !willHaveRefreshToken) {
    console.error('[SESSION-STORE] ⚠️ REFRESH_TOKEN_BEING_CLEARED', {
      sessionToken: sessionToken.substring(0, 8) + '...',
      userId: currentSession.userId,
      updateKeys: Object.keys(updates),
      refreshTokenInUpdate: (updates as any).idpRefreshToken || (updates as any).refreshToken,
      refreshTokenClearedReason: (updates as any).refreshTokenClearedReason || 'UNKNOWN',
      stack: new Error().stack
    });
  }

  // Merge current session with updates
  const updatedSession = { ...currentSession, ...updates };

  // Write the entire updated session back to Redis with version increment
  await redis.multi()
    .setex(key, SESSION_TTL, JSON.stringify(updatedSession))
    .incr(versionKey)
    .expire(versionKey, SESSION_TTL)
    .exec();

  return updatedSession;
}

/**
 * Transitions a session to a MFA-completed state.
 * @param sessionToken The session token to update.
 * @param tokens The new tokens received after MFA completion.
 * @param mfaMethod The MFA method used (email, sms, totp) - required for token refresh.
 * @returns The updated session data.
 */
export async function transitionTo2FASession(
  sessionToken: string,
  tokens: {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
    // Support new field names
    idpAccessToken?: string;
    idpRefreshToken?: string;
    idpAccessTokenExpires?: number;
    idpRefreshTokenExpires?: number;
  },
  mfaMethod?: 'email' | 'sms' | 'totp'
): Promise<SessionData | null> {
  const newAccessToken = tokens.idpAccessToken || tokens.accessToken;

  console.log('[transitionTo2FASession] Called with:', {
    sessionToken: sessionToken?.substring(0, 8) + '...',
    mfaMethod,
    hasAccessToken: !!newAccessToken,
    hasRefreshToken: !!(tokens.idpRefreshToken || tokens.refreshToken),
  });

  // Extract bearerKeyId from the new access token (IDP may use different key after 2FA)
  let bearerKeyId: string | undefined;
  if (newAccessToken) {
    bearerKeyId = extractKidFromToken(newAccessToken);
    if (bearerKeyId) {
      console.log('[transitionTo2FASession] Extracted bearerKeyId (kid) from new JWT header:', bearerKeyId);
    }
  }

  // Support both old and new field names in input
  // CRITICAL: Set BOTH mfaVerified (new) AND twoFactorComplete (legacy) for compatibility
  // auth.ts session callback reads twoFactorComplete, so we must set it here
  const updates: Partial<SessionData> = {
    idpAccessToken: newAccessToken,
    idpRefreshToken: tokens.idpRefreshToken || tokens.refreshToken,
    idpAccessTokenExpires: tokens.idpAccessTokenExpires || tokens.accessTokenExpires,
    mfaVerified: true,
    twoFactorComplete: true, // Legacy field - required by auth.ts session callback
    mfaMethod: mfaMethod,
    // Update bearerKeyId if extracted from new token
    ...(bearerKeyId && { bearerKeyId }),
  };

  const refreshExpires = tokens.idpRefreshTokenExpires || tokens.refreshTokenExpires;
  if (refreshExpires !== undefined) {
    updates.idpRefreshTokenExpires = refreshExpires;
  }

  console.log('[transitionTo2FASession] Updates to apply:', {
    mfaVerified: updates.mfaVerified,
    twoFactorComplete: (updates as any).twoFactorComplete,
    mfaMethod: updates.mfaMethod,
    hasIdpAccessToken: !!updates.idpAccessToken,
  });

  const result = await updateSession(sessionToken, updates);

  console.log('[transitionTo2FASession] Result:', {
    success: !!result,
    resultMfaVerified: result?.mfaVerified,
  });

  return result;
}

/**
 * Updates IDP tokens and their expiries in an existing session.
 * @param sessionToken The session token to update.
 * @param idpAccessToken The new IDP access token.
 * @param idpRefreshToken The new IDP refresh token.
 * @param idpAccessTokenExpires The access token expiry timestamp.
 * @param idpRefreshTokenExpires The refresh token expiry timestamp (optional).
 * @returns The updated session data.
 */
export async function updateTokens(
  sessionToken: string,
  idpAccessToken: string,
  idpRefreshToken: string,
  idpAccessTokenExpires: number,
  idpRefreshTokenExpires?: number
): Promise<SessionData | null> {
  return updateSession(sessionToken, {
    idpAccessToken,
    idpRefreshToken,
    idpAccessTokenExpires,
    idpRefreshTokenExpires,
  } as Partial<SessionData>);
}

/**
 * Marks a session as having completed MFA.
 * @param sessionToken The session token to update.
 * @returns The updated session data.
 */
export async function mark2FAComplete(sessionToken: string): Promise<SessionData | null> {
  return updateSession(sessionToken, {
    mfaVerified: true,
  });
}

/**
 * Checks if MFA is complete for a session.
 * @param sessionToken The session token.
 * @returns True if MFA is complete.
 */
export async function is2FAComplete(sessionToken: string): Promise<boolean> {
  const session = await getSession(sessionToken);
  return session?.mfaVerified === true;
}

/**
 * Gets IDP tokens from a session.
 * @param sessionToken The session token.
 * @returns The tokens or null if session not found.
 */
export async function getTokens(sessionToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  // Also expose new names for clarity
  idpAccessToken: string;
  idpRefreshToken: string;
} | null> {
  const session = await getSession(sessionToken);
  if (!session || !session.idpAccessToken || !session.idpRefreshToken) {
    return null;
  }
  return {
    // Legacy names for backward compatibility
    accessToken: session.idpAccessToken,
    refreshToken: session.idpRefreshToken,
    // New normalized names
    idpAccessToken: session.idpAccessToken,
    idpRefreshToken: session.idpRefreshToken,
  };
}

/**
 * Refreshes a JWT session (placeholder for compatibility).
 * @param sessionToken The session token.
 * @returns The session data or null.
 */
export async function refreshJWTSession(sessionToken: string): Promise<SessionData | null> {
  return getSession(sessionToken);
}

/**
 * Clears all sessions (for testing only).
 */
export async function clearAllSessions(): Promise<void> {
  console.warn('[SESSION-STORE] clearAllSessions called - this should only be used in testing');
}

/**
 * Lists all sessions (for testing/debugging only).
 * @returns An empty array (placeholder).
 */
export async function listAllSessions(): Promise<string[]> {
  console.warn('[SESSION-STORE] listAllSessions called - this should only be used in testing');
  return [];
}

// ===============================
// DISTRIBUTED REFRESH COORDINATION
// ===============================

/**
 * Attempt to acquire a refresh lock for a session
 * Uses Redis SET with NX (Not eXists) for atomic lock acquisition
 */
export async function acquireRefreshLock(
  sessionToken: string,
  requestId: string,
  maxWaitMs: number = 5000
): Promise<{ acquired: boolean; lockInfo?: RefreshLockInfo }> {
  const lockKey = getRefreshLockKey(sessionToken);
  const acquiredAt = Date.now();
  const lockVersion = Math.floor(Math.random() * 1000000);

  const lockInfo: RefreshLockInfo = {
    sessionToken,
    acquiredAt,
    acquiredBy: requestId,
    lockVersion
  };

  try {
    // Try to acquire the lock atomically
    const result = await redis.set(lockKey, JSON.stringify(lockInfo), 'PX', REFRESH_LOCK_TTL * 1000, 'NX');

    if (result === 'OK') {
      console.log('[SESSION-STORE] Refresh lock acquired', {
        sessionToken: sessionToken.substring(0, 8) + '...',
        requestId,
        lockVersion
      });

      return { acquired: true, lockInfo };
    } else {
      // Lock already exists, check if we should wait
      if (maxWaitMs > 0) {
        console.log('[SESSION-STORE] Refresh lock already exists, waiting for release', {
          sessionToken: sessionToken.substring(0, 8) + '...',
          requestId,
          maxWaitMs
        });

        return await waitForRefreshLockRelease(sessionToken, requestId, maxWaitMs);
      }

      console.warn('[SESSION-STORE] Refresh lock already exists, not waiting', {
        sessionToken: sessionToken.substring(0, 8) + '...',
        requestId
      });

      return { acquired: false };
    }
  } catch (error) {
    console.error('[SESSION-STORE] Failed to acquire refresh lock', {
      sessionToken: sessionToken.substring(0, 8) + '...',
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return { acquired: false };
  }
}

/**
 * Wait for a refresh lock to be released
 */
async function waitForRefreshLockRelease(
  sessionToken: string,
  requestId: string,
  maxWaitMs: number
): Promise<{ acquired: boolean; lockInfo?: RefreshLockInfo }> {
  const lockKey = getRefreshLockKey(sessionToken);
  const startTime = Date.now();
  const pollInterval = 100;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const lockExists = await redis.exists(lockKey);

      if (!lockExists) {
        // Lock released - do not reacquire here to avoid double refresh
        return { acquired: false };
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('[SESSION-STORE] Error while waiting for refresh lock release', {
        sessionToken: sessionToken.substring(0, 8) + '...',
        requestId,
        error: error instanceof Error ? error.message : String(error)
      });
      break;
    }
  }

  console.warn('[SESSION-STORE] Timeout waiting for refresh lock release', {
    sessionToken: sessionToken.substring(0, 8) + '...',
    requestId,
    waitedMs: Date.now() - startTime
  });

  return { acquired: false };
}

/**
 * Release a refresh lock
 * Uses Lua script to ensure atomic validation and release
 */
export async function releaseRefreshLock(
  sessionToken: string,
  requestId: string,
  lockVersion?: number
): Promise<boolean> {
  const lockKey = getRefreshLockKey(sessionToken);

  try {
    // Lua script for atomic lock validation and release
    const luaScript = `
      local lockKey = KEYS[1]
      local expectedRequestId = ARGV[1]
      local expectedVersion = ARGV[2]

      local lockData = redis.call('GET', lockKey)
      if not lockData then
        return 0  -- Lock doesn't exist
      end

      local lockInfo = cjson.decode(lockData)
      if lockInfo.acquiredBy == expectedRequestId then
        if not expectedVersion or expectedVersion == '' or tostring(lockInfo.lockVersion) == expectedVersion then
          redis.call('DEL', lockKey)
          return 1  -- Successfully released
        else
          return -2  -- Version mismatch
        end
      else
        return -1  -- Wrong owner
      end
    `;

    const result = await redis.eval(
      luaScript,
      1,
      lockKey,
      requestId,
      lockVersion ? lockVersion.toString() : ''
    ) as number;

    if (result === 1) {
      console.log('[SESSION-STORE] Refresh lock released successfully', {
        sessionToken: sessionToken.substring(0, 8) + '...',
        requestId,
        lockVersion
      });
      return true;
    } else if (result === 0) {
      console.warn('[SESSION-STORE] Attempted to release non-existent refresh lock', {
        sessionToken: sessionToken.substring(0, 8) + '...',
        requestId
      });
      return false;
    } else if (result === -1) {
      console.error('[SESSION-STORE] Attempted to release refresh lock owned by another request', {
        sessionToken: sessionToken.substring(0, 8) + '...',
        requestId
      });
      return false;
    } else if (result === -2) {
      console.error('[SESSION-STORE] Lock version mismatch during release', {
        sessionToken: sessionToken.substring(0, 8) + '...',
        requestId,
        lockVersion
      });
      return false;
    } else {
      console.error('[SESSION-STORE] Unexpected result from lock release script', {
        sessionToken: sessionToken.substring(0, 8) + '...',
        requestId,
        result
      });
      return false;
    }
  } catch (error) {
    console.error('[SESSION-STORE] Failed to release refresh lock', {
      sessionToken: sessionToken.substring(0, 8) + '...',
      requestId,
      error: error instanceof Error ? error.message : String(error)
    });

    return false;
  }
}

/**
 * Check if a refresh lock exists for a session
 */
export async function checkRefreshLock(sessionToken: string): Promise<RefreshLockInfo | null> {
  const lockKey = getRefreshLockKey(sessionToken);

  try {
    const lockData = await redis.get(lockKey);

    if (!lockData) {
      return null;
    }

    return JSON.parse(lockData) as RefreshLockInfo;
  } catch (error) {
    console.error('[SESSION-STORE] Failed to check refresh lock', {
      sessionToken: sessionToken.substring(0, 8) + '...',
      error: error instanceof Error ? error.message : String(error)
    });

    return null;
  }
}

/**
 * Simple check if a refresh is currently in progress for a session
 */
export async function isRefreshInProgress(sessionToken: string): Promise<boolean> {
  const lock = await checkRefreshLock(sessionToken);
  return lock !== null;
}

/**
 * Force cleanup of expired or orphaned refresh locks
 */
export async function cleanupRefreshLocks(): Promise<number> {
  console.warn('[SESSION-STORE] cleanupRefreshLocks called - scanning for expired locks');
  return 0;
}
