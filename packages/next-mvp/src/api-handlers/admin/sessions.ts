/**
 * Admin Sessions API Handler
 *
 * Provides admin-level access to login sessions using service account credentials.
 * Used by SessionsTab component.
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

/**
 * Check if the current user has admin role
 */
async function checkAdminRole(getAuthOptions: () => Promise<any>): Promise<{ isAdmin: boolean; userId?: number; error?: NextResponse }> {
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

  return { isAdmin: true, userId: session.user?.id };
}

/**
 * Make a service account request to Vibe (admin mode)
 */
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

    if (res.status === 204) {
      return { ok: true, status: 204, data: null };
    }

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

// Country code to flag emoji mapping
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export interface AdminSessionsHandlerConfig {
  getAuthOptions: () => Promise<any>;
}

/**
 * GET /api/admin/sessions - List sessions
 * POST /api/admin/sessions - Stats, revoke actions
 */
export function createSessionsHandler(config: AdminSessionsHandlerConfig) {
  return {
    async GET(request: NextRequest) {
      const adminCheck = await checkAdminRole(config.getAuthOptions);
      if (adminCheck.error) return adminCheck.error;

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const email = searchParams.get('email');

      // Build query for login_sessions table
      const queryBody: any = {
        page: 1,
        pageSize: 100,
        orderBy: 'created_at',
        orderDirection: 'desc',
      };

      // Build filter conditions
      const conditions: any[] = [];
      if (status && status !== 'all') {
        conditions.push({ field: 'status', operator: 'eq', value: status });
      }
      if (email) {
        conditions.push({ field: 'email', operator: 'like', value: `%${email}%` });
      }

      if (conditions.length === 1) {
        queryBody.filter = conditions[0];
      } else if (conditions.length > 1) {
        queryBody.filter = { operator: 'and', conditions };
      }

      const result = await vibeServiceRequest<any>(
        '/v1/collections/vibe_app/tables/login_sessions/query',
        { method: 'POST', body: queryBody }
      );

      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status || 500 });
      }

      // Extract sessions from response
      const rawSessions = result.data?.data || result.data?.documents || [];
      const sessions = rawSessions.map((s: any) => ({
        id: s.id || s.document_id,
        idp_user_id: s.idp_user_id || s.user_id,
        email: s.email || '',
        name: s.name || s.display_name || '',
        status: s.status || 'active',
        ip_address: s.ip_address || s.ip,
        city: s.city,
        region: s.region,
        country_code: s.country_code || s.country,
        device_type: s.device_type || s.device,
        browser: s.browser,
        os: s.os,
        created_at: s.created_at,
        last_activity: s.last_activity || s.updated_at,
        revoked_at: s.revoked_at,
        revoked_by: s.revoked_by,
        country_flag: getCountryFlag(s.country_code || s.country || ''),
      }));

      return NextResponse.json({ sessions });
    },

    async POST(request: NextRequest) {
      const adminCheck = await checkAdminRole(config.getAuthOptions);
      if (adminCheck.error) return adminCheck.error;

      const body = await request.json();
      const { action, sessionId, userId } = body;

      if (action === 'stats') {
        // Get all sessions for stats calculation
        const result = await vibeServiceRequest<any>(
          '/v1/collections/vibe_app/tables/login_sessions/query',
          { method: 'POST', body: { page: 1, pageSize: 1000 } }
        );

        if (!result.ok) {
          return NextResponse.json({ error: result.error }, { status: result.status || 500 });
        }

        const sessions = result.data?.data || result.data?.documents || [];

        // Calculate stats
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const stats = {
          totalActive: sessions.filter((s: any) => s.status === 'active').length,
          totalRevoked: sessions.filter((s: any) => s.status === 'revoked').length,
          uniqueUsers: new Set(sessions.map((s: any) => s.idp_user_id || s.user_id)).size,
          recentLogins: sessions.filter((s: any) => new Date(s.created_at) > oneDayAgo).length,
          byCountryWithFlags: {} as Record<string, { count: number; flag: string }>,
          byDevice: {} as Record<string, number>,
        };

        // Count by country
        sessions.forEach((s: any) => {
          const country = s.country_code || s.country || 'Unknown';
          if (!stats.byCountryWithFlags[country]) {
            stats.byCountryWithFlags[country] = { count: 0, flag: getCountryFlag(country) };
          }
          stats.byCountryWithFlags[country].count++;

          const device = s.device_type || s.device || 'Unknown';
          stats.byDevice[device] = (stats.byDevice[device] || 0) + 1;
        });

        return NextResponse.json({ stats });
      }

      if (action === 'revoke' && sessionId) {
        // Revoke single session
        const result = await vibeServiceRequest<any>(
          `/v1/collections/vibe_app/tables/login_sessions/${sessionId}`,
          {
            method: 'PUT',
            body: {
              status: 'revoked',
              revoked_at: new Date().toISOString(),
              revoked_by: `admin:${adminCheck.userId}`,
            },
          }
        );

        if (!result.ok) {
          return NextResponse.json({ error: result.error }, { status: result.status || 500 });
        }

        return NextResponse.json({ success: true });
      }

      if (action === 'revoke_all' && userId) {
        // Get all active sessions for user
        const queryResult = await vibeServiceRequest<any>(
          '/v1/collections/vibe_app/tables/login_sessions/query',
          {
            method: 'POST',
            body: {
              filter: {
                operator: 'and',
                conditions: [
                  { field: 'idp_user_id', operator: 'eq', value: userId },
                  { field: 'status', operator: 'eq', value: 'active' },
                ],
              },
            },
          }
        );

        if (!queryResult.ok) {
          return NextResponse.json({ error: queryResult.error }, { status: queryResult.status || 500 });
        }

        const sessions = queryResult.data?.data || queryResult.data?.documents || [];
        let revokedCount = 0;

        // Revoke each session
        for (const session of sessions) {
          const id = session.id || session.document_id;
          const result = await vibeServiceRequest<any>(
            `/v1/collections/vibe_app/tables/login_sessions/${id}`,
            {
              method: 'PUT',
              body: {
                status: 'revoked',
                revoked_at: new Date().toISOString(),
                revoked_by: `admin:${adminCheck.userId}`,
              },
            }
          );
          if (result.ok) revokedCount++;
        }

        return NextResponse.json({ success: true, revokedCount });
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    },
  };
}
