/**
 * Ready-to-Use Send Code Route
 *
 * Provides a pre-configured handler for sending 2FA verification codes
 * to the user's registered contact methods. Can be imported directly
 * into your app's API routes with zero configuration.
 *
 * @example
 * ```typescript
 * // app/api/account/send-code/route.ts
 * export { POST } from '@payez/next-mvp/routes/account/send-code';
 * ```
 *
 * @version 2.3.0
 * @since auth-ready-v2
 */

// Re-export the POST handler from api-handlers
export { POST } from '../../api-handlers/account/send-code';

/**
 * Pre-configured POST handler for sending verification codes
 *
 * This endpoint triggers the IDP to send a verification code to the
 * user's selected contact method (email or SMS).
 *
 * Request body:
 * - method: 'email' | 'sms' - The contact method to use
 * - contactId: string - ID of the masked contact to send to
 *
 * Environment variables used:
 * - IDP_URL or NEXT_PUBLIC_IDP_URL (default: http://localhost:32785)
 * - CLIENT_ID or NEXT_PUBLIC_IDP_CLIENT_ID (required)
 * - NEXTAUTH_SECRET (required)
 *
 * Returns:
 * - Success status
 * - Rate limit information
 * - Cooldown timer if applicable
 */