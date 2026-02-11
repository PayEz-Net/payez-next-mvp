"use strict";
/**
 * Page RBAC Check Module
 *
 * Checks page-level permissions via Vibe API through the IDP Proxy.
 * Uses in-memory cache to reduce API calls.
 * Fails closed (DENY) on errors or timeout.
 *
 * All requests route through the IDP Vibe Proxy ({IDP_URL}/api/vibe/proxy)
 * which injects proper HMAC credentials for the Vibe API.
 *
 * @version 2.0.0
 * @since page-rbac-2026-01
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRBACCache = clearRBACCache;
exports.checkPagePermission = checkPagePermission;
exports.isRBACEnabled = isRBACEnabled;
// ============================================================================
// WEB CRYPTO HELPERS (Edge Runtime compatible)
// ============================================================================
const encoder = new TextEncoder();
async function sha256Hex(input) {
    const data = encoder.encode(input);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
async function hmacSha256Base64(key, message) {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
// ============================================================================
// CACHE
// ============================================================================
const rbacCache = new Map();
const DEFAULT_CACHE_TTL = 60; // 60 seconds
const MAX_CACHE_TTL = 300; // 5 minutes max - prevents cache poisoning
const MAX_CACHE_SIZE = 1000;
/**
 * Generate cache key for RBAC result.
 * Uses SHA-256 hash to avoid key collisions and limit key size.
 */
async function getCacheKey(clientId, path, roles) {
    const sortedRoles = [...roles].sort().join(',');
    const input = JSON.stringify({ clientId, path, roles: sortedRoles });
    const hash = await sha256Hex(input);
    return hash.substring(0, 32);
}
/**
 * Get cached RBAC result if valid.
 */
function getCachedResult(key) {
    const cached = rbacCache.get(key);
    if (cached && cached.expires > Date.now()) {
        return cached.result;
    }
    // Clean up expired entry
    if (cached) {
        rbacCache.delete(key);
    }
    return null;
}
/**
 * Cache an RBAC result.
 */
function setCachedResult(key, result) {
    // Prevent unbounded cache growth
    if (rbacCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entries (first 100)
        const keysToDelete = Array.from(rbacCache.keys()).slice(0, 100);
        keysToDelete.forEach(k => rbacCache.delete(k));
    }
    // SECURITY: Clamp TTL to prevent cache poisoning attacks
    const ttl = Math.min(result.cache_ttl ?? DEFAULT_CACHE_TTL, MAX_CACHE_TTL);
    rbacCache.set(key, {
        result,
        expires: Date.now() + (ttl * 1000),
    });
}
/**
 * Clear cache (for testing or config changes).
 */
function clearRBACCache() {
    rbacCache.clear();
}
// ============================================================================
// RBAC CHECK (via IDP Proxy)
// ============================================================================
/**
 * Check if user has permission to access a page.
 *
 * Routes through IDP Vibe Proxy ({IDP_URL}/api/vibe/proxy) which injects
 * proper HMAC credentials. The Vibe RBAC endpoint requires client context
 * that only the proxy can provide.
 *
 * FAIL CLOSED: If proxy is unreachable or times out, access is DENIED.
 *
 * @param path - The route path to check
 * @param userRoles - User's roles from session
 * @param clientId - Client slug for multi-tenancy
 * @param userClaims - Optional claims for claim-based authorization
 * @returns RBAC result with allowed/denied status
 */
async function checkPagePermission(path, userRoles, clientId, userClaims) {
    // Check cache first
    const cacheKey = await getCacheKey(clientId, path, userRoles);
    const cached = getCachedResult(cacheKey);
    if (cached) {
        return cached;
    }
    const idpUrl = process.env.NEXT_PUBLIC_IDP_URL || process.env.IDP_URL;
    const vibeClientId = process.env.VIBE_CLIENT_ID;
    const hmacKey = process.env.VIBE_HMAC_KEY || process.env.IDP_SIGNING_KEY;
    if (!idpUrl) {
        console.error('[RBAC] IDP_URL not configured');
        return {
            allowed: false,
            reason: 'rbac_not_configured',
            redirect: '/error?code=rbac_not_configured',
        };
    }
    // Build RBAC endpoint with query params
    // Vibe route is /v1/rbac/check (no /api/ prefix)
    const params = new URLSearchParams();
    params.set('path', path);
    params.set('roles', userRoles.join(','));
    if (userClaims && Object.keys(userClaims).length > 0) {
        const claimsParam = Object.entries(userClaims)
            .map(([type, value]) => `${type}:${value}`)
            .join(',');
        params.set('claims', claimsParam);
    }
    const rbacEndpoint = `/v1/rbac/check?${params.toString()}`;
    // Build proxy request
    const proxyUrl = `${idpUrl}/api/vibe/proxy`;
    const timestamp = Math.floor(Date.now() / 1000);
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    if (vibeClientId) {
        headers['X-Vibe-Client-Id'] = vibeClientId;
    }
    // Sign with HMAC (same format as vibe-client: timestamp|method|endpoint)
    if (hmacKey && vibeClientId) {
        const stringToSign = `${timestamp}|GET|${rbacEndpoint}`;
        const keyBuffer = base64ToUint8Array(hmacKey);
        const signature = await hmacSha256Base64(keyBuffer, stringToSign);
        headers['X-Vibe-Timestamp'] = String(timestamp);
        headers['X-Vibe-Signature'] = signature;
    }
    // Proxy body format: { endpoint, method, data }
    const proxyBody = {
        endpoint: rbacEndpoint,
        method: 'GET',
        data: null,
    };
    try {
        // 2 second timeout - fail closed
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(proxyBody),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            console.error('[RBAC] Proxy error:', response.status, response.statusText);
            return {
                allowed: false,
                reason: 'rbac_api_error',
                redirect: '/error?code=rbac_error',
            };
        }
        const result = await response.json();
        // Cache the result
        setCachedResult(cacheKey, result);
        return result;
    }
    catch (error) {
        // Fail closed on any error
        if (error.name === 'AbortError') {
            console.error('[RBAC] Proxy timeout (2s exceeded)');
            return {
                allowed: false,
                reason: 'rbac_timeout',
                redirect: '/error?code=rbac_timeout',
            };
        }
        console.error('[RBAC] Proxy error:', error);
        return {
            allowed: false,
            reason: 'rbac_service_unavailable',
            redirect: '/error?code=rbac_unavailable',
        };
    }
}
/**
 * Check if RBAC is enabled for this deployment.
 */
function isRBACEnabled() {
    return process.env.VIBE_RBAC_ENABLED === 'true';
}
