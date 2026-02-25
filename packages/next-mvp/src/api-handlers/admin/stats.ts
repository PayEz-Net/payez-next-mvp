/**
 * Admin Stats API Handler
 *
 * Aggregates dashboard statistics from users, Redis sessions, and audit logs.
 * Uses service account HMAC auth for Vibe API requests.
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getStartupIDPConfig } from '../../lib/startup-init';
import { getRedis } from '../../lib/redis';
import { ADMIN_ROLES } from '../../lib/roles';

interface VibeRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

async function checkAdminRole(getAuthOptions: () => Promise<any>): Promise<{ isAdmin: boolean; error?: NextResponse }> {
  const authOptions = await getAuthOptions();
  const session = await getServerSession(authOptions) as any;

  if (!session?.user) {
    return {
      isAdmin: false,
      error: NextResponse.json({ success: false, error: 'Please sign in' }, { status: 401 }),
    };
  }

  const userRoles = (session.user?.roles as string[]) || [];
  const hasAdminRole = ADMIN_ROLES.some(role => userRoles.includes(role));

  if (!hasAdminRole) {
    return {
      isAdmin: false,
      error: NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 }),
    };
  }

  return { isAdmin: true };
}

async function vibeServiceRequest<T = unknown>(
  endpoint: string,
  options: VibeRequestOptions
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const idpUrl = process.env.NEXT_PUBLIC_IDP_URL || process.env.IDP_URL;
  const clientId = process.env.VIBE_CLIENT_ID;
  const signingKey = process.env.VIBE_HMAC_KEY;

  if (!idpUrl || !clientId || !signingKey) {
    return { ok: false, status: 500, data: null, error: 'Vibe not configured' };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = `${timestamp}|${options.method}|${endpoint}`;

  const crypto = await import('crypto');
  const signature = crypto
    .createHmac('sha256', Buffer.from(signingKey, 'base64'))
    .update(stringToSign)
    .digest('base64');

  const proxyUrl = `${idpUrl}/api/vibe/proxy`;

  const idpConfig = getStartupIDPConfig();
  const idpClientId = idpConfig?.clientSlug || idpConfig?.clientId;

  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Vibe-Client-Id': clientId,
        'X-Vibe-Timestamp': String(timestamp),
        'X-Vibe-Signature': signature,
        ...(idpClientId && { 'X-Client-Id': idpClientId }),
      },
      body: JSON.stringify({
        endpoint,
        method: options.method,
        data: options.body ?? null,
      }),
      cache: 'no-store',
    });

    if (res.status === 204) return { ok: true, status: 204, data: null };
    if (!res.ok) {
      const errorText = await res.text();
      return { ok: false, status: res.status, data: null, error: errorText };
    }

    const body = await res.json();
    return { ok: true, status: res.status, data: body };
  } catch (error) {
    return { ok: false, status: 0, data: null, error: String(error) };
  }
}

export interface AdminStatsHandlerConfig {
  getAuthOptions: () => Promise<any>;
  appSlug?: string;
}

/**
 * GET /api/admin/stats - Dashboard statistics
 * Aggregates users + tier breakdown, active Redis sessions, and recent audit activity.
 */
export function createStatsHandler(config: AdminStatsHandlerConfig) {
  const getSessionPrefix = () => {
    const appSlug = config.appSlug || process.env.APP_SLUG || process.env.CLIENT_ID || 'app';
    return `${appSlug}:sess:`;
  };

  return {
    async GET(_request: NextRequest) {
      const adminCheck = await checkAdminRole(config.getAuthOptions);
      if (adminCheck.error) return adminCheck.error;

      try {
        // Fetch from 3 sources in parallel
        const [usersResult, sessionCount, auditResult] = await Promise.allSettled([
          // 1. Users + tier breakdown via HMAC proxy (Vibe collection query)
          vibeServiceRequest<any>('/v1/collections/vibe_app/tables/users/query', {
            method: 'POST',
            body: { page: 1, pageSize: 500, orderBy: 'created_at', orderDirection: 'desc' },
          }),

          // 2. Active sessions from Redis
          (async () => {
            const redis = getRedis();
            const sessionPrefix = getSessionPrefix();
            const sessionKeys: string[] = [];
            let cursor = '0';
            do {
              const [newCursor, keys] = await redis.scan(cursor, 'MATCH', `${sessionPrefix}*`, 'COUNT', 100);
              cursor = newCursor;
              sessionKeys.push(...keys.filter((k: string) => !k.includes(':ver:')));
            } while (cursor !== '0');
            return sessionKeys.length;
          })(),

          // 3. Recent audit activity via HMAC proxy
          vibeServiceRequest<any>('/v1/audit?pageSize=10&sortDir=desc', { method: 'GET' }),
        ]);

        // Parse users — deduplicate by user_id
        let totalUsers = 0;
        let tierBreakdown: Record<string, number> = {};
        if (usersResult.status === 'fulfilled' && usersResult.value.ok && usersResult.value.data) {
          const data = usersResult.value.data;
          const rawUsers = data.data || data.documents || data.users || [];

          // Deduplicate by user_id (keeps latest document_id)
          const userMap = new Map();
          for (const u of rawUsers) {
            const uid = u.user_id || u.id || u.document_id;
            const existing = userMap.get(uid);
            if (!existing || (u.document_id || '') > (existing.document_id || '')) {
              userMap.set(uid, u);
            }
          }
          const uniqueUsers = Array.from(userMap.values());
          totalUsers = uniqueUsers.length;

          // Build tier breakdown from deduplicated users (unless API provides one)
          tierBreakdown = data.tierBreakdown || data.tiers || {};
          if (Object.keys(tierBreakdown).length === 0) {
            for (const user of uniqueUsers) {
              const tier = user.tier || 'free';
              tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
            }
          }
        }

        // Parse active sessions count
        let activeSessions = 0;
        if (sessionCount.status === 'fulfilled') {
          activeSessions = sessionCount.value;
        }

        // Parse audit events for recent activity
        let recentActivity: any[] = [];
        if (auditResult.status === 'fulfilled' && auditResult.value.ok && auditResult.value.data) {
          const data = auditResult.value.data;

          // Handle multiple possible response shapes
          let events: any[] = [];
          if (Array.isArray(data)) {
            events = data;
          } else if (Array.isArray(data.data)) {
            events = data.data;
          } else if (Array.isArray(data.entries)) {
            events = data.entries;
          } else if (Array.isArray(data.items)) {
            events = data.items;
          } else if (Array.isArray(data.documents)) {
            events = data.documents;
          } else if (data.success && Array.isArray(data.results)) {
            events = data.results;
          }

          recentActivity = events.slice(0, 5).map((e: any) => ({
            id: e.audit_log_id || e.id || e.document_id,
            type: e.category || e.type || 'admin',
            action: e.action || e.event || e.message || 'Unknown action',
            actor: e.admin_email || e.actor || e.user || e.actor_email || 'System',
            target: e.target_type ? `${e.target_type}:${e.target_id}` : (e.target || e.target_user),
            details: e.description || e.details,
            timestamp: e.created_at || e.timestamp || e.date,
            success: e.is_success ?? e.success ?? true,
          }));
        }

        // Calculate tier percentages
        const tiers = Object.entries(tierBreakdown).map(([name, count]) => ({
          name,
          count: count as number,
          pct: totalUsers > 0 ? Math.round(((count as number) / totalUsers) * 100) : 0,
        }));

        return NextResponse.json({
          totalUsers,
          activeSessions,
          tiers,
          recentActivity,
        });
      } catch (error: any) {
        console.error('[admin/stats] Error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal error' },
          { status: 500 }
        );
      }
    },
  };
}
