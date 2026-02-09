"use strict";
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
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SecurityPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const useProfile_1 = require("../../hooks/useProfile");
const usePasswordValidation_1 = require("../../hooks/usePasswordValidation");
const useTheme_1 = require("../../theme/useTheme");
// Inline PasswordStrengthMeter component
function PasswordStrengthMeter({ score, failedRequirements, tip, isDarkMode = false, }) {
    const getStrengthColor = (s) => {
        if (s >= 4)
            return 'bg-green-500';
        if (s >= 3)
            return 'bg-yellow-500';
        if (s >= 2)
            return 'bg-orange-500';
        return 'bg-red-500';
    };
    const getStrengthLabel = (s) => {
        if (s >= 4)
            return 'Strong';
        if (s >= 3)
            return 'Good';
        if (s >= 2)
            return 'Fair';
        if (s >= 1)
            return 'Weak';
        return 'Very Weak';
    };
    const mutedTextClass = isDarkMode ? 'text-slate-400' : 'text-gray-500';
    const barBgClass = isDarkMode ? 'bg-slate-600' : 'bg-gray-200';
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: `flex-1 h-2 rounded-full overflow-hidden ${barBgClass}`, children: (0, jsx_runtime_1.jsx)("div", { className: `h-full transition-all duration-300 ${getStrengthColor(score)}`, style: { width: `${Math.min(score * 20, 100)}%` } }) }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs w-16 ${mutedTextClass}`, children: getStrengthLabel(score) })] }), failedRequirements.length > 0 && ((0, jsx_runtime_1.jsx)("ul", { className: `text-xs space-y-1 ${mutedTextClass}`, children: failedRequirements.map((req, i) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-red-400", children: "\u00D7" }), " ", req] }, i))) })), tip && ((0, jsx_runtime_1.jsx)("p", { className: "text-xs text-blue-400", children: tip }))] }));
}
// Inline PasswordPolicyChecklist component
function PasswordPolicyChecklist({ policy, password, isDarkMode = false, }) {
    const checks = react_1.default.useMemo(() => {
        const list = [];
        const minLen = typeof policy?.min_length === 'number' && policy.min_length > 0 ? policy.min_length : 8;
        list.push({ label: `At least ${minLen} characters`, ok: (password?.length || 0) >= minLen });
        if (policy?.require_uppercase)
            list.push({ label: 'One uppercase letter (A-Z)', ok: /[A-Z]/.test(password || '') });
        if (policy?.require_lowercase)
            list.push({ label: 'One lowercase letter (a-z)', ok: /[a-z]/.test(password || '') });
        if (policy?.require_digit)
            list.push({ label: 'One digit (0-9)', ok: /\d/.test(password || '') });
        if (policy?.require_special)
            list.push({ label: 'One special character (!@#$% etc.)', ok: /[^A-Za-z0-9]/.test(password || '') });
        return list;
    }, [policy, password]);
    const mutedTextClass = isDarkMode ? 'text-slate-400' : 'text-gray-500';
    const successTextClass = 'text-green-400';
    return ((0, jsx_runtime_1.jsx)("div", { className: "space-y-1 text-xs", children: checks.map((c, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [c.ok ? ((0, jsx_runtime_1.jsx)("span", { className: successTextClass, children: "\u2713" })) : ((0, jsx_runtime_1.jsx)("span", { className: mutedTextClass, children: "\u25CB" })), (0, jsx_runtime_1.jsx)("span", { className: c.ok ? successTextClass : mutedTextClass, children: c.label })] }, i))) }));
}
function SecurityPage() {
    const { data: profileData, isLoading: isProfileLoading } = (0, useProfile_1.useProfile)();
    const layout = (0, useTheme_1.useLayout)();
    const colors = (0, useTheme_1.useColors)();
    // Determine if dark mode based on background color
    const isDarkMode = colors?.background?.includes('slate-9') ||
        colors?.background?.includes('gray-9') ||
        colors?.background?.includes('dark') ||
        colors?.card?.includes('slate-8') ||
        colors?.card?.includes('gray-8');
    // Password form state
    const [formData, setFormData] = (0, react_1.useState)({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [showPasswords, setShowPasswords] = (0, react_1.useState)({
        current: false,
        new: false,
        confirm: false,
    });
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [success, setSuccess] = (0, react_1.useState)('');
    // Password validation
    const { setPassword: validateNewPassword, isValid: newPasswordIsValid, score: newPasswordScore, failedRequirements, tip, policy, } = (0, usePasswordValidation_1.usePasswordValidation)({ debounceMs: 250 });
    // Validate new password on change
    (0, react_1.useEffect)(() => {
        validateNewPassword(formData.new_password);
    }, [formData.new_password, validateNewPassword]);
    const passwordsMatch = formData.confirm_password.length > 0 && formData.new_password === formData.confirm_password;
    const canSubmit = !submitting && newPasswordIsValid && passwordsMatch && formData.current_password.length > 0;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
            setError('All fields are required');
            return;
        }
        if (formData.new_password !== formData.confirm_password) {
            setError('New password and confirmation do not match');
            return;
        }
        if (!newPasswordIsValid) {
            setError('Please meet the password requirements before submitting');
            return;
        }
        try {
            setSubmitting(true);
            const response = await fetch('/api/account/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: formData.current_password,
                    new_password: formData.new_password,
                    confirm_password: formData.confirm_password,
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                // Extract error message
                let errorMsg = result.message || 'Failed to change password';
                if (result.details?.value && Array.isArray(result.details.value) && result.details.value.length > 0) {
                    errorMsg = result.details.value[0].message || errorMsg;
                }
                else if (result.details?.message) {
                    errorMsg = result.details.message;
                }
                setError(errorMsg);
                return;
            }
            // Success
            setSuccess(result.message || 'Password changed successfully');
            setFormData({ current_password: '', new_password: '', confirm_password: '' });
        }
        catch (err) {
            setError(err.message || 'Failed to change password');
        }
        finally {
            setSubmitting(false);
        }
    };
    // Determine loading state colors before any early returns
    const loadingTextClass = isDarkMode ? 'text-slate-400' : 'text-gray-500';
    // Loading state
    if (isProfileLoading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen", children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center min-h-[400px]", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center space-y-4", children: [(0, jsx_runtime_1.jsxs)("svg", { className: `animate-spin h-8 w-8 ${loadingTextClass}`, viewBox: "0 0 24 24", fill: "none", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12 a 8 8 0 0 1 8 -8 v 4 a 4 4 0 0 0 -4 4 H4 z" })] }), (0, jsx_runtime_1.jsx)("p", { className: loadingTextClass, children: "Loading security settings..." })] }) }) }));
    }
    // Theme-aware styling using colors from ThemeProvider
    const cardBgClass = colors?.card || 'bg-white';
    const borderClass = colors?.border || 'border-gray-200';
    // Text colors based on dark/light mode
    const textPrimaryClass = isDarkMode ? 'text-white' : 'text-gray-900';
    const textSecondaryClass = isDarkMode ? 'text-slate-300' : 'text-gray-600';
    const textMutedClass = isDarkMode ? 'text-slate-400' : 'text-gray-500';
    // Input styling
    const inputBgClass = isDarkMode ? 'bg-slate-800' : 'bg-white';
    const inputBorderClass = isDarkMode ? 'border-slate-600' : 'border-gray-300';
    const inputTextClass = isDarkMode ? 'text-white placeholder-slate-400' : 'text-gray-900 placeholder-gray-400';
    // Elevated surfaces (status boxes)
    const elevatedBgClass = isDarkMode ? 'bg-slate-700' : 'bg-gray-100';
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen", children: (0, jsx_runtime_1.jsxs)("div", { className: `${layout?.spacing || 'space-y-6'} ${layout?.maxWidth || 'max-w-4xl'} mx-auto ${layout?.padding || 'p-6'}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-between", children: (0, jsx_runtime_1.jsx)("h1", { className: `text-3xl font-bold ${textPrimaryClass}`, children: "Security" }) }), (0, jsx_runtime_1.jsxs)("div", { className: `rounded-lg shadow-sm border p-6 ${cardBgClass} ${borderClass}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-xl font-semibold mb-4 ${textPrimaryClass}`, children: "Security Summary" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${elevatedBgClass}`, children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm font-medium mb-2 ${textSecondaryClass}`, children: "2FA Status" }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center space-x-2", children: (0, jsx_runtime_1.jsx)("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profileData?.two_factor_enabled ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`, children: profileData?.two_factor_enabled ? 'Enabled' : 'Not Active' }) }), !profileData?.two_factor_enabled && ((0, jsx_runtime_1.jsx)("p", { className: `text-xs mt-2 ${textMutedClass}`, children: "Self-service 2FA enrollment coming soon" }))] }), (0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${elevatedBgClass}`, children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm font-medium mb-2 ${textSecondaryClass}`, children: "Email Status" }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center space-x-2", children: (0, jsx_runtime_1.jsx)("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profileData?.email_confirmed ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`, children: profileData?.email_confirmed ? 'Verified' : 'Not Verified' }) }), (0, jsx_runtime_1.jsx)("p", { className: `text-xs mt-2 ${textPrimaryClass}`, children: profileData?.email })] }), (0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${elevatedBgClass}`, children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm font-medium mb-2 ${textSecondaryClass}`, children: "Phone Status" }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center space-x-2", children: (0, jsx_runtime_1.jsx)("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profileData?.phone_confirmed ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`, children: profileData?.phone_confirmed ? 'Verified' : 'Not Verified' }) }), profileData?.phone_number && ((0, jsx_runtime_1.jsx)("p", { className: `text-xs mt-2 ${textPrimaryClass}`, children: profileData.phone_number }))] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `rounded-lg shadow-sm border p-6 ${cardBgClass} ${borderClass}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-xl font-semibold mb-4 ${textPrimaryClass}`, children: "Change Password" }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium mb-2 ${textSecondaryClass}`, children: "Current Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: showPasswords.current ? 'text' : 'password', value: formData.current_password, onChange: e => setFormData({ ...formData, current_password: e.target.value }), className: `w-full px-3 py-2 rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`, placeholder: "Enter current password", disabled: submitting, required: true }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPasswords(p => ({ ...p, current: !p.current })), className: `absolute inset-y-0 right-2 flex items-center ${textMutedClass}`, children: showPasswords.current ? '👁️' : '👁️‍🗨️' })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium mb-2 ${textSecondaryClass}`, children: "New Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: showPasswords.new ? 'text' : 'password', value: formData.new_password, onChange: e => setFormData({ ...formData, new_password: e.target.value }), className: `w-full px-3 py-2 rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`, placeholder: "Enter new password", disabled: submitting, required: true }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPasswords(p => ({ ...p, new: !p.new })), className: `absolute inset-y-0 right-2 flex items-center ${textMutedClass}`, children: showPasswords.new ? '👁️' : '👁️‍🗨️' })] }), formData.new_password && ((0, jsx_runtime_1.jsx)("div", { className: "mt-2", children: (0, jsx_runtime_1.jsx)(PasswordStrengthMeter, { score: newPasswordScore, failedRequirements: failedRequirements, tip: tip, isDarkMode: isDarkMode }) })), policy && formData.new_password && ((0, jsx_runtime_1.jsx)("div", { className: "mt-3", children: (0, jsx_runtime_1.jsx)(PasswordPolicyChecklist, { policy: policy, password: formData.new_password, isDarkMode: isDarkMode }) }))] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium mb-2 ${textSecondaryClass}`, children: "Confirm New Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: showPasswords.confirm ? 'text' : 'password', value: formData.confirm_password, onChange: e => setFormData({ ...formData, confirm_password: e.target.value }), className: `w-full px-3 py-2 rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`, placeholder: "Confirm new password", disabled: submitting, required: true }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPasswords(p => ({ ...p, confirm: !p.confirm })), className: `absolute inset-y-0 right-2 flex items-center ${textMutedClass}`, children: showPasswords.confirm ? '👁️' : '👁️‍🗨️' })] }), formData.confirm_password && !passwordsMatch && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-red-400", children: "Passwords do not match" })), formData.confirm_password && passwordsMatch && ((0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-green-400", children: "Passwords match" }))] }), error && ((0, jsx_runtime_1.jsx)("div", { className: "bg-red-900/30 border border-red-600 rounded-lg p-3", children: (0, jsx_runtime_1.jsx)("p", { className: "text-red-400 text-sm", children: error }) })), success && ((0, jsx_runtime_1.jsx)("div", { className: "bg-green-900/30 border border-green-600 rounded-lg p-3", children: (0, jsx_runtime_1.jsx)("p", { className: "text-green-400 text-sm", children: success }) })), (0, jsx_runtime_1.jsx)("div", { className: "pt-2", children: (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: !canSubmit, className: "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed", children: submitting ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", fill: "none", viewBox: "0 0 24 24", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12 a 8 8 0 0 1 8 -8 v 4 a 4 4 0 0 0 -4 4 H4 z" })] }), "Changing..."] })) : ('Change Password') }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `rounded-lg shadow-sm border p-6 ${cardBgClass} ${borderClass}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-xl font-semibold mb-4 ${textPrimaryClass}`, children: "Additional Security Features" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: `flex items-center justify-between p-4 rounded-lg opacity-60 ${elevatedBgClass}`, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm font-medium ${textPrimaryClass}`, children: "Active Sessions" }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMutedClass}`, children: "View and manage your active login sessions" })] }), (0, jsx_runtime_1.jsx)("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'}`, children: "Coming Soon" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `flex items-center justify-between p-4 rounded-lg opacity-60 ${elevatedBgClass}`, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm font-medium ${textPrimaryClass}`, children: "2FA Management" }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMutedClass}`, children: "Enable or configure two-factor authentication" })] }), (0, jsx_runtime_1.jsx)("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'}`, children: "Coming Soon" })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "text-center", children: (0, jsx_runtime_1.jsx)("a", { href: "/account/profile", className: `text-sm hover:underline ${textMutedClass}`, children: "\u2190 Back to Profile" }) })] }) }));
}
