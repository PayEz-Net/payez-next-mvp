"use strict";
/**
 * OAuth Provider Builder
 *
 * Dynamically builds NextAuth OAuth providers from IDP configuration.
 * Supports Google, Apple, Facebook, GitHub, and Microsoft/Azure AD.
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOAuthProviders = buildOAuthProviders;
exports.getEnabledProviderNames = getEnabledProviderNames;
const google_1 = __importDefault(require("next-auth/providers/google"));
const apple_1 = __importDefault(require("next-auth/providers/apple"));
const facebook_1 = __importDefault(require("next-auth/providers/facebook"));
const github_1 = __importDefault(require("next-auth/providers/github"));
const azure_ad_1 = __importDefault(require("next-auth/providers/azure-ad"));
// ============================================================================
// PROVIDER BUILDER
// ============================================================================
/**
 * Build NextAuth OAuth providers from IDP configuration.
 *
 * The IDP returns a list of enabled OAuth providers with their credentials.
 * This function maps them to NextAuth provider instances.
 *
 * @param config - IDP client configuration containing OAuth provider list
 * @returns Array of NextAuth Provider instances
 */
function buildOAuthProviders(config) {
    const providers = [];
    for (const oauth of config.oauthProviders || []) {
        if (!oauth.enabled) {
            continue;
        }
        const provider = createOAuthProvider(oauth);
        if (provider) {
            providers.push(provider);
        }
    }
    return providers;
}
/**
 * Create a single OAuth provider instance from config.
 */
function createOAuthProvider(oauth) {
    const providerName = oauth.provider.toLowerCase();
    switch (providerName) {
        case 'google':
            return (0, google_1.default)({
                clientId: oauth.clientId,
                clientSecret: oauth.clientSecret,
                authorization: {
                    params: {
                        scope: oauth.scopes || 'openid email profile',
                    },
                },
            });
        case 'apple':
            return (0, apple_1.default)({
                clientId: oauth.clientId,
                clientSecret: oauth.clientSecret,
                authorization: {
                    params: {
                        scope: oauth.scopes || 'name email',
                    },
                },
            });
        case 'facebook':
            return (0, facebook_1.default)({
                clientId: oauth.clientId,
                clientSecret: oauth.clientSecret,
            });
        case 'github':
            return (0, github_1.default)({
                clientId: oauth.clientId,
                clientSecret: oauth.clientSecret,
            });
        case 'microsoft':
        case 'azure_ad':
        case 'azure-ad':
        case 'azuread':
            return (0, azure_ad_1.default)({
                clientId: oauth.clientId,
                clientSecret: oauth.clientSecret,
                tenantId: oauth.additionalParams?.tenantId || 'common',
            });
        default:
            console.warn(`[OAUTH_PROVIDERS] Unknown OAuth provider: ${oauth.provider}`);
            return null;
    }
}
/**
 * Get list of enabled provider names from config.
 * Useful for logging and debugging.
 */
function getEnabledProviderNames(config) {
    return (config.oauthProviders || [])
        .filter((p) => p.enabled)
        .map((p) => p.provider);
}
