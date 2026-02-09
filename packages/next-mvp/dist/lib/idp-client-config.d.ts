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
import 'server-only';
export interface OAuthProviderConfig {
    provider: string;
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    scopes?: string;
    additionalParams?: Record<string, any>;
}
export interface AuthSettings {
    require2FA: boolean;
    allowed2FAMethods: string[];
    mfaGracePeriodHours: number;
    mfaRememberDeviceDays: number;
    sessionTimeoutMinutes: number;
    idleTimeoutMinutes: number;
    allowRememberMe: boolean;
    rememberMeDays: number;
    lockoutThreshold: number;
    lockoutDurationMinutes: number;
}
export interface BrandingConfig {
    theme?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
}
export interface IDPClientConfig {
    clientId: number;
    clientSlug: string;
    nextAuthSecret: string;
    configCacheTtlSeconds: number;
    oauthProviders: OAuthProviderConfig[];
    authSettings: AuthSettings;
    branding: BrandingConfig;
    baseClientUrl?: string;
}
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
export declare function getIDPClientConfig(forceRefresh?: boolean): Promise<IDPClientConfig>;
/**
 * Clear the config cache (useful for testing or forced refresh)
 */
export declare function clearConfigCache(): void;
/**
 * Get enabled OAuth providers from config
 */
export declare function getEnabledProviders(config: IDPClientConfig): OAuthProviderConfig[];
