/**
 * Update Phone Route
 *
 * Ready-to-use route handler for updating phone number.
 * Used for 2FA setup - users need to add a phone to enable SMS verification.
 *
 * @example
 * ```typescript
 * // app/api/account/update-phone/route.ts
 * export { POST } from '@payez/next-mvp/routes/account/update-phone';
 * ```
 */
export { POST } from '../../api-handlers/account/update-phone';
