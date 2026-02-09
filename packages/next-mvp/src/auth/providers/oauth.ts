/**
 * OAuth Provider Builder
 *
 * Dynamically builds NextAuth OAuth providers from IDP configuration.
 * Supports Google, Apple, Facebook, GitHub, and Microsoft/Azure AD.
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */

import type { Provider } from 'next-auth/providers/index';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import FacebookProvider from 'next-auth/providers/facebook';
import GitHubProvider from 'next-auth/providers/github';
import AzureADProvider from 'next-auth/providers/azure-ad';
import type { IDPClientConfig, OAuthProviderConfig } from '../../lib/idp-client-config';

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
export function buildOAuthProviders(config: IDPClientConfig): Provider[] {
  const providers: Provider[] = [];

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
function createOAuthProvider(oauth: OAuthProviderConfig): Provider | null {
  const providerName = oauth.provider.toLowerCase();

  switch (providerName) {
    case 'google':
      return GoogleProvider({
        clientId: oauth.clientId,
        clientSecret: oauth.clientSecret,
        authorization: {
          params: {
            scope: oauth.scopes || 'openid email profile',
          },
        },
      });

    case 'apple':
      return AppleProvider({
        clientId: oauth.clientId,
        clientSecret: oauth.clientSecret,
        authorization: {
          params: {
            scope: oauth.scopes || 'name email',
          },
        },
      });

    case 'facebook':
      return FacebookProvider({
        clientId: oauth.clientId,
        clientSecret: oauth.clientSecret,
      });

    case 'github':
      return GitHubProvider({
        clientId: oauth.clientId,
        clientSecret: oauth.clientSecret,
      });

    case 'microsoft':
    case 'azure_ad':
    case 'azure-ad':
    case 'azuread':
      return AzureADProvider({
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
export function getEnabledProviderNames(config: IDPClientConfig): string[] {
  return (config.oauthProviders || [])
    .filter((p) => p.enabled)
    .map((p) => p.provider);
}
