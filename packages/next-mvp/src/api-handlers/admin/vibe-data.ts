/**
 * Admin Vibe Data API Handler
 *
 * Provides admin-level access to Vibe data using service account credentials.
 * Bypasses user-level filtering to allow admins to view all records.
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
async function checkAdminRole(getAuthOptions: () => Promise<any>): Promise<{ isAdmin: boolean; error?: NextResponse }> {
  const authOptions = await getAuthOptions();
  const session = await getServerSession(authOptions) as any;

  if (!session?.user) {
    return {
      isAdmin: false,
      error: NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } },
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
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      ),
    };
  }

  return { isAdmin: true };
}

/**
 * Make a service account request to Vibe (admin mode - no user filtering)
 */
async function vibeServiceRequest<T = unknown>(
  endpoint: string,
  options: VibeRequestOptions
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const idpUrl = process.env.NEXT_PUBLIC_IDP_URL || process.env.IDP_URL;
  const clientId = process.env.VIBE_CLIENT_ID;
  const signingKey = process.env.VIBE_HMAC_KEY;

  if (!idpUrl || !clientId || !signingKey) {
    console.error('[Admin Vibe] Missing config:', { idpUrl: !!idpUrl, clientId: !!clientId, signingKey: !!signingKey });
    return { ok: false, status: 500, data: null, error: 'Vibe not configured' };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const stringToSign = `${timestamp}|${options.method}|${endpoint}`;

  // Generate HMAC signature
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
        // For multi-client admins: specify which client context to use
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
      console.error(`[Admin Vibe] Request failed: ${options.method} ${endpoint} - ${res.status}`, errorText);
      return { ok: false, status: res.status, data: null, error: errorText };
    }

    const body = await res.json();
    return { ok: true, status: res.status, data: body };
  } catch (error) {
    console.error(`[Admin Vibe] Request exception: ${options.method} ${endpoint}`, error);
    return { ok: false, status: 0, data: null, error: String(error) };
  }
}

// =============================================================================
// EXPORTED HANDLERS
// =============================================================================

export interface AdminVibeHandlerConfig {
  getAuthOptions: () => Promise<any>;
}

/**
 * GET /api/admin/vibe/collections
 * List all Vibe collections
 */
export function createGetCollectionsHandler(config: AdminVibeHandlerConfig) {
  return async function GET(request: NextRequest) {
    const adminCheck = await checkAdminRole(config.getAuthOptions);
    if (adminCheck.error) return adminCheck.error;

    const result = await vibeServiceRequest<any>('/v1/collections', { method: 'GET' });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: result.error } },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json(result.data);
  };
}

/**
 * GET /api/admin/vibe/collections/[collection]/tables
 * List tables in a collection
 */
export function createGetTablesHandler(config: AdminVibeHandlerConfig) {
  return async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ collection: string }> }
  ) {
    const { collection } = await params;
    const adminCheck = await checkAdminRole(config.getAuthOptions);
    if (adminCheck.error) return adminCheck.error;

    const result = await vibeServiceRequest<any>(`/v1/collections/${collection}/tables`, { method: 'GET' });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: result.error } },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json(result.data);
  };
}

/**
 * GET /api/admin/vibe/data/[collection]/[table]
 * Fetch all records from a table (admin - no user filtering)
 */
export function createGetTableDataHandler(config: AdminVibeHandlerConfig) {
  return async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ collection: string; table: string }> }
  ) {
    const { collection, table } = await params;
    const adminCheck = await checkAdminRole(config.getAuthOptions);
    if (adminCheck.error) return adminCheck.error;

    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';
    const endpoint = `/v1/collections/${collection}/tables/${table}${queryString}`;

    const result = await vibeServiceRequest<any>(endpoint, { method: 'GET' });

    if (result.status === 204) {
      return NextResponse.json({ data: [], meta: { total: 0, limit: 50, offset: 0 } });
    }

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: result.error } },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json(result.data);
  };
}

/**
 * GET /api/admin/vibe/data/[collection]/[table]/[id]
 * Fetch single record (admin access)
 */
export function createGetRecordHandler(config: AdminVibeHandlerConfig) {
  return async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ collection: string; table: string; id: string }> }
  ) {
    const { collection, table, id } = await params;
    const adminCheck = await checkAdminRole(config.getAuthOptions);
    if (adminCheck.error) return adminCheck.error;

    const endpoint = `/v1/collections/${collection}/tables/${table}/${id}`;
    const result = await vibeServiceRequest<any>(endpoint, { method: 'GET' });

    if (!result.ok) {
      const status = result.status === 404 ? 404 : result.status || 500;
      return NextResponse.json(
        { success: false, error: { code: result.status === 404 ? 'NOT_FOUND' : 'FETCH_ERROR', message: result.error } },
        { status }
      );
    }

    return NextResponse.json(result.data);
  };
}

/**
 * PUT /api/admin/vibe/data/[collection]/[table]/[id]
 * Update record (admin access)
 */
export function createUpdateRecordHandler(config: AdminVibeHandlerConfig) {
  return async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ collection: string; table: string; id: string }> }
  ) {
    const { collection, table, id } = await params;
    const adminCheck = await checkAdminRole(config.getAuthOptions);
    if (adminCheck.error) return adminCheck.error;

    const body = await request.json();
    const endpoint = `/v1/collections/${collection}/tables/${table}/${id}`;
    const result = await vibeServiceRequest<any>(endpoint, { method: 'PUT', body });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_ERROR', message: result.error } },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json(result.data);
  };
}

/**
 * DELETE /api/admin/vibe/data/[collection]/[table]/[id]
 * Delete record (admin access)
 */
export function createDeleteRecordHandler(config: AdminVibeHandlerConfig) {
  return async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ collection: string; table: string; id: string }> }
  ) {
    const { collection, table, id } = await params;
    const adminCheck = await checkAdminRole(config.getAuthOptions);
    if (adminCheck.error) return adminCheck.error;

    const endpoint = `/v1/collections/${collection}/tables/${table}/${id}`;
    const result = await vibeServiceRequest<any>(endpoint, { method: 'DELETE' });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'DELETE_ERROR', message: result.error } },
        { status: result.status || 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  };
}

/**
 * POST /api/admin/vibe/data/[collection]/[table]/query
 * Query records with filters (admin access)
 */
export function createQueryHandler(config: AdminVibeHandlerConfig) {
  return async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ collection: string; table: string }> }
  ) {
    const { collection, table } = await params;
    const adminCheck = await checkAdminRole(config.getAuthOptions);
    if (adminCheck.error) return adminCheck.error;

    const body = await request.json();
    const endpoint = `/v1/collections/${collection}/tables/${table}/query`;
    const result = await vibeServiceRequest<any>(endpoint, { method: 'POST', body });

    if (result.status === 204) {
      return NextResponse.json({ data: [], meta: { total: 0, page: 1, pageSize: 20 } });
    }

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: { code: 'QUERY_ERROR', message: result.error } },
        { status: result.status || 500 }
      );
    }

    return NextResponse.json(result.data);
  };
}
