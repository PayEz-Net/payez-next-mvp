/**
 * Admin Users API Handler
 *
 * Provides admin-level access to users using service account credentials.
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../server/auth';
import { getStartupIDPConfig } from '../../lib/startup-init';
import { ADMIN_ROLES, hasAnyRole } from '../../lib/roles';

interface VibeRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

async function checkAdminRole(request: NextRequest): Promise<{ isAdmin: boolean; error?: NextResponse }> {
  const session = await getSession(request) as any;

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

  // Get the client slug from startup config for multi-client admin support
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

export interface AdminUsersHandlerConfig {
}

/**
 * GET /api/admin/users - List users
 * POST /api/admin/users - Stats, search, update tier
 */
export function createUsersHandler(config: AdminUsersHandlerConfig) {
  return {
    async GET(request: NextRequest) {
      const adminCheck = await checkAdminRole(request);
      if (adminCheck.error) return adminCheck.error;

      const { searchParams } = new URL(request.url);
      const search = searchParams.get('search');
      const tier = searchParams.get('tier');
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '50');

      const queryBody: any = {
        page,
        pageSize,
        orderBy: 'created_at',
        orderDirection: 'desc',
      };

      const conditions: any[] = [];
      if (search) {
        conditions.push({
          operator: 'or',
          conditions: [
            { field: 'email', operator: 'like', value: `%${search}%` },
            { field: 'display_name', operator: 'like', value: `%${search}%` },
          ],
        });
      }
      if (tier) {
        conditions.push({ field: 'tier', operator: 'eq', value: tier });
      }

      if (conditions.length === 1) {
        queryBody.filter = conditions[0];
      } else if (conditions.length > 1) {
        queryBody.filter = { operator: 'and', conditions };
      }

      const result = await vibeServiceRequest<any>(
        '/v1/collections/vibe_app/tables/users/query',
        { method: 'POST', body: queryBody }
      );

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status || 500 });
      }

      const rawUsers = result.data?.data || result.data?.documents || [];
      const users = rawUsers.map((u: any) => ({
        id: u.id || u.document_id,
        idp_user_id: u.idp_user_id,
        email: u.email,
        display_name: u.display_name || u.name,
        tier: u.tier || 'free',
        credits: u.credits || 0,
        status: u.status || 'active',
        created_at: u.created_at,
        last_login: u.last_login || u.updated_at,
      }));

      return NextResponse.json({
        users,
        meta: result.data?.meta || { total: users.length, page, pageSize },
      });
    },

    async POST(request: NextRequest) {
      const adminCheck = await checkAdminRole(request);
      if (adminCheck.error) return adminCheck.error;

      const body = await request.json();
      const { action, userId, tier, credits } = body;

      if (action === 'stats') {
        const result = await vibeServiceRequest<any>(
          '/v1/collections/vibe_app/tables/users/query',
          { method: 'POST', body: { page: 1, pageSize: 10000 } }
        );

        if (!result.ok) {
          return NextResponse.json({ error: result.error }, { status: result.status || 500 });
        }

        const users = result.data?.data || result.data?.documents || [];
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const stats = {
          total: users.length,
          active: users.filter((u: any) => u.status === 'active').length,
          newToday: users.filter((u: any) => new Date(u.created_at) > oneDayAgo).length,
          newThisWeek: users.filter((u: any) => new Date(u.created_at) > oneWeekAgo).length,
          byTier: {} as Record<string, number>,
        };

        users.forEach((u: any) => {
          const t = u.tier || 'free';
          stats.byTier[t] = (stats.byTier[t] || 0) + 1;
        });

        return NextResponse.json({ stats });
      }

      if (action === 'update_tier' && userId && tier) {
        const result = await vibeServiceRequest<any>(
          `/v1/collections/vibe_app/tables/users/${userId}`,
          { method: 'PUT', body: { tier } }
        );

        if (!result.ok) {
          return NextResponse.json({ error: result.error }, { status: result.status || 500 });
        }

        return NextResponse.json({ success: true });
      }

      if (action === 'update_credits' && userId && credits !== undefined) {
        const result = await vibeServiceRequest<any>(
          `/v1/collections/vibe_app/tables/users/${userId}`,
          { method: 'PUT', body: { credits } }
        );

        if (!result.ok) {
          return NextResponse.json({ error: result.error }, { status: result.status || 500 });
        }

        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    },
  };
}
