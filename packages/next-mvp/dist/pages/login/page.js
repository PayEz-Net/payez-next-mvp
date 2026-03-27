"use strict";
/**
 * Themed Login Page for @payez/next-mvp
 *
 * DEPENDENCIES: Only React, Next.js, next-auth, and Tailwind CSS
 * NO shadcn/ui or other UI library required!
 *
 * FEATURES:
 * ✅ Atomic state management with visual feedback (submitting/error/success)
 * ✅ Enhanced error handling with user-friendly messages
 * ✅ Show/hide password toggle
 * ✅ Loading state management with timeouts
 * ✅ Proper autofill styling
 * ✅ Session expiration handling
 * ✅ Themeable styling via ThemeProvider
 * ✅ Placeholder for health check component
 *
 * USAGE:
 * 1. Import from @payez/next-mvp/pages/login
 * 2. Wrap your app with ThemeProvider to customize branding
 * 3. Optionally add your health check component
 */
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const better_auth_client_1 = require("../../client/better-auth-client");
const navigation_1 = require("next/navigation");
const react_2 = require("react");
const ReservedStatusBox_1 = __importDefault(require("../../components/reserved/ReservedStatusBox"));
const ReservedRecoveryWarning_1 = __importDefault(require("../../components/reserved/ReservedRecoveryWarning"));
const useTheme_1 = require("../../theme/useTheme");
function LoginForm() {
    const searchParams = (0, navigation_1.useSearchParams)();
    const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
    const urlError = searchParams?.get('error');
    const { data: sessionData, isPending } = better_auth_client_1.authClient.useSession();
    const session = sessionData;
    const status = isPending ? 'loading' : session ? 'authenticated' : 'unauthenticated';
    const branding = (0, useTheme_1.useBranding)();
    const colors = (0, useTheme_1.useColors)();
    const layout = (0, useTheme_1.useLayout)();
    // Helper to create lighter/darker shades for hover states
    const adjustBrightness = (hex, percent) => {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    };
    // Get the primary button color from theme (defaults to primary, or uses component override)
    const buttonColor = colors.secondary || colors.primary || '#3b82f6';
    const buttonHoverColor = adjustBrightness(buttonColor, -10);
    // Form fields
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    // Atomic state management - only ONE can be true at a time
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [loginSuccess, setLoginSuccess] = (0, react_1.useState)(false);
    const [loginError, setLoginError] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [showRecoveryOptions, setShowRecoveryOptions] = (0, react_1.useState)(false);
    // Force show form after timeout if stuck in loading
    const [forceShowForm, setForceShowForm] = (0, react_1.useState)(false);
    // Handle URL errors with user-friendly messages
    (0, react_1.useEffect)(() => {
        if (urlError) {
            let friendlyError = urlError;
            if (urlError === 'SessionExpired') {
                // Session expiration is normal - don't show as error
                console.log('[LOGIN] SessionExpired detected - normal behavior');
                friendlyError = null;
            }
            else if (urlError === 'ServiceUnavailable') {
                friendlyError = 'Authentication service is temporarily unavailable. Please try again in a few minutes.';
            }
            else if (urlError.startsWith("Unexpected token")) {
                friendlyError = 'An authentication error occurred. Please try signing in again.';
            }
            else if (urlError.includes('not valid JSON')) {
                friendlyError = 'An authentication error occurred. Please try signing in again.';
            }
            else if (urlError === 'CredentialsSignin') {
                friendlyError = 'Invalid email or password. Please try again.';
            }
            setLoginError(friendlyError);
        }
    }, [urlError]);
    // Timeout to prevent infinite loading states
    (0, react_1.useEffect)(() => {
        if (status === 'loading') {
            const timeout = setTimeout(() => {
                console.warn('[LOGIN] NextAuth status stuck in loading, forcing form display');
                setForceShowForm(true);
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [status]);
    // Force show form after 1 second if no session
    (0, react_1.useEffect)(() => {
        const immediateTimeout = setTimeout(() => {
            if (status === 'loading' && !session) {
                console.log('[LOGIN] Force showing form after 1 second');
                setForceShowForm(true);
            }
        }, 1000);
        return () => clearTimeout(immediateTimeout);
    }, [status, session]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Atomic state: set to submitting (clears error and success)
        setIsSubmitting(true);
        setLoading(true);
        setLoginError(null);
        setLoginSuccess(false);
        try {
            console.log('[LOGIN] Starting authentication...');
            const result = await better_auth_client_1.authClient.signIn.email({
                email,
                password,
                callbackURL: callbackUrl,
            });
            if (result?.error) {
                console.log('[LOGIN] Authentication failed:', result.error);
                setIsSubmitting(false);
                setLoading(false);
                setLoginSuccess(false);
                const errorMsg = typeof result.error === 'object'
                    ? result.error.message || 'Authentication failed'
                    : String(result.error);
                if (errorMsg.includes('password') || errorMsg.includes('Password')) {
                    console.log('[LOGIN] Password error detected - showing recovery options');
                    setShowRecoveryOptions(true);
                    setLoginError(errorMsg);
                }
                else if (errorMsg.includes('Unable to connect')) {
                    setLoginError('The authentication service is currently unavailable. Please try again later.');
                }
                else {
                    setLoginError(errorMsg);
                }
                return;
            }
            // Atomic state: set to success
            console.log('[LOGIN] Authentication successful!');
            setLoginSuccess(true);
            setLoginError(null);
            setIsSubmitting(false);
            // Get updated session
            const freshSession = await better_auth_client_1.authClient.getSession();
            console.log('[LOGIN] Fresh session obtained, redirecting to 2FA...');
            // Redirect to verify-code for 2FA
            const verifyUrl = `/account-auth/verify-code?callbackUrl=${encodeURIComponent(callbackUrl)}`;
            console.log('[LOGIN] Redirecting to:', verifyUrl);
            window.location.href = verifyUrl;
        }
        catch (err) {
            console.error('[LOGIN] Unexpected error:', err);
            // Atomic state: set to error
            setIsSubmitting(false);
            setLoading(false);
            setLoginSuccess(false);
            setLoginError(err instanceof Error ? err.message : 'An error occurred during login');
        }
    };
    // Show loading spinner for initial loads
    if (!forceShowForm && !loginError && (loading || (status === 'loading' && !session))) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: `flex flex-col items-center justify-center min-h-screen ${colors.background}`, children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin h-6 w-6", style: { color: buttonColor }, viewBox: "0 0 24 24", fill: "none", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" })] }), (0, jsx_runtime_1.jsx)("p", { className: `mt-4 text-sm ${colors.muted}`, children: status === 'loading' ? 'Loading...' : 'Authenticating...' })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("style", { dangerouslySetInnerHTML: { __html: `
        .themed-input:focus {
          outline: none;
          border-color: ${buttonColor} !important;
          box-shadow: 0 0 0 2px ${buttonColor}40 !important;
        }
        .themed-button {
          background-color: ${buttonColor} !important;
        }
        .themed-button:hover:not(:disabled) {
          background-color: ${buttonHoverColor} !important;
        }
        .themed-link {
          color: ${buttonColor} !important;
        }
        .themed-link:hover {
          color: ${buttonHoverColor} !important;
        }
        .themed-status-submitting {
          background-color: ${buttonColor}1A !important;
          border-color: ${buttonColor}33 !important;
        }
        .themed-status-submitting-text {
          color: ${buttonColor} !important;
        }
        .themed-status-submitting svg {
          color: ${buttonColor} !important;
        }
      ` } }), (0, jsx_runtime_1.jsx)("div", { className: `min-h-screen flex items-center justify-center px-4 ${colors.background}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-md w-full", children: [(0, jsx_runtime_1.jsxs)("div", { className: `rounded-2xl shadow-xl p-8 ${colors.card} ${colors.border} text-gray-800`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center mb-8", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-3xl font-bold mb-2", style: { color: 'inherit' }, children: branding.tagline || 'Welcome Back' }), (0, jsx_runtime_1.jsx)("p", { className: colors.muted, children: "Sign in to your account" })] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-6", "data-testid": "login-form", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "email", className: "block text-sm font-medium mb-2", style: { color: 'inherit' }, children: "Email Address" }), (0, jsx_runtime_1.jsx)("input", { id: "email", type: "email", required: true, autoFocus: true, autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value), className: `themed-input w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors`, placeholder: "you@example.com", disabled: isSubmitting, style: { backgroundColor: 'white', color: '#1f2937' } })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "password", className: "block text-sm font-medium mb-2", style: { color: 'inherit' }, children: "Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { id: "password", type: showPassword ? "text" : "password", required: true, autoComplete: "current-password", value: password, onChange: (e) => setPassword(e.target.value), className: `themed-input w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg transition-colors`, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", disabled: isSubmitting, style: { backgroundColor: 'white', color: '#1f2937' } }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-1/2 transform -translate-y-1/2 hover:opacity-70", style: { color: 'inherit', opacity: 0.7 }, "aria-label": showPassword ? "Hide password" : "Show password", children: showPassword ? ((0, jsx_runtime_1.jsx)("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", className: "w-5 h-5", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.464 6.464m7.535 7.535l3.415 3.414M3 3l3.464 3.464M21 21l-3.415-3.414" }) })) : ((0, jsx_runtime_1.jsxs)("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", className: "w-5 h-5", children: [(0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }), (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })] })) })] })] }), (0, jsx_runtime_1.jsx)(ReservedStatusBox_1.default, { candidates: [
                                                "Ready",
                                                "Authenticating...",
                                                "The authentication service is currently unavailable. Please try again later.",
                                                "Invalid email or password. Please try again.",
                                                "Login successful! Redirecting..."
                                            ], containerClass: "p-3 text-sm leading-relaxed rounded-lg border", iconSizePx: 16, children: isSubmitting ? (
                                            /* Themed: Submitting */
                                            (0, jsx_runtime_1.jsxs)("div", { className: "themed-status-submitting flex items-start space-x-2 p-3 rounded-lg", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin w-4 h-4 mt-0.5 flex-shrink-0", fill: "none", viewBox: "0 0 24 24", style: { color: buttonColor }, children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), (0, jsx_runtime_1.jsx)("span", { className: "themed-status-submitting-text text-sm leading-relaxed", style: { color: buttonColor }, children: "Authenticating..." })] })) : loginError ? (
                                            /* Red: Error */
                                            (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-4 h-4 bg-red-500 rounded-full mt-0.5 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "text-red-600 text-sm leading-relaxed", children: loginError })] })) : loginSuccess ? (
                                            /* Green: Success */
                                            (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start space-x-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-4 h-4 bg-green-500 rounded-full mt-0.5 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "text-green-600 text-sm leading-relaxed", children: "Login successful! Redirecting..." })] })) : (
                                            /* Ready State / Health Check Placeholder */
                                            (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start space-x-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-4 h-4 bg-green-500 rounded-full mt-0.5 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("span", { className: "text-green-600 text-sm leading-relaxed", children: "Ready" })] })) }), (0, jsx_runtime_1.jsx)(ReservedRecoveryWarning_1.default, { show: showRecoveryOptions, titleText: "Account Lockout Warning", bodyText: "Your account will be locked after one more failed attempt. Need help?", actionLabel: "Start Account Recovery", containerClass: "p-4 bg-amber-50 border border-amber-200 rounded-lg", titleClass: "text-amber-900 font-medium mb-2", bodyClass: "text-amber-800 text-sm mb-3", buttonClass: "w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors", iconSizePx: 20, children: showRecoveryOptions && ((0, jsx_runtime_1.jsx)("div", { className: "p-4 bg-amber-50 border border-amber-200 rounded-lg", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start space-x-3", children: [(0, jsx_runtime_1.jsx)("svg", { className: "w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0", fill: "currentColor", viewBox: "0 0 20 20", children: (0, jsx_runtime_1.jsx)("path", { fillRule: "evenodd", d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z", clipRule: "evenodd" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-amber-900 font-medium mb-2", children: "Account Lockout Warning" }), (0, jsx_runtime_1.jsx)("p", { className: "text-amber-800 text-sm mb-3", children: "Your account will be locked after one more failed attempt. Need help?" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => window.location.href = `/account-auth/recovery?email=${encodeURIComponent(email)}`, className: "w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors", children: "Start Account Recovery" })] })] }) })) }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isSubmitting, className: "themed-button w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center", children: isSubmitting ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Signing in..."] })) : ('Sign In') })] }), (0, jsx_runtime_1.jsx)("div", { className: `mt-6 text-center text-sm ${colors.muted}`, children: (0, jsx_runtime_1.jsx)("a", { href: "/account-auth/recovery", className: "themed-link hover:underline", children: "Start account recovery" }) })] }), (0, jsx_runtime_1.jsxs)("p", { className: `mt-4 text-center text-sm ${colors.muted}`, children: ["Don't have an account?", ' ', (0, jsx_runtime_1.jsx)("a", { href: "/account-auth/register", className: "themed-link font-medium hover:underline", children: "Sign up" })] })] }) })] }));
}
function LoginPageFallback() {
    const colors = (0, useTheme_1.useColors)();
    const buttonColor = colors.secondary || colors.primary || '#11B588';
    return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen flex items-center justify-center ${colors.background}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin h-10 w-10 mx-auto", style: { color: buttonColor }, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), (0, jsx_runtime_1.jsx)("p", { className: `mt-4 ${colors.muted}`, children: "Loading..." })] }) }));
}
function LoginPage() {
    return ((0, jsx_runtime_1.jsx)(react_2.Suspense, { fallback: (0, jsx_runtime_1.jsx)(LoginPageFallback, {}), children: (0, jsx_runtime_1.jsx)(LoginForm, {}) }));
}
