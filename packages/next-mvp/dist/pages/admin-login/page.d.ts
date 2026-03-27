/**
 * Admin Login Page for @payez/next-mvp
 *
 * A standalone username/password login page for admin access.
 * NOT linked from any navigation - only accessible via direct URL.
 *
 * USAGE:
 * 1. Create app/account-auth/admin-login/page.tsx in your Next.js app
 * 2. Re-export this component:
 *    export { default } from '@payez/next-mvp/pages/admin-login';
 *
 * CUSTOMIZATION:
 * - Override styles via CSS variables or wrap with your own component
 * - Provide custom branding via ThemeProvider
 */
import React from 'react';
interface AdminLoginFormProps {
    /** Optional custom title (default: "Admin Login") */
    title?: string;
    /** Optional custom subtitle (default: "Authorized personnel only") */
    subtitle?: string;
    /** Optional callback URL override */
    callbackUrl?: string;
    /** Optional logo component to render */
    logo?: React.ReactNode;
}
declare function AdminLoginForm({ title, subtitle, callbackUrl: propCallbackUrl, logo, }: AdminLoginFormProps): import("react/jsx-runtime").JSX.Element;
declare function AdminLoginFallback(): import("react/jsx-runtime").JSX.Element;
export default function AdminLoginPage(props: AdminLoginFormProps): import("react/jsx-runtime").JSX.Element;
export { AdminLoginForm, AdminLoginFallback };
export type { AdminLoginFormProps };
