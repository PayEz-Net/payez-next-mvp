/**
 * Ready-to-Use Refresh Viability Route
 *
 * Checks if a session has a valid refresh token for automatic refresh.
 * Used by middleware to decide whether to attempt refresh or redirect to login.
 *
 * @example
 * ```typescript
 * // app/api/session/refresh-viability/route.ts
 * export { GET } from '@payez/next-mvp/routes/session/refresh-viability';
 * ```
 *
 * @version 2.0.0
 * @since auth-ready-v2
 */
export { GET } from '../../api-handlers/session/refresh-viability';
