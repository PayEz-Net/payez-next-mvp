/**
 * @payez/next-mvp Route Module Exports
 *
 * Ready-to-use route handlers for quick integration
 *
 * @version 2.3.0
 * @since auth-ready-v2
 */

// Export auth routes
export * from './auth';

// Export account/2FA routes
export * from './account';

// Namespace exports for cleaner imports
export * as auth from './auth';
export * as account from './account';