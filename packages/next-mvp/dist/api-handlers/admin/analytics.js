"use strict";
/**
 * Admin Analytics API Handler
 *
 * Provides admin-level analytics data using service account credentials.
 * Supports: geo stats, login stats, revenue stats, feature usage.
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
exports.createAnalyticsHandler = createAnalyticsHandler;
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
function getCountryFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2)
        return '';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
/**
 * POST /api/admin/analytics
 * Body: { type: 'geo' | 'logins' | 'revenue' | 'features', period?: string }
 */
function createAnalyticsHandler(config) {
    return {
        async POST(request) {
            const adminCheck = await checkAdminRole(config.getAuthOptions);
            if (adminCheck.error)
                return adminCheck.error;
            const body = await request.json();
            const { type, period = '7d' } = body;
            const now = new Date();
            let startDate;
            switch (period) {
                case '24h':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '90d':
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            }
            if (type === 'geo') {
                return await getGeoAnalytics(startDate);
            }
            if (type === 'logins') {
                return await getLoginAnalytics(startDate);
            }
            if (type === 'revenue') {
                return await getRevenueAnalytics(startDate);
            }
            if (type === 'features') {
                return await getFeatureUsageAnalytics(startDate);
            }
            if (type === 'summary') {
                return await getSummaryAnalytics(startDate);
            }
            return server_1.NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 });
        },
    };
}
async function getGeoAnalytics(startDate) {
    const result = await vibeServiceRequest('/v1/collections/vibe_app/tables/login_sessions/query', { method: 'POST', body: { page: 1, pageSize: 5000 } });
    if (!result.ok) {
        return server_1.NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }
    const sessions = result.data?.data || result.data?.documents || [];
    const recentSessions = sessions.filter((s) => new Date(s.created_at) >= startDate);
    const byCountry = {};
    const byCity = {};
    recentSessions.forEach((s) => {
        const country = s.country_code || s.country || 'Unknown';
        const city = s.city || 'Unknown';
        if (!byCountry[country]) {
            byCountry[country] = { count: 0, flag: getCountryFlag(country), cities: new Set() };
        }
        byCountry[country].count++;
        byCountry[country].cities.add(city);
        const cityKey = `${city}, ${country}`;
        byCity[cityKey] = (byCity[cityKey] || 0) + 1;
    });
    const countries = Object.entries(byCountry)
        .map(([code, data]) => ({
        code,
        flag: data.flag,
        count: data.count,
        cities: data.cities.size,
    }))
        .sort((a, b) => b.count - a.count);
    const cities = Object.entries(byCity)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    return server_1.NextResponse.json({
        geo: {
            totalSessions: recentSessions.length,
            uniqueCountries: countries.length,
            countries,
            topCities: cities,
        },
    });
}
async function getLoginAnalytics(startDate) {
    const result = await vibeServiceRequest('/v1/collections/vibe_app/tables/login_sessions/query', { method: 'POST', body: { page: 1, pageSize: 5000 } });
    if (!result.ok) {
        return server_1.NextResponse.json({ error: result.error }, { status: result.status || 500 });
    }
    const sessions = result.data?.data || result.data?.documents || [];
    const recentSessions = sessions.filter((s) => new Date(s.created_at) >= startDate);
    // Group by day
    const byDay = {};
    const byHour = {};
    const byDevice = {};
    const byBrowser = {};
    recentSessions.forEach((s) => {
        const date = new Date(s.created_at);
        const dayKey = date.toISOString().split('T')[0];
        byDay[dayKey] = (byDay[dayKey] || 0) + 1;
        const hour = date.getHours();
        byHour[hour] = (byHour[hour] || 0) + 1;
        const device = s.device_type || s.device || 'Unknown';
        byDevice[device] = (byDevice[device] || 0) + 1;
        const browser = s.browser || 'Unknown';
        byBrowser[browser] = (byBrowser[browser] || 0) + 1;
    });
    const dailyLogins = Object.entries(byDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    const hourlyDistribution = Object.entries(byHour)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour);
    return server_1.NextResponse.json({
        logins: {
            total: recentSessions.length,
            uniqueUsers: new Set(recentSessions.map((s) => s.idp_user_id || s.user_id)).size,
            dailyLogins,
            hourlyDistribution,
            byDevice: Object.entries(byDevice).map(([device, count]) => ({ device, count })),
            byBrowser: Object.entries(byBrowser).map(([browser, count]) => ({ browser, count })),
        },
    });
}
async function getRevenueAnalytics(startDate) {
    // Try to get transactions table
    const result = await vibeServiceRequest('/v1/collections/vibe_app/tables/transactions/query', { method: 'POST', body: { page: 1, pageSize: 5000 } });
    if (!result.ok) {
        // Table might not exist, return empty stats
        return server_1.NextResponse.json({
            revenue: {
                total: 0,
                count: 0,
                byDay: [],
                byTier: {},
                message: 'No transactions table or data available',
            },
        });
    }
    const transactions = result.data?.data || result.data?.documents || [];
    const recentTxns = transactions.filter((t) => new Date(t.created_at) >= startDate);
    const byDay = {};
    const byTier = {};
    let totalAmount = 0;
    recentTxns.forEach((t) => {
        const date = new Date(t.created_at).toISOString().split('T')[0];
        const amount = parseFloat(t.amount) || 0;
        const tier = t.tier || t.product || 'unknown';
        if (!byDay[date])
            byDay[date] = { count: 0, amount: 0 };
        byDay[date].count++;
        byDay[date].amount += amount;
        if (!byTier[tier])
            byTier[tier] = { count: 0, amount: 0 };
        byTier[tier].count++;
        byTier[tier].amount += amount;
        totalAmount += amount;
    });
    const dailyRevenue = Object.entries(byDay)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    return server_1.NextResponse.json({
        revenue: {
            total: totalAmount,
            count: recentTxns.length,
            byDay: dailyRevenue,
            byTier,
        },
    });
}
async function getFeatureUsageAnalytics(startDate) {
    // Try to get feature_usage or analytics table
    const result = await vibeServiceRequest('/v1/collections/vibe_app/tables/feature_usage/query', { method: 'POST', body: { page: 1, pageSize: 5000 } });
    if (!result.ok) {
        // Try analytics table as fallback
        const analyticsResult = await vibeServiceRequest('/v1/collections/vibe_app/tables/analytics/query', { method: 'POST', body: { page: 1, pageSize: 5000 } });
        if (!analyticsResult.ok) {
            return server_1.NextResponse.json({
                features: {
                    total: 0,
                    byFeature: {},
                    message: 'No feature usage data available',
                },
            });
        }
        const events = analyticsResult.data?.data || analyticsResult.data?.documents || [];
        return processFeatureUsage(events, startDate);
    }
    const events = result.data?.data || result.data?.documents || [];
    return processFeatureUsage(events, startDate);
}
function processFeatureUsage(events, startDate) {
    const recentEvents = events.filter((e) => new Date(e.created_at) >= startDate);
    const byFeature = {};
    const byDay = {};
    recentEvents.forEach((e) => {
        const feature = e.feature || e.action || e.event_type || 'unknown';
        const userId = e.user_id || e.idp_user_id || 'anonymous';
        const date = new Date(e.created_at).toISOString().split('T')[0];
        if (!byFeature[feature]) {
            byFeature[feature] = { count: 0, uniqueUsers: new Set() };
        }
        byFeature[feature].count++;
        byFeature[feature].uniqueUsers.add(userId);
        byDay[date] = (byDay[date] || 0) + 1;
    });
    const features = Object.entries(byFeature)
        .map(([name, data]) => ({
        name,
        count: data.count,
        uniqueUsers: data.uniqueUsers.size,
    }))
        .sort((a, b) => b.count - a.count);
    const dailyUsage = Object.entries(byDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    return server_1.NextResponse.json({
        features: {
            total: recentEvents.length,
            byFeature: features,
            dailyUsage,
        },
    });
}
async function getSummaryAnalytics(startDate) {
    // Get users
    const usersResult = await vibeServiceRequest('/v1/collections/vibe_app/tables/users/query', { method: 'POST', body: { page: 1, pageSize: 10000 } });
    // Get sessions
    const sessionsResult = await vibeServiceRequest('/v1/collections/vibe_app/tables/login_sessions/query', { method: 'POST', body: { page: 1, pageSize: 5000 } });
    const users = usersResult.ok ? (usersResult.data?.data || usersResult.data?.documents || []) : [];
    const sessions = sessionsResult.ok ? (sessionsResult.data?.data || sessionsResult.data?.documents || []) : [];
    const recentUsers = users.filter((u) => new Date(u.created_at) >= startDate);
    const recentSessions = sessions.filter((s) => new Date(s.created_at) >= startDate);
    const tierCounts = {};
    users.forEach((u) => {
        const tier = u.tier || 'free';
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    });
    return server_1.NextResponse.json({
        summary: {
            totalUsers: users.length,
            newUsers: recentUsers.length,
            activeSessions: sessions.filter((s) => s.status === 'active').length,
            recentLogins: recentSessions.length,
            usersByTier: tierCounts,
        },
    });
}
