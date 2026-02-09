/**
 * Emergency Logout Page
 *
 * Nuclear option for clearing auth state when things go wrong.
 * Clears cookies, localStorage, and forces NextAuth signout.
 *
 * Usage in consuming app:
 * ```typescript
 * // app/test-env/emergency-logout/page.tsx
 * export { EmergencyLogoutPage as default } from '@payez/next-mvp/pages/test-env';
 * ```
 */
export declare function EmergencyLogoutPage(): import("react/jsx-runtime").JSX.Element;
export default EmergencyLogoutPage;
