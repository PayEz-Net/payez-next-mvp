/**
 * Themed Security Page for @payez/next-mvp
 *
 * DEPENDENCIES: Only React, Next.js, next-auth, React Query, and Tailwind CSS
 * NO shadcn/ui or other UI library required!
 *
 * FEATURES:
 * - Security summary (2FA status, email status, phone status)
 * - Change password form with policy validation
 * - Themeable styling via ThemeProvider
 * - Uses React Query for data fetching (matches website-membership pattern)
 *
 * USAGE:
 * 1. Import from @payez/next-mvp/pages/security
 * 2. Wrap your app with ThemeProvider to customize branding
 * 3. Create API routes at:
 *    - src/app/api/account/profile/route.ts
 *    - src/app/api/account/change-password/route.ts
 *    - src/app/api/account/validate-password/route.ts
 */
export default function SecurityPage(): import("react/jsx-runtime").JSX.Element;
