"use strict";
/**
 * Admin Stats API Handler
 *
 * Aggregates dashboard statistics from users, Redis sessions, and audit logs.
 * Uses service account HMAC auth for Vibe API requests.
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
exports.createStatsHandler = createStatsHandler;
const server_1 = require("next/server");
const auth_1 = require("../../server/auth");
const startup_init_1 = require("../../lib/startup-init");
const redis_1 = require("../../lib/redis");
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
 * GET /api/admin/stats - Dashboard statistics
 * Aggregates users + tier breakdown, active Redis sessions, and recent audit activity.
 */
function createStatsHandler(config) {
    const getSessionPrefix = () => {
        const appSlug = config.appSlug || process.env.APP_SLUG || process.env.CLIENT_ID || 'app';
        return `${appSlug}:sess:`;
    };
    return {
        async GET(_request) {
            const adminCheck = await checkAdminRole(_request);
            if (adminCheck.error)
                return adminCheck.error;
            try {
                // Fetch from 4 sources in parallel
                const [usersResult, tierDistributionResult, sessionCount, auditResult] = await Promise.allSettled([
                    // 1. Users count via HMAC proxy (Vibe collection query)
                    vibeServiceRequest('/v1/collections/vibe_app/tables/users/query', {
                        method: 'POST',
                        body: { page: 1, pageSize: 500, orderBy: 'created_at', orderDirection: 'desc' },
                    }),
                    // 2. Tier distribution from analytics endpoint (uses purchases table)
                    vibeServiceRequest('/v1/analytics/tier-distribution?includeTrend=false', { method: 'GET' }),
                    // 3. Active sessions from Redis
                    (async () => {
                        const redis = (0, redis_1.getRedis)();
                        const sessionPrefix = getSessionPrefix();
                        const sessionKeys = [];
                        let cursor = '0';
                        do {
                            const [newCursor, keys] = await redis.scan(cursor, 'MATCH', `${sessionPrefix}*`, 'COUNT', 100);
                            cursor = newCursor;
                            sessionKeys.push(...keys.filter((k) => !k.includes(':ver:')));
                        } while (cursor !== '0');
                        return sessionKeys.length;
                    })(),
                    // 4. Recent audit activity via HMAC proxy
                    vibeServiceRequest('/v1/audit?pageSize=10&sortDir=desc', { method: 'GET' }),
                ]);
                // Parse users — deduplicate by user_id
                let totalUsers = 0;
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
                    totalUsers = userMap.size;
                }
                // Parse tier distribution from analytics endpoint (uses purchases table)
                let tierBreakdown = {};
                if (tierDistributionResult.status === 'fulfilled' && tierDistributionResult.value.ok && tierDistributionResult.value.data) {
                    const data = tierDistributionResult.value.data;
                    // Handle response shape: { distribution: [{ tierKey, userCount }, ...] }
                    const distribution = data.distribution || data.data || data.tiers || [];
                    if (Array.isArray(distribution)) {
                        for (const item of distribution) {
                            const tierKey = item.tierKey || item.tier || item.name || 'free';
                            const count = item.userCount || item.count || item.users || 0;
                            tierBreakdown[tierKey] = (tierBreakdown[tierKey] || 0) + count;
                        }
                    }
                }
                // Fallback: if no tier data from analytics, show all as free
                if (Object.keys(tierBreakdown).length === 0) {
                    tierBreakdown = { free: totalUsers };
                }
                // Parse active sessions count
                let activeSessions = 0;
                if (sessionCount.status === 'fulfilled') {
                    activeSessions = sessionCount.value;
                }
                // Parse audit events for recent activity
                let recentActivity = [];
                if (auditResult.status === 'fulfilled' && auditResult.value.ok && auditResult.value.data) {
                    const data = auditResult.value.data;
                    // Handle multiple possible response shapes
                    let events = [];
                    if (Array.isArray(data)) {
                        events = data;
                    }
                    else if (Array.isArray(data.data)) {
                        events = data.data;
                    }
                    else if (Array.isArray(data.entries)) {
                        events = data.entries;
                    }
                    else if (Array.isArray(data.items)) {
                        events = data.items;
                    }
                    else if (Array.isArray(data.documents)) {
                        events = data.documents;
                    }
                    else if (data.success && Array.isArray(data.results)) {
                        events = data.results;
                    }
                    recentActivity = events.slice(0, 5).map((e) => ({
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
                    count: count,
                    pct: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
                }));
                return server_1.NextResponse.json({
                    totalUsers,
                    activeSessions,
                    tiers,
                    recentActivity,
                });
            }
            catch (error) {
                console.error('[admin/stats] Error:', error);
                return server_1.NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
            }
        },
    };
}
