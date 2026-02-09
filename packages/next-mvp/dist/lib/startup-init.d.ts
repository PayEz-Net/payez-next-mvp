/**
 * Startup Initialization for MVP
 *
 * This module ensures that critical initialization tasks are completed
 * before the application serves requests.
 *
 * Now uses unified IDP client config for:
 * - NEXTAUTH_SECRET
 * - OAuth provider configuration
 * - Auth settings (2FA, session timeouts, etc.)
 */
import 'server-only';
import { type IDPClientConfig } from './idp-client-config';
/**
 * Initialize the application startup sequence (async)
 * Handles async initialization like fetching secrets from IDP
 */
export declare function ensureInitialized(): Promise<void>;
/**
 * Synchronously log startup status
 * Can be called before async initialization is complete
 */
export declare function logStartupStatus(): void;
/**
 * Get the cached IDP config after initialization.
 * Returns null if not yet initialized.
 */
export declare function getStartupIDPConfig(): IDPClientConfig | null;
/**
 * Check if initialization failed (NEXTAUTH_SECRET couldn't be retrieved)
 */
export declare function isInitializationFailed(): boolean;
/**
 * Get the last initialization error
 */
export declare function getInitializationError(): Error | null;
/**
 * Check if the app is ready to handle auth requests
 */
export declare function isAppReady(): boolean;
