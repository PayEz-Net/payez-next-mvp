/**
 * Client-Side Exports
 *
 * This module exports only client-safe code for use in browser environments.
 * Server-only utilities and Node.js dependencies are excluded.
 */

// Client-side fetch utility
export { fetchWithAuth } from './fetch-with-auth';

// Authentication context and hooks
export { AuthProvider, useAuthConfig, useAuthMode, useFederatedProviders, useFederatedAuthEnabled, useTraditionalAuthEnabled } from './AuthContext';
export type { AuthConfig } from '../types/auth';
