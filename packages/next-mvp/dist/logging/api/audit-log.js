"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAuditLog = writeAuditLog;
exports.queryAuditLog = queryAuditLog;
const API_BASE = process.env.NEXT_PUBLIC_VIBE_API_URL || 'http://localhost:32786';
/**
 * Get admin token from app's auth implementation
 */
function getAdminToken() {
    if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('admin_token') || '';
    }
    return '';
}
async function writeAuditLog(entry) {
    const res = await fetch(`${API_BASE}/v1/audit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAdminToken()}`
        },
        body: JSON.stringify(entry)
    });
    if (!res.ok) {
        throw new Error(`Failed to write audit log: ${res.statusText}`);
    }
    return res.json();
}
async function queryAuditLog(query) {
    const params = new URLSearchParams();
    if (query.category)
        params.append('category', query.category);
    if (query.userId)
        params.append('userId', query.userId.toString());
    if (query.startDate)
        params.append('startDate', query.startDate);
    if (query.endDate)
        params.append('endDate', query.endDate);
    if (query.page)
        params.append('page', query.page.toString());
    if (query.pageSize)
        params.append('pageSize', query.pageSize.toString());
    const res = await fetch(`${API_BASE}/v1/audit?${params.toString()}`, {
        headers: {
            Authorization: `Bearer ${getAdminToken()}`
        }
    });
    if (!res.ok) {
        throw new Error(`Failed to query audit log: ${res.statusText}`);
    }
    return res.json();
}
