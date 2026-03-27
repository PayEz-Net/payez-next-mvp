/**
 * Ready-to-Use Verify SMS Route
 *
 * Provides a pre-configured handler for verifying SMS-based 2FA codes.
 * Can be imported directly into your app's API routes with zero configuration.
 *
 * @example
 * ```typescript
 * // app/api/account/verify-sms/route.ts
 * export { POST } from '@payez/next-mvp/routes/account/verify-sms';
 * ```
 *
 * @version 2.3.0
 * @since auth-ready-v2
 */
export { POST } from '../../api-handlers/account/verify-sms';
/**
 * Pre-configured POST handler for verifying SMS 2FA codes
 *
 * This endpoint verifies the code sent to the user's phone number
 * and upgrades the provisional session to a full session.
 *
 * Request body:
 * - code: string - The 6-digit verification code
 * - phoneId: string - ID of the phone number used
 *
 * Environment variables used:
 * - IDP_URL or NEXT_PUBLIC_IDP_URL (default: http://localhost:32785)
 * - CLIENT_ID or NEXT_PUBLIC_IDP_CLIENT_ID (required)
 * - NEXTAUTH_SECRET (required)
 *
 * Returns:
 * - Upgraded access token with MFA claim
 * - New refresh token
 * - Session upgrade status
 * - AMR (Authentication Methods Reference) array
 * - ACR (Authentication Context Class) level
 */ 
