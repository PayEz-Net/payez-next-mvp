/**
 * Client-Side Exports
 *
 * This module exports only client-safe code for use in browser environments.
 * Server-only utilities and Node.js dependencies are excluded.
 */
export { fetchWithAuth } from './fetch-with-auth';
export { AuthProvider, useAuthConfig, useAuthMode, useFederatedProviders, useFederatedAuthEnabled, useTraditionalAuthEnabled } from './AuthContext';
export type { AuthConfig } from '../types/auth';
