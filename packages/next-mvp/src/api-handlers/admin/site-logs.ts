/**
 * Admin Site Logs API Handlers
 *
 * Provides admin-level access to site activity logs.
 * - GET /site-logs - Query logs from Vibe
 * - POST /site-logs - Create test log entries via Redis queue
 * - GET /site-logs/stats - Aggregated stats { total, unique_users, by_level, by_category }
 * - POST /site-logs/drain - Manual drain trigger
 * - GET /site-logs/queue - Redis queue status
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getRedis } from '../../lib/redis';
import { ADMIN_ROLES, hasAnyRole } from '../../lib/roles';
const REDIS_SITE_LOG_KEY = 'vibe:site-logs:pending';
const REDIS_LOG_TTL = 7 * 24 * 60 * 60; // 1 week

export interface SiteLogsHandlerConfig {
  getAuthOptions: () => Promise<any>;
  vibeApiUrl?: string;
  appSlug?: string;
  vibeClientId?: string;
}

/**
 * Check if the current user has admin role
 */
async function checkAdminRole(getAuthOptions: () => Promise<any>): Promise<{ isAdmin: boolean; userId?: number; accessToken?: string; clientId?: string; error?: NextResponse }> {
  const authOptions = await getAuthOptions();
  const session = await getServerSession(authOptions) as any;

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

  return {
    isAdmin: true,
    userId: session.user?.id,
    accessToken: session.accessToken,
    clientId: session.clientId,
  };
}

function getVibeApiUrl(config: SiteLogsHandlerConfig): string {
  if (config.vibeApiUrl) return config.vibeApiUrl;
  const url = process.env.VIBE_API_URL;
  if (url) return url;
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:37933';
  throw new Error('VIBE_API_URL is required in production');
}

/**
 * Create main site-logs handler (GET query, POST create test entries)
 */
export function createSiteLogsHandler(config: SiteLogsHandlerConfig) {
  return {
    async GET(request: NextRequest) {
      const adminCheck = await checkAdminRole(config.getAuthOptions);
      if (adminCheck.error) return adminCheck.error;

      const { searchParams } = new URL(request.url);
      const vibeUrl = getVibeApiUrl(config);

      // Forward query params
      const params = new URLSearchParams();
      if (searchParams.get('level')) params.set('level', searchParams.get('level')!);
      if (searchParams.get('category')) params.set('category', searchParams.get('category')!);
      if (searchParams.get('search')) params.set('search', searchParams.get('search')!);
      if (searchParams.get('from')) params.set('from', searchParams.get('from')!);
      if (searchParams.get('to')) params.set('to', searchParams.get('to')!);
      if (searchParams.get('user_id')) params.set('user_id', searchParams.get('user_id')!);
      if (searchParams.get('limit')) params.set('limit', searchParams.get('limit')!);
      if (searchParams.get('offset')) params.set('offset', searchParams.get('offset')!);

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${adminCheck.accessToken}`,
        'Content-Type': 'application/json',
      };
      if (adminCheck.clientId) {
        headers['X-Client-Id'] = adminCheck.clientId;
      }

      try {
        const response = await fetch(`${vibeUrl}/v1/admin/site-logs?${params}`, { headers });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[admin/site-logs] Vibe error:', response.status, errorText);
          return NextResponse.json(
            { error: 'Failed to fetch site logs', details: errorText },
            { status: response.status }
          );
        }

        const data = await response.json();
        return NextResponse.json(data);
      } catch (error: any) {
        console.error('[admin/site-logs] Error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal error' },
          { status: 500 }
        );
      }
    },

    async POST(request: NextRequest) {
      const adminCheck = await checkAdminRole(config.getAuthOptions);
      if (adminCheck.error) return adminCheck.error;

      try {
        const body = await request.json();
        const redis = getRedis();

        const userAgent = request.headers.get('user-agent') || null;
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || null;
        const baseRecord = {
          user_agent: userAgent,
          ip_address: ipAddress,
          created_at: new Date().toISOString(),
          app_slug: config.appSlug || process.env.APP_SLUG || process.env.CLIENT_ID || 'unknown',
          vibe_client_id: config.vibeClientId || process.env.VIBE_CLIENT_ID || '',
        };

        // If generateAll=true, create one of each event type
        if (body.generate_all) {
          const testEvents = [
            { log_level: 'debug', category: 'api', message: 'Test: API request traced', context: { endpoint: '/api/test', method: 'GET' }, url: '/api/test' },
            { log_level: 'info', category: 'auth', message: 'Test: User logged in', context: { method: 'password' }, user_id: 1, url: '/api/auth/callback' },
            { log_level: 'info', category: 'page_view', message: 'Test: Page viewed', context: { referrer: '/dashboard' }, user_id: 1, url: '/admin/activity' },
            { log_level: 'info', category: 'user_action', message: 'Test: Button clicked', context: { target: 'submit-btn' }, user_id: 1, url: '/admin/activity' },
            { log_level: 'warn', category: 'auth', message: 'Test: Login failed', context: { reason: 'invalid_password' }, url: '/api/auth/login' },
            { log_level: 'error', category: 'error', message: 'Test: Application error', context: { error: 'TestError', stack: 'at test()' }, url: '/api/test' },
          ];

          for (const event of testEvents) {
            const logRecord = JSON.stringify({ ...baseRecord, ...event, session_id: null });
            await redis.lpush(REDIS_SITE_LOG_KEY, logRecord);
          }
          await redis.expire(REDIS_SITE_LOG_KEY, REDIS_LOG_TTL);
          const queueLen = await redis.llen(REDIS_SITE_LOG_KEY);

          return NextResponse.json({
            success: true,
            message: `Created ${testEvents.length} test events`,
            queue_length: queueLen,
            events: testEvents.map(e => ({ level: e.log_level, category: e.category, message: e.message })),
            note: 'Events will appear after drain service processes them',
          }, { status: 201 });
        }

        // Single event creation
        const logRecord = JSON.stringify({
          ...baseRecord,
          log_level: body.level || 'info',
          category: body.category || 'user_action',
          message: body.message || 'Test log entry',
          context: body.context || { source: 'admin-test' },
          user_id: body.user_id || null,
          session_id: null,
          url: body.url || '/admin/activity',
        });

        await redis.lpush(REDIS_SITE_LOG_KEY, logRecord);
        await redis.expire(REDIS_SITE_LOG_KEY, REDIS_LOG_TTL);
        const queueLen = await redis.llen(REDIS_SITE_LOG_KEY);

        return NextResponse.json({
          success: true,
          message: 'Test log created',
          queue_length: queueLen,
          note: 'Log will appear after drain service processes it (every 5 seconds)',
        }, { status: 201 });
      } catch (error: any) {
        console.error('[admin/site-logs] POST Error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal error' },
          { status: 500 }
        );
      }
    },
  };
}

/**
 * Create site-logs stats handler
 * Returns: { total, unique_users, by_level, by_category }
 */
export function createSiteLogsStatsHandler(config: SiteLogsHandlerConfig) {
  return {
    async GET(request: NextRequest) {
      const adminCheck = await checkAdminRole(config.getAuthOptions);
      if (adminCheck.error) return adminCheck.error;

      const { searchParams } = new URL(request.url);
      const vibeUrl = getVibeApiUrl(config);

      const params = new URLSearchParams();
      if (searchParams.get('from')) params.set('from', searchParams.get('from')!);
      if (searchParams.get('to')) params.set('to', searchParams.get('to')!);

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${adminCheck.accessToken}`,
        'Content-Type': 'application/json',
      };
      if (adminCheck.clientId) {
        headers['X-Client-Id'] = adminCheck.clientId;
      }

      try {
        const response = await fetch(`${vibeUrl}/v1/admin/site-logs/stats?${params}`, { headers });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[admin/site-logs/stats] Vibe error:', response.status, errorText);
          return NextResponse.json(
            { error: 'Failed to fetch stats', details: errorText },
            { status: response.status }
          );
        }

        const data = await response.json();
        // Ensure response matches expected format: { total, unique_users, by_level, by_category }
        return NextResponse.json(data);
      } catch (error: any) {
        console.error('[admin/site-logs/stats] Error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal error' },
          { status: 500 }
        );
      }
    },
  };
}

/**
 * Create site-logs drain handler (manual trigger)
 */
export function createSiteLogsDrainHandler(config: SiteLogsHandlerConfig) {
  return {
    async POST(request: NextRequest) {
      const adminCheck = await checkAdminRole(config.getAuthOptions);
      if (adminCheck.error) return adminCheck.error;

      const { searchParams } = new URL(request.url);
      const maxEntries = searchParams.get('max_entries') || '100';
      const vibeUrl = getVibeApiUrl(config);

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${adminCheck.accessToken}`,
        'Content-Type': 'application/json',
      };
      if (adminCheck.clientId) {
        headers['X-Client-Id'] = adminCheck.clientId;
      }

      try {
        const response = await fetch(`${vibeUrl}/v1/admin/site-logs/drain?maxEntries=${maxEntries}`, {
          method: 'POST',
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[admin/site-logs/drain] Vibe error:', response.status, errorText);
          return NextResponse.json(
            { error: 'Failed to drain site logs', details: errorText },
            { status: response.status }
          );
        }

        const data = await response.json();
        return NextResponse.json(data);
      } catch (error: any) {
        console.error('[admin/site-logs/drain] Error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal error' },
          { status: 500 }
        );
      }
    },
  };
}

/**
 * Create site-logs queue status handler
 */
export function createSiteLogsQueueHandler(config: SiteLogsHandlerConfig) {
  return {
    async GET(request: NextRequest) {
      const adminCheck = await checkAdminRole(config.getAuthOptions);
      if (adminCheck.error) return adminCheck.error;

      try {
        const redis = getRedis();
        const queueLength = await redis.llen(REDIS_SITE_LOG_KEY);

        // Peek at the oldest and newest entries
        let oldest_entry = null;
        let newest_entry = null;

        if (queueLength > 0) {
          const oldest = await redis.lindex(REDIS_SITE_LOG_KEY, -1); // RPOP side (oldest)
          const newest = await redis.lindex(REDIS_SITE_LOG_KEY, 0);  // LPUSH side (newest)

          if (oldest) {
            try {
              const parsed = JSON.parse(oldest);
              oldest_entry = {
                message: parsed.message,
                level: parsed.log_level,
                timestamp: parsed.created_at || parsed.queued_at,
              };
            } catch {}
          }

          if (newest) {
            try {
              const parsed = JSON.parse(newest);
              newest_entry = {
                message: parsed.message,
                level: parsed.log_level,
                timestamp: parsed.created_at || parsed.queued_at,
              };
            } catch {}
          }
        }

        return NextResponse.json({
          queue_length: queueLength,
          redis_key: REDIS_SITE_LOG_KEY,
          oldest_entry,
          newest_entry,
          status: queueLength === 0 ? 'empty' : 'pending',
        });
      } catch (error: any) {
        console.error('[admin/site-logs/queue] Error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal error' },
          { status: 500 }
        );
      }
    },
  };
}
