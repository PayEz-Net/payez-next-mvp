/**
 * Account Route Exports
 *
 * Provides ready-to-use route exports for all 2FA/account management endpoints.
 * These routes handle the complete 2FA flow with zero configuration.
 *
 * @example
 * ```typescript
 * // Import individual routes
 * export { POST } from '@payez/next-mvp/routes/account/masked-info';
 * export { POST } from '@payez/next-mvp/routes/account/send-code';
 * export { POST } from '@payez/next-mvp/routes/account/verify-email';
 * export { POST } from '@payez/next-mvp/routes/account/verify-sms';
 * ```
 *
 * @version 2.3.0
 * @since auth-ready-v2
 */

// Export individual route modules
export * as maskedInfo from './masked-info';
export * as sendCode from './send-code';
export * as verifyEmail from './verify-email';
export * as verifySms from './verify-sms';
export * as updatePhone from './update-phone';

// Re-export POST handlers for convenience (all 2FA endpoints use POST)
export { POST as maskedInfoPOST } from './masked-info';
export { POST as sendCodePOST } from './send-code';
export { POST as verifyEmailPOST } from './verify-email';
export { POST as verifySmsPOST } from './verify-sms';
export { POST as updatePhonePOST } from './update-phone';