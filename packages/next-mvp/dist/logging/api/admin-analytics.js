"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorMetrics = getErrorMetrics;
exports.getHealthMetrics = getHealthMetrics;
const API_BASE = process.env.NEXT_PUBLIC_VIBE_API_URL || 'http://localhost:32786';
/**
 * Get admin token from app's auth implementation
 * Apps should override this via their own auth logic
 */
function getAdminToken() {
    if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('admin_token') || '';
    }
    return '';
}
async function getErrorMetrics(timeRange = '24h') {
    // Convert timeRange to hours for backend API
    const hoursMap = {
        '1h': 1,
        '24h': 24,
        '7d': 168,
        '30d': 720
    };
    const hours = hoursMap[timeRange];
    const res = await fetch(`${API_BASE}/v1/admin/analytics/errors?hours=${hours}`, {
        headers: {
            Authorization: `Bearer ${getAdminToken()}`
        }
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch error metrics: ${res.statusText}`);
    }
    return res.json();
}
async function getHealthMetrics(timeRange = '1h') {
    const res = await fetch(`${API_BASE}/v1/admin/analytics/health?timeRange=${timeRange}`, {
        headers: {
            Authorization: `Bearer ${getAdminToken()}`
        }
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch health metrics: ${res.statusText}`);
    }
    return res.json();
}
