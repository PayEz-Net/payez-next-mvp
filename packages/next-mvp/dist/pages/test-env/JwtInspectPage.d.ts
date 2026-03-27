/**
 * Session Inspector Page
 *
 * Debug page for inspecting session data from Redis.
 * Shows user info, roles, 2FA status, and tokens.
 *
 * Usage in consuming app:
 * ```typescript
 * // app/test-env/jwt-inspect/page.tsx
 * export { JwtInspectPage as default } from '@payez/next-mvp/pages/test-env';
 * ```
 */
export declare function JwtInspectPage(): import("react/jsx-runtime").JSX.Element;
export default JwtInspectPage;
