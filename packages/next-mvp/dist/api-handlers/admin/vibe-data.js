"use strict";
/**
 * Admin Vibe Data API Handler
 *
 * Provides admin-level access to Vibe data using service account credentials.
 * Bypasses user-level filtering to allow admins to view all records.
 *
 * @version 1.0
 * @requires Admin role (vibe_app_admin or payez_admin)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGetCollectionsHandler = createGetCollectionsHandler;
exports.createGetTablesHandler = createGetTablesHandler;
exports.createGetTableDataHandler = createGetTableDataHandler;
exports.createGetRecordHandler = createGetRecordHandler;
exports.createUpdateRecordHandler = createUpdateRecordHandler;
exports.createDeleteRecordHandler = createDeleteRecordHandler;
exports.createQueryHandler = createQueryHandler;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const startup_init_1 = require("../../lib/startup-init");
const roles_1 = require("../../lib/roles");
/**
 * Check if the current user has admin role
 */
async function checkAdminRole(getAuthOptions) {
    const authOptions = await getAuthOptions();
    const session = await (0, next_auth_1.getServerSession)(authOptions);
    if (!session?.user) {
        return {
            isAdmin: false,
            error: server_1.NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Please sign in' } }, { status: 401 }),
        };
    }
    const userRoles = session.user?.roles || [];
    const hasAdminRole = roles_1.ADMIN_ROLES.some(role => userRoles.includes(role));
    if (!hasAdminRole) {
        return {
            isAdmin: false,
            error: server_1.NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 }),
        };
    }
    return { isAdmin: true };
}
/**
 * Make a service account request to Vibe (admin mode - no user filtering)
 */
async function vibeServiceRequest(endpoint, options) {
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
    const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
    const signature = crypto
        .createHmac('sha256', Buffer.from(signingKey, 'base64'))
        .update(stringToSign)
        .digest('base64');
    const proxyUrl = `${idpUrl}/api/vibe/proxy`;
    // Get the numeric client ID from startup config for multi-client admin support
    const idpConfig = (0, startup_init_1.getStartupIDPConfig)();
    const numericClientId = idpConfig?.clientId;
    try {
        const res = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Vibe-Client-Id': clientId,
                'X-Vibe-Timestamp': String(timestamp),
                'X-Vibe-Signature': signature,
                // For multi-client admins: specify which client context to use
                ...(numericClientId && { 'X-Client-Id': String(numericClientId) }),
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
    }
    catch (error) {
        console.error(`[Admin Vibe] Request exception: ${options.method} ${endpoint}`, error);
        return { ok: false, status: 0, data: null, error: String(error) };
    }
}
/**
 * GET /api/admin/vibe/collections
 * List all Vibe collections
 */
function createGetCollectionsHandler(config) {
    return async function GET(request) {
        const adminCheck = await checkAdminRole(config.getAuthOptions);
        if (adminCheck.error)
            return adminCheck.error;
        const result = await vibeServiceRequest('/v1/collections', { method: 'GET' });
        if (!result.ok) {
            return server_1.NextResponse.json({ success: false, error: { code: 'FETCH_ERROR', message: result.error } }, { status: result.status || 500 });
        }
        return server_1.NextResponse.json(result.data);
    };
}
/**
 * GET /api/admin/vibe/collections/[collection]/tables
 * List tables in a collection
 */
function createGetTablesHandler(config) {
    return async function GET(request, { params }) {
        const { collection } = await params;
        const adminCheck = await checkAdminRole(config.getAuthOptions);
        if (adminCheck.error)
            return adminCheck.error;
        const result = await vibeServiceRequest(`/v1/collections/${collection}/tables`, { method: 'GET' });
        if (!result.ok) {
            return server_1.NextResponse.json({ success: false, error: { code: 'FETCH_ERROR', message: result.error } }, { status: result.status || 500 });
        }
        return server_1.NextResponse.json(result.data);
    };
}
/**
 * GET /api/admin/vibe/data/[collection]/[table]
 * Fetch all records from a table (admin - no user filtering)
 */
function createGetTableDataHandler(config) {
    return async function GET(request, { params }) {
        const { collection, table } = await params;
        const adminCheck = await checkAdminRole(config.getAuthOptions);
        if (adminCheck.error)
            return adminCheck.error;
        const searchParams = request.nextUrl.searchParams.toString();
        const queryString = searchParams ? `?${searchParams}` : '';
        const endpoint = `/v1/collections/${collection}/tables/${table}${queryString}`;
        const result = await vibeServiceRequest(endpoint, { method: 'GET' });
        if (result.status === 204) {
            return server_1.NextResponse.json({ data: [], meta: { total: 0, limit: 50, offset: 0 } });
        }
        if (!result.ok) {
            return server_1.NextResponse.json({ success: false, error: { code: 'FETCH_ERROR', message: result.error } }, { status: result.status || 500 });
        }
        return server_1.NextResponse.json(result.data);
    };
}
/**
 * GET /api/admin/vibe/data/[collection]/[table]/[id]
 * Fetch single record (admin access)
 */
function createGetRecordHandler(config) {
    return async function GET(request, { params }) {
        const { collection, table, id } = await params;
        const adminCheck = await checkAdminRole(config.getAuthOptions);
        if (adminCheck.error)
            return adminCheck.error;
        const endpoint = `/v1/collections/${collection}/tables/${table}/${id}`;
        const result = await vibeServiceRequest(endpoint, { method: 'GET' });
        if (!result.ok) {
            const status = result.status === 404 ? 404 : result.status || 500;
            return server_1.NextResponse.json({ success: false, error: { code: result.status === 404 ? 'NOT_FOUND' : 'FETCH_ERROR', message: result.error } }, { status });
        }
        return server_1.NextResponse.json(result.data);
    };
}
/**
 * PUT /api/admin/vibe/data/[collection]/[table]/[id]
 * Update record (admin access)
 */
function createUpdateRecordHandler(config) {
    return async function PUT(request, { params }) {
        const { collection, table, id } = await params;
        const adminCheck = await checkAdminRole(config.getAuthOptions);
        if (adminCheck.error)
            return adminCheck.error;
        const body = await request.json();
        const endpoint = `/v1/collections/${collection}/tables/${table}/${id}`;
        const result = await vibeServiceRequest(endpoint, { method: 'PUT', body });
        if (!result.ok) {
            return server_1.NextResponse.json({ success: false, error: { code: 'UPDATE_ERROR', message: result.error } }, { status: result.status || 500 });
        }
        return server_1.NextResponse.json(result.data);
    };
}
/**
 * DELETE /api/admin/vibe/data/[collection]/[table]/[id]
 * Delete record (admin access)
 */
function createDeleteRecordHandler(config) {
    return async function DELETE(request, { params }) {
        const { collection, table, id } = await params;
        const adminCheck = await checkAdminRole(config.getAuthOptions);
        if (adminCheck.error)
            return adminCheck.error;
        const endpoint = `/v1/collections/${collection}/tables/${table}/${id}`;
        const result = await vibeServiceRequest(endpoint, { method: 'DELETE' });
        if (!result.ok) {
            return server_1.NextResponse.json({ success: false, error: { code: 'DELETE_ERROR', message: result.error } }, { status: result.status || 500 });
        }
        return new server_1.NextResponse(null, { status: 204 });
    };
}
/**
 * POST /api/admin/vibe/data/[collection]/[table]/query
 * Query records with filters (admin access)
 */
function createQueryHandler(config) {
    return async function POST(request, { params }) {
        const { collection, table } = await params;
        const adminCheck = await checkAdminRole(config.getAuthOptions);
        if (adminCheck.error)
            return adminCheck.error;
        const body = await request.json();
        const endpoint = `/v1/collections/${collection}/tables/${table}/query`;
        const result = await vibeServiceRequest(endpoint, { method: 'POST', body });
        if (result.status === 204) {
            return server_1.NextResponse.json({ data: [], meta: { total: 0, page: 1, pageSize: 20 } });
        }
        if (!result.ok) {
            return server_1.NextResponse.json({ success: false, error: { code: 'QUERY_ERROR', message: result.error } }, { status: result.status || 500 });
        }
        return server_1.NextResponse.json(result.data);
    };
}
