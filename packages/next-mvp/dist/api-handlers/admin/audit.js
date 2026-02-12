"use strict";
/**
 * Admin Audit Logs API Handler
 *
 * Provides admin-level access to audit logs using service account credentials.
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
exports.createAuditHandler = createAuditHandler;
const server_1 = require("next/server");
const next_auth_1 = require("next-auth");
const startup_init_1 = require("../../lib/startup-init");
const roles_1 = require("../../lib/roles");
async function checkAdminRole(getAuthOptions) {
    const authOptions = await getAuthOptions();
    const session = await (0, next_auth_1.getServerSession)(authOptions);
    if (!session?.user) {
        return {
            isAdmin: false,
            error: server_1.NextResponse.json({ success: false, error: 'Please sign in' }, { status: 401 }),
        };
    }
    const userRoles = session.user?.roles || [];
    const hasAdminRole = roles_1.ADMIN_ROLES.some(role => userRoles.includes(role));
    if (!hasAdminRole) {
        return {
            isAdmin: false,
            error: server_1.NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 }),
        };
    }
    return { isAdmin: true };
}
async function vibeServiceRequest(endpoint, options) {
    const idpUrl = process.env.NEXT_PUBLIC_IDP_URL || process.env.IDP_URL;
    const clientId = process.env.VIBE_CLIENT_ID;
    const signingKey = process.env.VIBE_HMAC_KEY;
    if (!idpUrl || !clientId || !signingKey) {
        return { ok: false, status: 500, data: null, error: 'Vibe not configured' };
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `${timestamp}|${options.method}|${endpoint}`;
    const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
    const signature = crypto
        .createHmac('sha256', Buffer.from(signingKey, 'base64'))
        .update(stringToSign)
        .digest('base64');
    const proxyUrl = `${idpUrl}/api/vibe/proxy`;
    // Get the client slug from startup config for multi-client admin support
    const idpConfig = (0, startup_init_1.getStartupIDPConfig)();
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
        if (res.status === 204)
            return { ok: true, status: 204, data: null };
        if (!res.ok) {
            const errorText = await res.text();
            return { ok: false, status: res.status, data: null, error: errorText };
        }
        const body = await res.json();
        return { ok: true, status: res.status, data: body };
    }
    catch (error) {
        return { ok: false, status: 0, data: null, error: String(error) };
    }
}
/**
 * GET /api/admin/audit - List audit logs
 * POST /api/admin/audit - Stats
 */
function createAuditHandler(config) {
    return {
        async GET(request) {
            const adminCheck = await checkAdminRole(config.getAuthOptions);
            if (adminCheck.error)
                return adminCheck.error;
            const { searchParams } = new URL(request.url);
            const action = searchParams.get('action');
            const userId = searchParams.get('userId');
            const startDate = searchParams.get('startDate');
            const endDate = searchParams.get('endDate');
            const page = parseInt(searchParams.get('page') || '1');
            const pageSize = parseInt(searchParams.get('pageSize') || '50');
            const queryBody = {
                page,
                pageSize,
                orderBy: 'created_at',
                orderDirection: 'desc',
            };
            const conditions = [];
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
            }
            else if (conditions.length > 1) {
                queryBody.filter = { operator: 'and', conditions };
            }
            const result = await vibeServiceRequest('/v1/collections/vibe_app/tables/audit_logs/query', { method: 'POST', body: queryBody });
            if (!result.ok) {
                return server_1.NextResponse.json({ error: result.error }, { status: result.status || 500 });
            }
            const rawLogs = result.data?.data || result.data?.documents || [];
            const logs = rawLogs.map((log) => ({
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
            return server_1.NextResponse.json({
                logs,
                meta: result.data?.meta || { total: logs.length, page, pageSize },
            });
        },
        async POST(request) {
            const adminCheck = await checkAdminRole(config.getAuthOptions);
            if (adminCheck.error)
                return adminCheck.error;
            const body = await request.json();
            const { action } = body;
            if (action === 'stats') {
                const result = await vibeServiceRequest('/v1/collections/vibe_app/tables/audit_logs/query', { method: 'POST', body: { page: 1, pageSize: 10000 } });
                if (!result.ok) {
                    return server_1.NextResponse.json({ error: result.error }, { status: result.status || 500 });
                }
                const logs = result.data?.data || result.data?.documents || [];
                const now = new Date();
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const stats = {
                    total: logs.length,
                    today: logs.filter((l) => new Date(l.created_at) > oneDayAgo).length,
                    thisWeek: logs.filter((l) => new Date(l.created_at) > oneWeekAgo).length,
                    uniqueUsers: new Set(logs.map((l) => l.user_id || l.idp_user_id)).size,
                    byAction: {},
                    byResourceType: {},
                };
                logs.forEach((l) => {
                    const act = l.action || 'unknown';
                    stats.byAction[act] = (stats.byAction[act] || 0) + 1;
                    const rt = l.resource_type || 'unknown';
                    stats.byResourceType[rt] = (stats.byResourceType[rt] || 0) + 1;
                });
                return server_1.NextResponse.json({ stats });
            }
            return server_1.NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        },
    };
}
