"use strict";
/**
 * IDP Client Configuration
 *
 * Fetches full client configuration from IDP including:
 * - OAuth provider credentials (from Key Vault)
 * - 2FA/MFA settings
 * - Session configuration
 * - NextAuth secret
 * - Branding
 *
 * CACHING STRATEGY:
 * 1. In-memory cache (fastest, but lost on module reload in dev)
 * 2. Redis cache (survives module reloads, shared across instances)
 * 3. IDP fetch (when both caches miss)
 *
 * NO FALLBACKS. If IDP doesn't respond correctly, we fail loud.
 *
 * @version 2.0.0 - Added Redis-backed caching
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIDPClientConfig = getIDPClientConfig;
exports.clearConfigCache = clearConfigCache;
exports.getEnabledProviders = getEnabledProviders;
require("server-only");
const crypto_1 = require("crypto");
const redis_1 = __importDefault(require("./redis"));
// ============================================================================
// Cache & Fetch Deduplication
// ============================================================================
let cachedConfig = null;
let cacheExpiry = 0;
let pendingFetch = null; // Prevents parallel fetches
// ============================================================================
// Redis Cache Configuration
// ============================================================================
const REDIS_CONFIG_KEY_PREFIX = 'idp_config:';
function getRedisConfigKey() {
    const clientId = process.env.CLIENT_ID || process.env.NEXT_PUBLIC_CLIENT_ID || 'default';
    return `${REDIS_CONFIG_KEY_PREFIX}${clientId}`;
}
async function getConfigFromRedis() {
    try {
        const key = getRedisConfigKey();
        const cached = await redis_1.default.get(key);
        if (!cached)
            return null;
        const parsed = JSON.parse(cached);
        if (Date.now() >= parsed.expiresAt) {
            // Expired, delete it
            await redis_1.default.del(key);
            return null;
        }
        return parsed.config;
    }
    catch (error) {
        console.warn('[IDP_CONFIG] Failed to read from Redis cache:', error);
        return null;
    }
}
async function setConfigInRedis(config) {
    try {
        const key = getRedisConfigKey();
        const ttlSeconds = config.configCacheTtlSeconds || 300;
        const data = {
            config,
            expiresAt: Date.now() + (ttlSeconds * 1000)
        };
        // Store with TTL slightly longer than the logical expiry to allow for clock skew
        await redis_1.default.set(key, JSON.stringify(data), 'EX', ttlSeconds + 10);
    }
    catch (error) {
        console.warn('[IDP_CONFIG] Failed to write to Redis cache:', error);
    }
}
// ============================================================================
// Circuit Breaker & Backoff State
// ============================================================================
let consecutiveFailures = 0;
let lastFailureTime = 0;
const MAX_FAILURES = 3;
const CIRCUIT_OPEN_MS = 300000; // 5 minutes
const MAX_BACKOFF_MS = 30000; // 30 seconds max backoff
// ============================================================================
// Main Functions
// ============================================================================
/**
 * Get IDP client configuration with multi-tier caching.
 *
 * Caching layers (checked in order):
 * 1. In-memory cache (fastest, lost on module reload in dev)
 * 2. Redis cache (survives module reloads)
 * 3. IDP fetch (when both caches miss)
 *
 * THROWS if IDP is unavailable or misconfigured. No fallbacks.
 */
async function getIDPClientConfig(forceRefresh = false) {
    const now = Date.now();
    // Layer 1: Return in-memory cached if still valid (skip if forceRefresh)
    if (!forceRefresh && cachedConfig && now < cacheExpiry) {
        return cachedConfig;
    }
    // If a fetch is already in progress, wait for it instead of starting another
    if (pendingFetch) {
        return pendingFetch;
    }
    // Layer 2: Check Redis cache (skip if forceRefresh - startup should always get fresh data)
    if (!forceRefresh) {
        const redisConfig = await getConfigFromRedis();
        if (redisConfig) {
            // Restore to in-memory cache
            cachedConfig = redisConfig;
            cacheExpiry = Date.now() + ((redisConfig.configCacheTtlSeconds || 300) * 1000);
            // Set NEXTAUTH_SECRET from cached config
            if (redisConfig.nextAuthSecret) {
                process.env.NEXTAUTH_SECRET = redisConfig.nextAuthSecret;
            }
            // Set IDENTITY_CLIENT_BASE_EXTERNAL_URL from cached config
            // AUTH_TRUST_HOST=true tells NextAuth to derive OAuth callback URLs from headers.
            // Only set if not already defined (allows deployment override for beta/staging)
            if (redisConfig.baseClientUrl && !process.env.IDENTITY_CLIENT_BASE_EXTERNAL_URL) {
                process.env.IDENTITY_CLIENT_BASE_EXTERNAL_URL = redisConfig.baseClientUrl;
            }
            return redisConfig;
        }
    }
    // Layer 3: Fetch from IDP
    const idpUrl = process.env.IDP_URL;
    const clientIdStr = process.env.CLIENT_ID || process.env.NEXT_PUBLIC_CLIENT_ID;
    if (!idpUrl) {
        throw new Error('[IDP_CONFIG] FATAL: IDP_URL must be set');
    }
    if (!clientIdStr) {
        throw new Error('[IDP_CONFIG] FATAL: CLIENT_ID or NEXT_PUBLIC_CLIENT_ID must be set');
    }
    if (!process.env.PAYEZ_CLIENT_SECRET) {
        throw new Error('[IDP_CONFIG] FATAL: PAYEZ_CLIENT_SECRET is required. Inject via container env or K8s Secret — never .env files.');
    }
    // Start fetch and store promise so concurrent callers wait for same result
    pendingFetch = fetchConfigFromIDP(idpUrl, clientIdStr)
        .then(async (config) => {
        // Cache with TTL from response (default 5 minutes)
        cachedConfig = config;
        cacheExpiry = Date.now() + ((config.configCacheTtlSeconds || 300) * 1000);
        // Store in Redis for persistence across module reloads
        await setConfigInRedis(config);
        // Set NEXTAUTH_SECRET from config
        if (config.nextAuthSecret) {
            process.env.NEXTAUTH_SECRET = config.nextAuthSecret;
        }
        else {
            throw new Error('[IDP_CONFIG] FATAL: IDP did not return nextAuthSecret');
        }
        // Set IDENTITY_CLIENT_BASE_EXTERNAL_URL from config
        // AUTH_TRUST_HOST=true tells NextAuth to derive OAuth callback URLs from headers.
        // Only set if not already defined (allows deployment override for beta/staging)
        if (config.baseClientUrl && !process.env.IDENTITY_CLIENT_BASE_EXTERNAL_URL) {
            process.env.IDENTITY_CLIENT_BASE_EXTERNAL_URL = config.baseClientUrl;
            console.log("[IDP_CONFIG] Set IDENTITY_CLIENT_BASE_EXTERNAL_URL:", config.baseClientUrl);
        }
        return config;
    })
        .finally(() => {
        pendingFetch = null; // Clear so next cache miss can fetch again
    });
    return pendingFetch;
}
/**
 * Clear the config cache (useful for testing or forced refresh)
 */
function clearConfigCache() {
    cachedConfig = null;
    cacheExpiry = 0;
}
/**
 * Get enabled OAuth providers from config
 */
function getEnabledProviders(config) {
    return config.oauthProviders?.filter(p => p.enabled) || [];
}
// ============================================================================
// Internal Functions
// ============================================================================
async function fetchConfigFromIDP(idpUrl, clientIdStr) {
    // =========================================================================
    // Circuit Breaker Check
    // =========================================================================
    if (consecutiveFailures >= MAX_FAILURES) {
        const timeSinceFailure = Date.now() - lastFailureTime;
        if (timeSinceFailure < CIRCUIT_OPEN_MS) {
            // Circuit is open - return stale cache if available
            if (cachedConfig) {
                return cachedConfig;
            }
            throw new Error(`[IDP_CONFIG] Circuit breaker OPEN - no cached config available. Retry in ${Math.round((CIRCUIT_OPEN_MS - timeSinceFailure) / 1000)}s`);
        }
        // Half-open state: allow one request to test
        consecutiveFailures = MAX_FAILURES - 1;
    }
    // =========================================================================
    // Exponential Backoff Check
    // =========================================================================
    if (consecutiveFailures > 0) {
        const backoffMs = Math.min(1000 * Math.pow(2, consecutiveFailures), MAX_BACKOFF_MS);
        const timeSinceFailure = Date.now() - lastFailureTime;
        if (timeSinceFailure < backoffMs) {
            const remainingMs = backoffMs - timeSinceFailure;
            // Return stale cache during backoff if available
            if (cachedConfig) {
                return cachedConfig;
            }
            throw new Error(`[IDP_CONFIG] In backoff period - retry in ${Math.round(remainingMs)}ms`);
        }
    }
    try {
        // Step 1: Get signed client assertion from IDP
        const signingUrl = `${idpUrl.replace(/\/$/, '')}/api/ExternalAuth/sign-client-assertion`;
        const signingPayload = {
            issuer: clientIdStr,
            subject: clientIdStr,
            audience: 'urn:payez:externalauth:clientconfig',
            expires_in: 60,
            client_secret: process.env.PAYEZ_CLIENT_SECRET,
        };
        const signingResp = await fetch(signingUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Client-Id': clientIdStr,
                'X-Correlation-Id': (0, crypto_1.randomUUID)().replace(/-/g, ''),
            },
            body: JSON.stringify(signingPayload),
            cache: 'no-store'
        });
        if (!signingResp.ok) {
            const txt = await signingResp.text().catch(() => 'Unknown error');
            throw new Error(`[IDP_CONFIG] FATAL: Failed to sign client assertion: ${signingResp.status} - ${txt}`);
        }
        const signingBody = await signingResp.json().catch(() => null);
        if (!signingBody) {
            throw new Error('[IDP_CONFIG] FATAL: IDP returned empty or invalid JSON for sign-client-assertion');
        }
        // Per PayEz API standard: response is { success, data: { client_assertion }, ... }
        // But IDP might use camelCase (clientAssertion) - check both
        const client_assertion = (signingBody?.data?.client_assertion ??
            signingBody?.data?.clientAssertion);
        if (!client_assertion) {
            console.error('[IDP_CONFIG] FATAL: Full response body:', JSON.stringify(signingBody, null, 2));
            throw new Error(`[IDP_CONFIG] FATAL: IDP response missing client_assertion. Got keys: ${JSON.stringify(Object.keys(signingBody?.data || signingBody || {}))}`);
        }
        // Step 2: Fetch client config using the assertion
        const configUrl = `${idpUrl.replace(/\/$/, '')}/api/ExternalAuth/client-config`;
        const configResp = await fetch(configUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Client-Id': clientIdStr,
                'X-Correlation-Id': (0, crypto_1.randomUUID)().replace(/-/g, ''),
            },
            body: JSON.stringify({ client_assertion }),
            cache: 'no-store'
        });
        if (!configResp.ok) {
            const txt = await configResp.text().catch(() => 'Unknown error');
            throw new Error(`[IDP_CONFIG] FATAL: Failed to fetch client config: ${configResp.status} - ${txt}`);
        }
        const configBody = await configResp.json().catch(() => null);
        if (!configBody) {
            throw new Error('[IDP_CONFIG] FATAL: IDP returned empty or invalid JSON for client-config');
        }
        // Per PayEz API standard: response is wrapped in { success, data: {...} }
        const configData = configBody?.data;
        if (!configData || typeof configData !== 'object') {
            console.error('[IDP_CONFIG] FATAL: Full config response body:', JSON.stringify(configBody, null, 2));
            throw new Error('[IDP_CONFIG] FATAL: IDP client-config response missing data envelope');
        }
        // Validate required fields - handle both number and string client_id
        const rawClientId = configData.clientId ?? configData.client_id;
        if (rawClientId === undefined || rawClientId === null) {
            throw new Error(`[IDP_CONFIG] FATAL: IDP response missing clientId/client_id. Got: ${JSON.stringify(Object.keys(configData))}`);
        }
        // Map response to our interface (IDP always returns snake_case)
        const config = {
            clientId: String(rawClientId),
            clientSlug: configData.clientSlug ?? configData.client_slug ?? configData.slug ?? '',
            nextAuthSecret: configData.nextAuthSecret ?? configData.next_auth_secret ?? '',
            configCacheTtlSeconds: configData.configCacheTtlSeconds ?? configData.config_cache_ttl_seconds ?? 300,
            oauthProviders: (configData.oauthProviders ?? configData.oauth_providers ?? []).map((p) => ({
                provider: p.provider ?? '',
                enabled: p.enabled ?? false,
                clientId: p.clientId ?? p.client_id ?? '',
                clientSecret: p.clientSecret ?? p.client_secret ?? '',
                scopes: p.scopes,
                additionalParams: p.additionalParams ?? p.additional_params
            })),
            authSettings: {
                require2FA: (() => {
                    // Check nested locations first (canonical)
                    const nested = configData.authSettings?.require2FA ?? configData.auth_settings?.require_2fa;
                    if (nested !== undefined)
                        return nested;
                    // TRANSITION FALLBACK: Check top-level (deprecated)
                    const topLevel = configData.require2FA ?? configData.require_2fa;
                    if (topLevel !== undefined) {
                        console.warn('[IDP_CONFIG] DEPRECATION: require2FA found at top-level. Should be nested under auth_settings. Update IDP.');
                        return topLevel;
                    }
                    return true; // Default to true for security
                })(),
                allowed2FAMethods: configData.authSettings?.allowed2FAMethods ?? configData.auth_settings?.allowed_2fa_methods ?? ['email', 'sms'],
                mfaGracePeriodHours: configData.authSettings?.mfaGracePeriodHours ?? configData.auth_settings?.mfa_grace_period_hours ?? 24,
                mfaRememberDeviceDays: configData.authSettings?.mfaRememberDeviceDays ?? configData.auth_settings?.mfa_remember_device_days ?? 30,
                sessionTimeoutMinutes: configData.authSettings?.sessionTimeoutMinutes ?? configData.auth_settings?.session_timeout_minutes ?? 60,
                idleTimeoutMinutes: configData.authSettings?.idleTimeoutMinutes ?? configData.auth_settings?.idle_timeout_minutes ?? 15,
                allowRememberMe: configData.authSettings?.allowRememberMe ?? configData.auth_settings?.allow_remember_me ?? true,
                rememberMeDays: configData.authSettings?.rememberMeDays ?? configData.auth_settings?.remember_me_days ?? 30,
                lockoutThreshold: configData.authSettings?.lockoutThreshold ?? configData.auth_settings?.lockout_threshold ?? 5,
                lockoutDurationMinutes: configData.authSettings?.lockoutDurationMinutes ?? configData.auth_settings?.lockout_duration_minutes ?? 15
            },
            branding: {
                theme: configData.branding?.theme,
                primaryColor: configData.branding?.primaryColor ?? configData.branding?.primary_color,
                secondaryColor: configData.branding?.secondaryColor ?? configData.branding?.secondary_color,
                logoUrl: configData.branding?.logoUrl ?? configData.branding?.logo_url
            },
            baseClientUrl: configData.baseClientUrl ?? configData.base_client_url ?? configData.BaseClientUrl
        };
        // Debug: log what we got for baseClientUrl
        console.log(`[IDP_CONFIG] Parsed baseClientUrl:`, config.baseClientUrl, `| raw keys:`, Object.keys(configData).filter(k => k.toLowerCase().includes('client')));
        // Validate we got what we need
        if (!config.clientId) {
            throw new Error('[IDP_CONFIG] FATAL: clientId is empty or missing after parsing');
        }
        if (!config.nextAuthSecret) {
            throw new Error('[IDP_CONFIG] FATAL: nextAuthSecret is empty after parsing');
        }
        // Success - reset failure tracking
        consecutiveFailures = 0;
        return config;
    }
    catch (error) {
        // Track failure for circuit breaker
        consecutiveFailures++;
        lastFailureTime = Date.now();
        console.error('[IDP_CONFIG] Fetch failed', {
            consecutiveFailures,
            maxFailures: MAX_FAILURES,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
}
