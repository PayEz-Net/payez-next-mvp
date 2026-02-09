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
import type { IDPClientConfig } from '../../lib/idp-client-config';
/**
 * Build NextAuth OAuth providers from IDP configuration.
 *
 * The IDP returns a list of enabled OAuth providers with their credentials.
 * This function maps them to NextAuth provider instances.
 *
 * @param config - IDP client configuration containing OAuth provider list
 * @returns Array of NextAuth Provider instances
 */
export declare function buildOAuthProviders(config: IDPClientConfig): Provider[];
/**
 * Get list of enabled provider names from config.
 * Useful for logging and debugging.
 */
export declare function getEnabledProviderNames(config: IDPClientConfig): string[];
