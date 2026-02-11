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

// ============================================================================
// WEB CRYPTO HELPERS (Edge Runtime compatible)
// ============================================================================

const encoder = new TextEncoder();

async function sha256Hex(input: string): Promise<string> {
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256Base64(key: ArrayBuffer, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ============================================================================
// TYPES
// ============================================================================

export interface RBACResult {
  allowed: boolean;
  requires_2fa?: boolean;
  requires_elevated_auth?: boolean;
  reason?: string;
  required_roles?: string[];
  required_claims?: Array<{ type: string; value: string }>;
  matched_rule?: string;
  redirect?: string;
  cache_ttl?: number;
}

interface CacheEntry {
  result: RBACResult;
  expires: number;
}

// ============================================================================
// CACHE
// ============================================================================

const rbacCache = new Map<string, CacheEntry>();
const DEFAULT_CACHE_TTL = 60; // 60 seconds
const MAX_CACHE_TTL = 300; // 5 minutes max - prevents cache poisoning
const MAX_CACHE_SIZE = 1000;

/**
 * Generate cache key for RBAC result.
 * Uses SHA-256 hash to avoid key collisions and limit key size.
 */
async function getCacheKey(clientId: string, path: string, roles: string[]): Promise<string> {
  const sortedRoles = [...roles].sort().join(',');
  const input = JSON.stringify({ clientId, path, roles: sortedRoles });
  const hash = await sha256Hex(input);
  return hash.substring(0, 32);
}

/**
 * Get cached RBAC result if valid.
 */
function getCachedResult(key: string): RBACResult | null {
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
function setCachedResult(key: string, result: RBACResult): void {
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
export function clearRBACCache(): void {
  rbacCache.clear();
}

// ============================================================================
// SIGNATURE
// ============================================================================

/**
 * Generate HMAC-SHA256 signature for Vibe API request.
 * SECURITY: Signing key is required in production.
 */
async function generateSignature(
  path: string,
  clientId: string,
  timestamp: number
): Promise<string> {
  const signingKey = process.env.VIBE_SIGNING_KEY;

  // SECURITY: Require signing key in production
  if (!signingKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[RBAC] VIBE_SIGNING_KEY is required in production');
    }
    return ''; // Signature optional in dev only
  }

  const stringToSign = `${timestamp}|GET|/api/v1/rbac/check|${path}|${clientId}`;
  const keyBuffer = base64ToArrayBuffer(signingKey);
  return hmacSha256Base64(keyBuffer, stringToSign);
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
export async function checkPagePermission(
  path: string,
  userRoles: string[],
  clientId: string,
  userClaims?: Record<string, string>
): Promise<RBACResult> {
  // Check cache first
  const cacheKey = await getCacheKey(clientId, path, userRoles);
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
  const signature = await generateSignature(path, clientId, timestamp);

  // Build headers
  const headers: Record<string, string> = {
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

    const result: RBACResult = await response.json();

    // Cache the result
    setCachedResult(cacheKey, result);

    return result;
  } catch (error: any) {
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
export function isRBACEnabled(): boolean {
  return process.env.VIBE_RBAC_ENABLED === 'true';
}
