/**
 * Admin Audit Logs API Handler
 *
 * Provides admin-level access to audit logs using service account credentials.
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getStartupIDPConfig } from '../../lib/startup-init';
import { ADMIN_ROLES, hasAnyRole } from '../../lib/roles';

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

  // Get the numeric client ID from startup config for multi-client admin support
  const idpConfig = getStartupIDPConfig();
  const numericClientId = idpConfig?.clientId;

  try {
    const res = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Vibe-Client-Id': clientId,
        'X-Vibe-Timestamp': String(timestamp),
        'X-Vibe-Signature': signature,
        ...(numericClientId && { 'X-Client-Id': String(numericClientId) }),
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

export interface AdminAuditHandlerConfig {
  getAuthOptions: () => Promise<any>;
}

/**
 * GET /api/admin/audit - List audit logs
 * POST /api/admin/audit - Stats
 */
export function createAuditHandler(config: AdminAuditHandlerConfig) {
  return {
    async GET(request: NextRequest) {
      const adminCheck = await checkAdminRole(config.getAuthOptions);
      if (adminCheck.error) return adminCheck.error;

      const { searchParams } = new URL(request.url);
      const action = searchParams.get('action');
      const userId = searchParams.get('userId');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '50');

      const queryBody: any = {
        page,
        pageSize,
        orderBy: 'created_at',
        orderDirection: 'desc',
      };

      const conditions: any[] = [];
      if (action) {
        conditions.push({ field: 'action', operator: 'eq', value: action });
      }
      if (userId) {
        conditions.push({ field: 'user_id', operator: 'eq', value: userId });
      }
      if (startDate) {
        conditions.push({ field: 'created_at', operator: 'gte', value: startDate });
      }
      if (endDate) {
        conditions.push({ field: 'created_at', operator: 'lte', value: endDate });
      }

      if (conditions.length === 1) {
        queryBody.filter = conditions[0];
      } else if (conditions.length > 1) {
        queryBody.filter = { operator: 'and', conditions };
      }

      const result = await vibeServiceRequest<any>(
        '/v1/collections/vibe_app/tables/audit_logs/query',
        { method: 'POST', body: queryBody }
      );

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status || 500 });
      }

      const rawLogs = result.data?.data || result.data?.documents || [];
      const logs = rawLogs.map((log: any) => ({
        id: log.id || log.document_id,
        user_id: log.user_id || log.idp_user_id,
        email: log.email,
        action: log.action,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
      }));

      return NextResponse.json({
        logs,
        meta: result.data?.meta || { total: logs.length, page, pageSize },
      });
    },

    async POST(request: NextRequest) {
      const adminCheck = await checkAdminRole(config.getAuthOptions);
      if (adminCheck.error) return adminCheck.error;

      const body = await request.json();
      const { action } = body;

      if (action === 'stats') {
        const result = await vibeServiceRequest<any>(
          '/v1/collections/vibe_app/tables/audit_logs/query',
          { method: 'POST', body: { page: 1, pageSize: 10000 } }
        );

        if (!result.ok) {
          return NextResponse.json({ error: result.error }, { status: result.status || 500 });
        }

        const logs = result.data?.data || result.data?.documents || [];
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const stats = {
          total: logs.length,
          today: logs.filter((l: any) => new Date(l.created_at) > oneDayAgo).length,
          thisWeek: logs.filter((l: any) => new Date(l.created_at) > oneWeekAgo).length,
          uniqueUsers: new Set(logs.map((l: any) => l.user_id || l.idp_user_id)).size,
          byAction: {} as Record<string, number>,
          byResourceType: {} as Record<string, number>,
        };

        logs.forEach((l: any) => {
          const act = l.action || 'unknown';
          stats.byAction[act] = (stats.byAction[act] || 0) + 1;

          const rt = l.resource_type || 'unknown';
          stats.byResourceType[rt] = (stats.byResourceType[rt] || 0) + 1;
        });

        return NextResponse.json({ stats });
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    },
  };
}
