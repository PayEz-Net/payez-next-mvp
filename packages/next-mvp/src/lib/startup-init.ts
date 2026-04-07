/**
 * Startup Initialization for MVP
 *
 * This module ensures that critical initialization tasks are completed
 * before the application serves requests.
 *
 * Uses unified IDP client config for:
 * - BETTER_AUTH_SECRET (the Better Auth signing secret)
 * - OAuth provider configuration
 * - Auth settings (2FA, session timeouts, etc.)
 */

import 'server-only';
import { getIDPClientConfig, clearConfigRedisCache, type IDPClientConfig } from './idp-client-config';

let initializationStarted = false;
let initializationComplete = false;
let initializationFailed = false;
let initializationPromise: Promise<void> | null = null;
let lastInitError: Error | null = null;

// Cached IDP config for access after initialization
let cachedIDPConfig: IDPClientConfig | null = null;

// Startup backoff to prevent pod restart storms from hammering IDP
let lastStartupAttemptTime = 0;
const STARTUP_BACKOFF_MS = 30000; // 30 seconds between startup attempts after failure

/**
 * Initialize the application startup sequence (async)
 * Handles async initialization like fetching secrets from IDP
 */
export async function ensureInitialized(): Promise<void> {
  // If already initialized, return immediately
  if (initializationComplete) {
    return;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Prevent hammering IDP on rapid pod restarts
  const now = Date.now();
  if (initializationFailed && (now - lastStartupAttemptTime) < STARTUP_BACKOFF_MS) {
    const remainingMs = STARTUP_BACKOFF_MS - (now - lastStartupAttemptTime);
    console.warn('[STARTUP] In backoff period after previous failure, skipping IDP call', {
      remainingMs: Math.round(remainingMs),
      lastError: lastInitError?.message
    });
    // Re-throw last error so callers know we're still in failed state
    throw lastInitError || new Error('Initialization in backoff period');
  }

  // Track this attempt time
  lastStartupAttemptTime = now;

  // Mark as started
  initializationStarted = true;

  // Start initialization
  initializationPromise = performInitialization();
  await initializationPromise;
}

/**
 * Synchronously log startup status
 * Can be called before async initialization is complete
 */
export function logStartupStatus(): void {
  if (!initializationStarted) {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║            🚀 PayEz Next MVP - Starting Up                    ║');
    console.log('║                                                              ║');
    console.log('║  Async initialization in progress...                         ║');
    console.log('║  - Resolving BETTER_AUTH_SECRET from IDP                     ║');
    console.log('║  - Verifying environment configuration                       ║');
    console.log('║                                                              ║');
    console.log('║  Check logs below for detailed initialization status:        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
  } else if (initializationComplete) {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║            ✨ PayEz Next MVP Ready for Requests ✨            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
  } else if (lastInitError) {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  ⚠️  Startup error detected - initialization may still retry  ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
  }
}

async function performInitialization(): Promise<void> {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║            PayEz Next MVP - Async Startup                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // Step 1: Fetch full client config from IDP (includes secret, providers, settings)
    console.log('[STARTUP] Step 1/2: Fetching client config from IDP...');

    // Clear any stale Redis cache so startup always gets fresh IDP data
    await clearConfigRedisCache();

    try {
      const config = await getIDPClientConfig(true);
      cachedIDPConfig = config;

      console.log('[STARTUP] Client config loaded successfully');
      console.log('[STARTUP]    - Client ID:', config.clientId);
      console.log('[STARTUP]    - Client Slug:', config.clientSlug);
      console.log('[STARTUP]    - Secret length:', config.authSecret?.length || 0, 'chars');
      console.log('[STARTUP]    - OAuth Providers:', config.oauthProviders?.filter(p => p.enabled).map(p => p.provider).join(', ') || 'none');
      console.log('[STARTUP]    - Require 2FA:', config.authSettings?.require2FA);
      console.log('[STARTUP]    - Cache TTL:', config.configCacheTtlSeconds, 'seconds');
      console.log('[STARTUP]    - Base Client URL:', config.baseClientUrl || '(not set)');

      // Set BETTER_AUTH_SECRET from IDP response if not already set.
      // Also mirror to legacy NEXTAUTH_SECRET during the rename transition
      // so any consumer code still reading the old name keeps working.
      if (config.authSecret && !process.env.BETTER_AUTH_SECRET) {
        process.env.BETTER_AUTH_SECRET = config.authSecret;
        console.log('[STARTUP] Set BETTER_AUTH_SECRET from IDP config');
      }
      if (config.authSecret && !process.env.NEXTAUTH_SECRET) {
        process.env.NEXTAUTH_SECRET = config.authSecret;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[STARTUP] IDP config fetch failed:', errorMsg);

      // No fallback available — IDP config is the only source for the auth secret
      console.error('[STARTUP] No fallback available for auth secret resolution');
    }

    // Step 2: Verify BETTER_AUTH_SECRET is available - FAIL FAST if not
    console.log('[STARTUP] Step 2/2: Verifying BETTER_AUTH_SECRET...');

    const secret = process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret || secret.trim() === '') {
      console.error('');
      console.error('╔══════════════════════════════════════════════════════════════╗');
      console.error('║   ❌ FATAL: BETTER_AUTH_SECRET NOT AVAILABLE                  ║');
      console.error('║                                                              ║');
      console.error('║   The app cannot start without a valid auth signing secret.  ║');
      console.error('║   This should be fetched from IDP at startup.                ║');
      console.error('║                                                              ║');
      console.error('║   Possible causes:                                           ║');
      console.error('║   • IDP is not running or unreachable                        ║');
      console.error('║   • CLIENT_ID is not registered in IDP                       ║');
      console.error('║   • IDP_URL is incorrect                                     ║');
      console.error('║   • Network connectivity issue                               ║');
      console.error('╚══════════════════════════════════════════════════════════════╝');
      console.error('');
      throw new Error('FATAL: BETTER_AUTH_SECRET not available - cannot start without valid secret from IDP');
    }

    console.log('[STARTUP] BETTER_AUTH_SECRET verified (' + secret.length + ' chars)');

    // Step 3: Validate cookie name consistency
    // This catches bugs where getJwtCookieName() returns a different name than
    // what auth-options.ts configures, which causes sessions to fail in production
    const { validateCookieNameConsistency, getSessionCookieName } = await import('./app-slug');
    validateCookieNameConsistency();
    console.log('[STARTUP] Cookie name consistency validated:', getSessionCookieName());

    // All done
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║            PayEz Next MVP Ready for Requests                  ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    initializationComplete = true;
    initializationFailed = false;
    lastInitError = null;
  } catch (error) {
    lastInitError = error instanceof Error ? error : new Error(String(error));
    initializationFailed = true;

    const errorMsg = lastInitError.message || 'Unknown error';
    const isConnectionError = errorMsg.includes('fetch failed') || errorMsg.includes('ECONNREFUSED');
    const idpUrl = (process.env.IDP_URL || 'NOT SET').padEnd(46);
    const clientId = (process.env.CLIENT_ID || 'NOT SET').padEnd(43);

    const connectionLine = isConnectionError
      ? '║   🔌 CONNECTION REFUSED - IDP appears to be down             ║\n║                                                              ║\n'
      : '';

    console.error(`
╔══════════════════════════════════════════════════════════════╗
║   ❌ FATAL: BETTER_AUTH_SECRET NOT AVAILABLE                  ║
║                                                              ║
║   The app cannot start without a valid auth signing secret.  ║
║   This should be fetched from IDP at startup.                ║
║                                                              ║
${connectionLine}║   Possible causes:                                           ║
║   • IDP is not running or unreachable                        ║
║   • CLIENT_ID is not registered in IDP                       ║
║   • IDP_URL is incorrect                                     ║
║   • Network connectivity issue                               ║
║                                                              ║
║   Current config:                                            ║
║   • IDP_URL: ${idpUrl}║
║   • CLIENT_ID: ${clientId}║
╚══════════════════════════════════════════════════════════════╝

[STARTUP] Error: ${errorMsg}
`);

    // Re-throw so callers know initialization failed
    throw lastInitError;
  }
}

/**
 * Get the cached IDP config after initialization.
 * Returns null if not yet initialized.
 */
export function getStartupIDPConfig(): IDPClientConfig | null {
  return cachedIDPConfig;
}

/**
 * Check if initialization failed (auth signing secret couldn't be retrieved)
 */
export function isInitializationFailed(): boolean {
  return initializationFailed;
}

/**
 * Get the last initialization error
 */
export function getInitializationError(): Error | null {
  return lastInitError;
}

/**
 * Check if the app is ready to handle auth requests
 */
export function isAppReady(): boolean {
  return initializationComplete && !initializationFailed;
}
