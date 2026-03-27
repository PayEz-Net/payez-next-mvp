/**
 * Admin Redis Sessions API Handler
 *
 * Provides admin-level access to active sessions stored in Redis.
 * Reads directly from Redis {APP_SLUG}:sess:* pattern.
 *
 * Note: This is different from sessions.ts which queries Vibe login_sessions table.
 * This handler shows real-time active sessions in Redis.
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../server/auth';
import { getRedis } from '../../lib/redis';
import { ADMIN_ROLES, hasAnyRole } from '../../lib/roles';

export interface RedisSessionsHandlerConfig {
  appSlug?: string;
}

/**
 * Check if the current user has admin role
 */
async function checkAdminRole(request: NextRequest): Promise<{ isAdmin: boolean; userId?: number; error?: NextResponse }> {
  const session = await getSession(request) as any;

  if (!session?.user) {
    return {
      isAdmin: false,
      error: NextResponse.json(
        { success: false, error: 'Please sign in' },
        { status: 401 }
      ),
    };
  }

  const userRoles = (session.user?.roles as string[]) || [];
  const hasAdminRole = ADMIN_ROLES.some(role => userRoles.includes(role));

  if (!hasAdminRole) {
    return {
      isAdmin: false,
      error: NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      ),
    };
  }

  return { isAdmin: true, userId: session.user?.id };
}

/**
 * Create Redis sessions handler
 * GET /api/admin/redis-sessions - List all active sessions from Redis
 */
export function createRedisSessionsHandler(config: RedisSessionsHandlerConfig) {
  const getSessionPrefix = () => {
    const appSlug = config.appSlug || process.env.APP_SLUG || process.env.CLIENT_ID || 'app';
    return `${appSlug}:sess:`;
  };

  return {
    async GET(request: NextRequest) {
      const adminCheck = await checkAdminRole(request);
      if (adminCheck.error) return adminCheck.error;

      try {
        const redis = getRedis();
        const sessionPrefix = getSessionPrefix();

        // Scan Redis for all session keys (exclude version keys)
        const sessionKeys: string[] = [];
        let cursor = '0';
        do {
          const [newCursor, keys] = await redis.scan(cursor, 'MATCH', `${sessionPrefix}*`, 'COUNT', 100);
          cursor = newCursor;
          // Filter out version keys (ver:) - only want actual session keys
          sessionKeys.push(...keys.filter((k: string) => !k.includes(':ver:')));
        } while (cursor !== '0');

        // Fetch all session data
        const sessions = [];
        for (const key of sessionKeys) {
          const sessionJson = await redis.get(key);
          if (!sessionJson) continue;

          try {
            const sessionData = JSON.parse(sessionJson);
            const sessionToken = key.replace(sessionPrefix, '');

            sessions.push({
              id: sessionToken.substring(0, 16), // Truncated for display
              session_token: sessionToken.substring(0, 8) + '...', // Masked
              user_id: sessionData.userId,
              user_name: sessionData.name,
              user_email: sessionData.email,
              status: 'active', // Sessions in Redis are active
              created_at: sessionData.createdAt,
              mfa_verified: sessionData.mfaVerified || sessionData.twoFactorComplete || false,
              access_token_expires: sessionData.idpAccessTokenExpires
                ? new Date(sessionData.idpAccessTokenExpires).toISOString()
                : null,
            });
          } catch (parseError) {
            console.error('[admin/redis-sessions] Failed to parse session:', key, parseError);
          }
        }

        // Sort by most recent first (if created_at available)
        sessions.sort((a, b) => {
          if (!a.created_at || !b.created_at) return 0;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        // Calculate stats
        const uniqueUsers = new Set(sessions.map(s => s.user_email).filter(Boolean)).size;

        return NextResponse.json({
          sessions,
          total: sessions.length,
          stats: {
            total_active: sessions.length,
            total_revoked: 0, // Revoked sessions are deleted from Redis
            unique_users: uniqueUsers,
          },
          redis_prefix: sessionPrefix,
        });
      } catch (error: any) {
        console.error('[admin/redis-sessions] Error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal error' },
          { status: 500 }
        );
      }
    },

    async DELETE(request: NextRequest) {
      const adminCheck = await checkAdminRole(request);
      if (adminCheck.error) return adminCheck.error;

      try {
        const { searchParams } = new URL(request.url);
        const sessionToken = searchParams.get('session_token');

        if (!sessionToken) {
          return NextResponse.json(
            { error: 'session_token parameter required' },
            { status: 400 }
          );
        }

        const redis = getRedis();
        const sessionPrefix = getSessionPrefix();
        const sessionKey = `${sessionPrefix}${sessionToken}`;

        // Delete the session
        const deleted = await redis.del(sessionKey);

        if (deleted === 0) {
          return NextResponse.json(
            { error: 'Session not found or already deleted' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Session revoked',
          session_token: sessionToken.substring(0, 8) + '...',
        });
      } catch (error: any) {
        console.error('[admin/redis-sessions] DELETE Error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal error' },
          { status: 500 }
        );
      }
    },
  };
}

/**
 * Create Redis session revoke handler for specific session
 * POST /api/admin/redis-sessions/[sessionId]/revoke
 */
export function createRedisSessionRevokeHandler(config: RedisSessionsHandlerConfig) {
  const getSessionPrefix = () => {
    const appSlug = config.appSlug || process.env.APP_SLUG || process.env.CLIENT_ID || 'app';
    return `${appSlug}:sess:`;
  };

  return {
    async POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
      const adminCheck = await checkAdminRole(request);
      if (adminCheck.error) return adminCheck.error;

      try {
        const sessionId = params.sessionId;
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Session ID required' },
            { status: 400 }
          );
        }

        const redis = getRedis();
        const sessionPrefix = getSessionPrefix();

        // Find session key that starts with the sessionId
        let targetKey: string | null = null;
        let cursor = '0';
        do {
          const [newCursor, keys] = await redis.scan(cursor, 'MATCH', `${sessionPrefix}*`, 'COUNT', 100);
          cursor = newCursor;
          for (const key of keys) {
            const token = key.replace(sessionPrefix, '');
            if (token.startsWith(sessionId) || token.substring(0, 16) === sessionId) {
              targetKey = key;
              break;
            }
          }
          if (targetKey) break;
        } while (cursor !== '0');

        if (!targetKey) {
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          );
        }

        // Delete the session
        await redis.del(targetKey);

        return NextResponse.json({
          success: true,
          message: 'Session revoked',
        });
      } catch (error: any) {
        console.error('[admin/redis-sessions/revoke] Error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal error' },
          { status: 500 }
        );
      }
    },
  };
}
