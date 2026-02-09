"use strict";
/**
 * Page RBAC Check Module
 *
 * Checks page-level permissions via Vibe API.
 * Uses in-memory cache to reduce API calls.
 * Fails closed (DENY) on errors or timeout.
 *
 * @version 1.0.0
 * @since page-rbac-2026-01
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRBACCache = clearRBACCache;
exports.checkPagePermission = checkPagePermission;
exports.isRBACEnabled = isRBACEnabled;
const crypto_1 = require("crypto");
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
function getCacheKey(clientId, path, roles) {
    const sortedRoles = [...roles].sort().join(',');
    const input = JSON.stringify({ clientId, path, roles: sortedRoles });
    return (0, crypto_1.createHash)('sha256').update(input).digest('hex').substring(0, 32);
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
// SIGNATURE
// ============================================================================
/**
 * Generate HMAC-SHA256 signature for Vibe API request.
 * SECURITY: Signing key is required in production.
 */
function generateSignature(path, clientId, timestamp) {
    const signingKey = process.env.VIBE_SIGNING_KEY;
    // SECURITY: Require signing key in production
    if (!signingKey) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('[RBAC] VIBE_SIGNING_KEY is required in production');
        }
        return ''; // Signature optional in dev only
    }
    const stringToSign = `${timestamp}|GET|/api/v1/rbac/check|${path}|${clientId}`;
    return (0, crypto_1.createHmac)('sha256', Buffer.from(signingKey, 'base64'))
        .update(stringToSign)
        .digest('base64');
}
// ============================================================================
// RBAC CHECK
// ============================================================================
/**
 * Check if user has permission to access a page.
 *
 * FAIL CLOSED: If Vibe API is unreachable or times out, access is DENIED.
 *
 * @param path - The route path to check
 * @param userRoles - User's roles from session
 * @param clientId - Client ID for multi-tenancy
 * @param userClaims - Optional claims for claim-based authorization
 * @returns RBAC result with allowed/denied status
 */
async function checkPagePermission(path, userRoles, clientId, userClaims) {
    // Check cache first
    const cacheKey = getCacheKey(clientId, path, userRoles);
    const cached = getCachedResult(cacheKey);
    if (cached) {
        return cached;
    }
    const vibeApiUrl = process.env.VIBE_API_URL;
    if (!vibeApiUrl) {
        console.error('[RBAC] VIBE_API_URL not configured');
        return {
            allowed: false,
            reason: 'rbac_not_configured',
            redirect: '/error?code=rbac_not_configured',
        };
    }
    // Build request URL
    const url = new URL('/api/v1/rbac/check', vibeApiUrl);
    url.searchParams.set('path', path);
    url.searchParams.set('roles', userRoles.join(','));
    // Add claims if provided
    if (userClaims && Object.keys(userClaims).length > 0) {
        const claimsParam = Object.entries(userClaims)
            .map(([type, value]) => `${type}:${value}`)
            .join(',');
        url.searchParams.set('claims', claimsParam);
    }
    // Generate signature
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateSignature(path, clientId, timestamp);
    // Build headers
    const headers = {
        'Accept': 'application/json',
        'X-Client-Id': clientId,
        'X-Vibe-Client-Id': clientId,
    };
    if (signature) {
        headers['X-Vibe-Timestamp'] = String(timestamp);
        headers['X-Vibe-Signature'] = signature;
    }
    try {
        // 2 second timeout - fail closed
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            console.error('[RBAC] Vibe API error:', response.status, response.statusText);
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
            console.error('[RBAC] Vibe API timeout (2s exceeded)');
            return {
                allowed: false,
                reason: 'rbac_timeout',
                redirect: '/error?code=rbac_timeout',
            };
        }
        console.error('[RBAC] Vibe API error:', error);
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
