/**
 * Ready-to-Use Masked Info Route
 *
 * Provides a pre-configured handler for fetching masked contact information
 * during 2FA flow. Can be imported directly into your app's API routes with
 * zero configuration.
 *
 * @example
 * ```typescript
 * // app/api/account/masked-info/route.ts
 * export { POST } from '@payez/next-mvp/routes/account/masked-info';
 * ```
 *
 * @version 2.3.0
 * @since auth-ready-v2
 */
export { POST } from '../../api-handlers/account/masked-info';
/**
 * Pre-configured POST handler for masked contact information
 *
 * This endpoint is typically called during the 2FA flow to display masked
 * email/phone options to the user.
 *
 * Environment variables used:
 * - IDP_URL or NEXT_PUBLIC_IDP_URL (default: http://localhost:32785)
 * - CLIENT_ID or NEXT_PUBLIC_IDP_CLIENT_ID (required)
 * - NEXTAUTH_SECRET (required)
 *
 * Returns:
 * - Masked email addresses
 * - Masked phone numbers
 * - Contact method preferences
 */ 
