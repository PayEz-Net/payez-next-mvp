"use strict";
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
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AdminLoginPage;
exports.AdminLoginForm = AdminLoginForm;
exports.AdminLoginFallback = AdminLoginFallback;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const better_auth_client_1 = require("../../client/better-auth-client");
const navigation_1 = require("next/navigation");
const react_2 = require("react");
const useTheme_1 = require("../../theme/useTheme");
function AdminLoginForm({ title = 'Admin Login', subtitle = 'Authorized personnel only', callbackUrl: propCallbackUrl, logo, }) {
    const searchParams = (0, navigation_1.useSearchParams)();
    const callbackUrl = propCallbackUrl || searchParams?.get('callbackUrl') || '/dashboard';
    const branding = (0, useTheme_1.useBranding)();
    const colors = (0, useTheme_1.useColors)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const result = await better_auth_client_1.authClient.signIn.email({
                email,
                password,
                callbackURL: callbackUrl,
            });
            if (result?.error) {
                const errorMsg = typeof result.error === 'object'
                    ? result.error.message || 'Invalid credentials'
                    : String(result.error);
                setError(errorMsg);
            }
            else if (result?.data) {
                // Redirect to verify-code for 2FA or directly to callback
                window.location.href = `/account-auth/verify-code?callbackUrl=${encodeURIComponent(callbackUrl)}`;
            }
        }
        catch (err) {
            setError('An unexpected error occurred');
        }
        finally {
            setIsLoading(false);
        }
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full", children: [logo && ((0, jsx_runtime_1.jsx)("div", { className: "flex justify-center mb-6", children: logo })), (0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold text-center mb-2 text-slate-900", children: title }), (0, jsx_runtime_1.jsx)("p", { className: "text-center mb-8 text-slate-600", children: subtitle }), error && ((0, jsx_runtime_1.jsx)("div", { className: "mb-6 px-4 py-3 rounded-lg bg-red-500 text-white text-center text-sm", children: error })), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "admin-email", className: "block text-sm font-medium mb-2 text-slate-700", children: "Email" }), (0, jsx_runtime_1.jsx)("input", { id: "admin-email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, disabled: isLoading, autoComplete: "email", className: "w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed", placeholder: "admin@example.com" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "admin-password", className: "block text-sm font-medium mb-2 text-slate-700", children: "Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { id: "admin-password", type: showPassword ? 'text' : 'password', value: password, onChange: (e) => setPassword(e.target.value), required: true, disabled: isLoading, autoComplete: "current-password", className: "w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed", placeholder: "Enter your password" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700", "aria-label": showPassword ? 'Hide password' : 'Show password', children: showPassword ? ((0, jsx_runtime_1.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", className: "w-5 h-5", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.464 6.464m7.535 7.535l3.415 3.414M3 3l3.464 3.464M21 21l-3.415-3.414" }) })) : ((0, jsx_runtime_1.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", className: "w-5 h-5", children: [(0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })] })) })] })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isLoading, className: "w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed", children: isLoading ? ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center justify-center", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white", fill: "none", viewBox: "0 0 24 24", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Signing in..."] })) : ('Sign In') })] }), (0, jsx_runtime_1.jsxs)("p", { className: "mt-6 text-center text-xs text-slate-500", children: ["This login is for authorized administrators only.", (0, jsx_runtime_1.jsx)("br", {}), "All access attempts are logged."] })] }) }));
}
function AdminLoginFallback() {
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin h-10 w-10 mx-auto text-white", fill: "none", viewBox: "0 0 24 24", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-slate-400", children: "Loading..." })] }) }));
}
function AdminLoginPage(props) {
    return ((0, jsx_runtime_1.jsx)(react_2.Suspense, { fallback: (0, jsx_runtime_1.jsx)(AdminLoginFallback, {}), children: (0, jsx_runtime_1.jsx)(AdminLoginForm, { ...props }) }));
}
