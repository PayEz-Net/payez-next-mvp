"use strict";
/**
 * Themed Profile Page for @payez/next-mvp
 *
 * DEPENDENCIES: Only React, Next.js, next-auth, React Query, and Tailwind CSS
 * NO shadcn/ui or other UI library required!
 *
 * FEATURES:
 * ✅ Displays user profile information
 * ✅ Shows email, phone, roles
 * ✅ 2FA status indicator
 * ✅ Themeable styling via ThemeProvider
 * ✅ Uses React Query for data fetching (matches website-membership pattern)
 *
 * USAGE:
 * 1. Import from @payez/next-mvp/pages/profile
 * 2. Wrap your app with ThemeProvider to customize branding
 * 3. Create API route at: src/app/api/account/profile/route.ts
 */
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProfilePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const navigation_1 = require("next/navigation");
const useProfile_1 = require("../../hooks/useProfile");
const useTheme_1 = require("../../theme/useTheme");
function ProfilePage() {
    const router = (0, navigation_1.useRouter)();
    const { data: profileData, isLoading, error } = (0, useProfile_1.useProfile)();
    const branding = (0, useTheme_1.useBranding)();
    const colors = (0, useTheme_1.useColors)();
    const layout = (0, useTheme_1.useLayout)();
    // Loading state
    // Note: Auth protection is handled by middleware - no need to check here
    if (isLoading || !profileData) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen", style: { background: 'var(--bg-default)' }, children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center min-h-[400px]", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center space-y-4", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin h-8 w-8", style: { color: 'var(--text-muted)' }, viewBox: "0 0 24 24", fill: "none", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12 a 8 8 0 0 1 8 -8 v 4 a 4 4 0 0 0 -4 4 H4 z" })] }), (0, jsx_runtime_1.jsx)("p", { style: { color: 'var(--text-muted)' }, children: "Loading profile..." }), error && ((0, jsx_runtime_1.jsx)("p", { className: "text-red-600 text-sm mt-2", children: error.message }))] }) }) }));
    }
    // Get 2FA status from security settings or direct field
    const twoFactorEnabled = profileData.two_factor_enabled ||
        profileData.security_settings?.some((setting) => setting.setting_type?.toLowerCase().includes('2fa') && setting.is_enabled) || false;
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen", style: { background: 'var(--bg-default)' }, children: (0, jsx_runtime_1.jsxs)("div", { className: `${layout?.spacing || 'space-y-6'} ${layout?.maxWidth || 'max-w-4xl'} mx-auto ${layout?.padding || 'p-6'}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-between", children: (0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold", style: { color: 'var(--text-primary)' }, children: "Profile" }) }), (0, jsx_runtime_1.jsxs)("div", { className: `rounded-lg shadow-sm border ${layout?.padding || 'p-6'}`, style: { background: 'var(--bg-card)', borderColor: 'var(--border-default)' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4 mb-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-gray-700 font-semibold text-2xl", children: profileData.email?.charAt(0).toUpperCase() || 'U' }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold text-gray-900", children: profileData.full_name ||
                                                (profileData.first_name || profileData.last_name
                                                    ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
                                                    : profileData.email) }), (0, jsx_runtime_1.jsxs)("p", { className: "text-gray-600 text-sm", children: ["User ID: ", profileData.user_id || profileData.email] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-secondary)' }, children: "Email" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)("p", { style: { color: 'var(--text-primary)' }, children: profileData.email }), profileData.email_confirmed && ((0, jsx_runtime_1.jsx)("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800", children: "\u2713 Verified" }))] })] }), profileData?.phone_number && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-secondary)' }, children: "Phone" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)("p", { style: { color: 'var(--text-primary)' }, children: profileData.phone_number }), profileData.phone_confirmed && ((0, jsx_runtime_1.jsx)("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800", children: "\u2713 Verified" }))] })] })), profileData?.roles && profileData.roles.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-secondary)' }, children: "Roles" }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-2", children: profileData.roles.map((role) => ((0, jsx_runtime_1.jsx)("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-800", children: role }, role))) })] })), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-secondary)' }, children: "Two-Factor Authentication" }), (0, jsx_runtime_1.jsx)("span", { className: `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${profileData?.two_factor_enabled
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'}`, children: profileData?.two_factor_enabled ? '✓ Enabled' : 'Not Active' })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 pt-6 border-t border-gray-200 text-center", children: (0, jsx_runtime_1.jsx)("a", { href: "/account/security", className: "text-gray-600 hover:text-gray-800 text-sm hover:underline", children: "Manage security settings" }) })] })] })] }) }));
}
