"use strict";
/**
 * Admin Users API Handler
 *
 * Provides admin-level access to users using service account credentials.
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
exports.createUsersHandler = createUsersHandler;
const server_1 = require("next/server");
const auth_1 = require("../../server/auth");
const startup_init_1 = require("../../lib/startup-init");
const roles_1 = require("../../lib/roles");
async function checkAdminRole(request) {
    const session = await (0, auth_1.getSession)(request);
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
 * GET /api/admin/users - List users
 * POST /api/admin/users - Stats, search, update tier
 */
function createUsersHandler(config) {
    return {
        async GET(request) {
            const adminCheck = await checkAdminRole(request);
            if (adminCheck.error)
                return adminCheck.error;
            const { searchParams } = new URL(request.url);
            const search = searchParams.get('search');
            const tier = searchParams.get('tier');
            const page = parseInt(searchParams.get('page') || '1');
            const pageSize = parseInt(searchParams.get('pageSize') || '50');
            const queryBody = {
                page,
                pageSize,
                orderBy: 'created_at',
                orderDirection: 'desc',
            };
            const conditions = [];
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
            }
            else if (conditions.length > 1) {
                queryBody.filter = { operator: 'and', conditions };
            }
            const result = await vibeServiceRequest('/v1/collections/vibe_app/tables/users/query', { method: 'POST', body: queryBody });
            if (!result.ok) {
                return server_1.NextResponse.json({ error: result.error }, { status: result.status || 500 });
            }
            const rawUsers = result.data?.data || result.data?.documents || [];
            const users = rawUsers.map((u) => ({
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
            return server_1.NextResponse.json({
                users,
                meta: result.data?.meta || { total: users.length, page, pageSize },
            });
        },
        async POST(request) {
            const adminCheck = await checkAdminRole(request);
            if (adminCheck.error)
                return adminCheck.error;
            const body = await request.json();
            const { action, userId, tier, credits } = body;
            if (action === 'stats') {
                const result = await vibeServiceRequest('/v1/collections/vibe_app/tables/users/query', { method: 'POST', body: { page: 1, pageSize: 10000 } });
                if (!result.ok) {
                    return server_1.NextResponse.json({ error: result.error }, { status: result.status || 500 });
                }
                const users = result.data?.data || result.data?.documents || [];
                const now = new Date();
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const stats = {
                    total: users.length,
                    active: users.filter((u) => u.status === 'active').length,
                    newToday: users.filter((u) => new Date(u.created_at) > oneDayAgo).length,
                    newThisWeek: users.filter((u) => new Date(u.created_at) > oneWeekAgo).length,
                    byTier: {},
                };
                users.forEach((u) => {
                    const t = u.tier || 'free';
                    stats.byTier[t] = (stats.byTier[t] || 0) + 1;
                });
                return server_1.NextResponse.json({ stats });
            }
            if (action === 'update_tier' && userId && tier) {
                const result = await vibeServiceRequest(`/v1/collections/vibe_app/tables/users/${userId}`, { method: 'PUT', body: { tier } });
                if (!result.ok) {
                    return server_1.NextResponse.json({ error: result.error }, { status: result.status || 500 });
                }
                return server_1.NextResponse.json({ success: true });
            }
            if (action === 'update_credits' && userId && credits !== undefined) {
                const result = await vibeServiceRequest(`/v1/collections/vibe_app/tables/users/${userId}`, { method: 'PUT', body: { credits } });
                if (!result.ok) {
                    return server_1.NextResponse.json({ error: result.error }, { status: result.status || 500 });
                }
                return server_1.NextResponse.json({ success: true });
            }
            return server_1.NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        },
    };
}
