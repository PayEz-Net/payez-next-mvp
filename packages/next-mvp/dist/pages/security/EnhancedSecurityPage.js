"use strict";
/**
 * Enhanced Security Page for @payez/next-mvp
 *
 * Implements BAPert's Member Self-Service spec with:
 * - Password section with change form
 * - Two-factor authentication management
 * - Connected OAuth accounts
 * - Active sessions list
 * - Recent activity log
 * - Danger zone (data export, account deletion)
 *
 * @see docs/specs/MEMBER_SELF_SERVICE_SPEC.md
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
exports.default = EnhancedSecurityPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const useProfile_1 = require("../../hooks/useProfile");
const usePasswordValidation_1 = require("../../hooks/usePasswordValidation");
const useTheme_1 = require("../../theme/useTheme");
// Password Strength Meter Component
function PasswordStrengthMeter({ score, failedRequirements, tip, isDark }) {
    const getColor = (s) => {
        if (s >= 4)
            return 'bg-green-500';
        if (s >= 3)
            return 'bg-yellow-500';
        if (s >= 2)
            return 'bg-orange-500';
        return 'bg-red-500';
    };
    const getLabel = (s) => {
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
    const mutedText = isDark ? 'text-slate-400' : 'text-gray-500';
    const barBg = isDark ? 'bg-slate-600' : 'bg-gray-200';
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("div", { className: `flex-1 h-2 rounded-full overflow-hidden ${barBg}`, children: (0, jsx_runtime_1.jsx)("div", { className: `h-full transition-all duration-300 ${getColor(score)}`, style: { width: `${Math.min(score * 20, 100)}%` } }) }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs w-16 ${mutedText}`, children: getLabel(score) })] }), failedRequirements.length > 0 && ((0, jsx_runtime_1.jsx)("ul", { className: `text-xs space-y-1 ${mutedText}`, children: failedRequirements.map((req, i) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex items-center gap-1", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-red-400", children: "x" }), " ", req] }, i))) })), tip && (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-blue-400", children: tip })] }));
}
// Policy Checklist Component
function PolicyChecklist({ policy, password, isDark }) {
    const checks = react_1.default.useMemo(() => {
        const list = [];
        const minLen = policy?.min_length || 8;
        list.push({ label: `At least ${minLen} characters`, ok: (password?.length || 0) >= minLen });
        if (policy?.require_uppercase)
            list.push({ label: 'One uppercase letter', ok: /[A-Z]/.test(password || '') });
        if (policy?.require_lowercase)
            list.push({ label: 'One lowercase letter', ok: /[a-z]/.test(password || '') });
        if (policy?.require_digit)
            list.push({ label: 'One digit', ok: /\d/.test(password || '') });
        if (policy?.require_special)
            list.push({ label: 'One special character', ok: /[^A-Za-z0-9]/.test(password || '') });
        return list;
    }, [policy, password]);
    const mutedText = isDark ? 'text-slate-400' : 'text-gray-500';
    return ((0, jsx_runtime_1.jsx)("div", { className: "space-y-1 text-xs", children: checks.map((c, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [c.ok ? (0, jsx_runtime_1.jsx)("span", { className: "text-green-400", children: "v" }) : (0, jsx_runtime_1.jsx)("span", { className: mutedText, children: "o" }), (0, jsx_runtime_1.jsx)("span", { className: c.ok ? 'text-green-400' : mutedText, children: c.label })] }, i))) }));
}
// Section Card Component
function SecuritySection({ title, description, children, isDark }) {
    const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
    const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
    return ((0, jsx_runtime_1.jsxs)("div", { className: `rounded-lg border ${cardBg} ${borderColor}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: `px-6 py-4 border-b ${borderColor}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-lg font-semibold ${textPrimary}`, children: title }), description && (0, jsx_runtime_1.jsx)("p", { className: `text-sm mt-1 ${textMuted}`, children: description })] }), (0, jsx_runtime_1.jsx)("div", { className: "px-6 py-4", children: children })] }));
}
// Status Badge Component
function StatusBadge({ enabled, label, isDark }) {
    const bgClass = enabled
        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return ((0, jsx_runtime_1.jsx)("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgClass}`, children: label || (enabled ? 'Enabled' : 'Not Active') }));
}
function formatDate(dateString) {
    if (!dateString)
        return '';
    try {
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    catch {
        return dateString;
    }
}
function formatRelativeTime(dateString) {
    if (!dateString)
        return '';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1)
            return 'Just now';
        if (diffMins < 60)
            return `${diffMins}m ago`;
        if (diffHours < 24)
            return `${diffHours}h ago`;
        if (diffDays < 7)
            return `${diffDays}d ago`;
        return formatDate(dateString);
    }
    catch {
        return dateString;
    }
}
function EnhancedSecurityPage() {
    const { data: profileData, isLoading: isProfileLoading } = (0, useProfile_1.useProfile)();
    const layout = (0, useTheme_1.useLayout)();
    const colors = (0, useTheme_1.useColors)();
    // Security data state (would come from API in production)
    const [securityData, setSecurityData] = (0, react_1.useState)(null);
    const [loadingSecurityData, setLoadingSecurityData] = (0, react_1.useState)(true);
    // Determine dark mode
    const isDark = colors?.background?.includes('slate-9') ||
        colors?.background?.includes('gray-9') ||
        colors?.card?.includes('slate-8');
    // Password form state
    const [formData, setFormData] = (0, react_1.useState)({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [showPasswords, setShowPasswords] = (0, react_1.useState)({ current: false, new: false, confirm: false });
    // Re-authentication modal state (Security Addendum)
    const [reAuthModal, setReAuthModal] = (0, react_1.useState)({ isOpen: false, action: null });
    const [submitting, setSubmitting] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [success, setSuccess] = (0, react_1.useState)('');
    // Password validation
    const { setPassword: validateNewPassword, isValid: newPasswordIsValid, score: newPasswordScore, failedRequirements, tip, policy } = (0, usePasswordValidation_1.usePasswordValidation)({ debounceMs: 250 });
    (0, react_1.useEffect)(() => { validateNewPassword(formData.new_password); }, [formData.new_password, validateNewPassword]);
    // Fetch security data
    const fetchSecurityData = (0, react_1.useCallback)(async () => {
        try {
            setLoadingSecurityData(true);
            const res = await fetch('/api/account/security');
            if (res.ok) {
                const data = await res.json();
                setSecurityData(data);
            }
        }
        catch (err) {
            // Security data fetch is optional - page still works without it
        }
        finally {
            setLoadingSecurityData(false);
        }
    }, []);
    (0, react_1.useEffect)(() => {
        if (profileData)
            fetchSecurityData();
    }, [profileData, fetchSecurityData]);
    const passwordsMatch = formData.confirm_password.length > 0 && formData.new_password === formData.confirm_password;
    const canSubmit = !submitting && newPasswordIsValid && passwordsMatch && formData.current_password.length > 0;
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!canSubmit)
            return;
        try {
            setSubmitting(true);
            const response = await fetch('/api/account/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                let errorMsg = result.message || 'Failed to change password';
                if (result.details?.value?.[0]?.message)
                    errorMsg = result.details.value[0].message;
                setError(errorMsg);
                return;
            }
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
    // Theme classes
    const bgClass = isDark ? 'bg-slate-900' : 'bg-gray-50';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textSecondary = isDark ? 'text-slate-300' : 'text-gray-600';
    const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
    const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
    const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
    const elevatedBg = isDark ? 'bg-slate-700' : 'bg-gray-100';
    const inputBg = isDark ? 'bg-slate-800' : 'bg-white';
    const inputBorder = isDark ? 'border-slate-600' : 'border-gray-300';
    const inputText = isDark ? 'text-white placeholder-slate-400' : 'text-gray-900 placeholder-gray-400';
    // Loading state
    if (isProfileLoading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen ${bgClass} flex items-center justify-center`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center space-y-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" }), (0, jsx_runtime_1.jsx)("p", { className: textMuted, children: "Loading security settings..." })] }) }));
    }
    const twoFactorEnabled = profileData?.two_factor_enabled || securityData?.two_factor?.enabled || false;
    const twoFactorMethod = securityData?.two_factor?.method_display || (twoFactorEnabled ? 'SMS' : undefined);
    return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen ${bgClass}`, children: (0, jsx_runtime_1.jsxs)("div", { className: `${layout?.maxWidth || 'max-w-3xl'} mx-auto ${layout?.padding || 'p-6'} space-y-6`, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: `text-2xl font-bold ${textPrimary}`, children: "Security" }), (0, jsx_runtime_1.jsx)("p", { className: `mt-1 ${textMuted}`, children: "Manage your account security settings" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `rounded-lg border ${cardBg} ${borderColor} p-6`, children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-lg font-semibold mb-4 ${textPrimary}`, children: "Security Summary" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${elevatedBg}`, children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm font-medium mb-2 ${textSecondary}`, children: "2FA Status" }), (0, jsx_runtime_1.jsx)(StatusBadge, { enabled: twoFactorEnabled, isDark: isDark }), twoFactorMethod && (0, jsx_runtime_1.jsxs)("p", { className: `text-xs mt-2 ${textMuted}`, children: ["Method: ", twoFactorMethod] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${elevatedBg}`, children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm font-medium mb-2 ${textSecondary}`, children: "Email Status" }), (0, jsx_runtime_1.jsx)(StatusBadge, { enabled: profileData?.email_confirmed || false, label: profileData?.email_confirmed ? 'Verified' : 'Not Verified', isDark: isDark }), (0, jsx_runtime_1.jsx)("p", { className: `text-xs mt-2 ${textMuted} truncate`, children: profileData?.email })] }), (0, jsx_runtime_1.jsxs)("div", { className: `p-4 rounded-lg ${elevatedBg}`, children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm font-medium mb-2 ${textSecondary}`, children: "Phone Status" }), (0, jsx_runtime_1.jsx)(StatusBadge, { enabled: profileData?.phone_confirmed || false, label: profileData?.phone_confirmed ? 'Verified' : 'Not Verified', isDark: isDark }), profileData?.phone_number && (0, jsx_runtime_1.jsx)("p", { className: `text-xs mt-2 ${textMuted}`, children: profileData.phone_number })] })] })] }), (0, jsx_runtime_1.jsx)(SecuritySection, { title: "Password", description: securityData?.password?.last_changed ? `Last changed ${formatDate(securityData.password.last_changed)}` : undefined, isDark: isDark, children: (0, jsx_runtime_1.jsxs)("form", { onSubmit: handlePasswordSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium mb-2 ${textSecondary}`, children: "Current Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: showPasswords.current ? 'text' : 'password', value: formData.current_password, onChange: e => setFormData({ ...formData, current_password: e.target.value }), className: `w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputBorder} ${inputText}`, placeholder: "Enter current password", disabled: submitting }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPasswords(p => ({ ...p, current: !p.current })), className: `absolute inset-y-0 right-2 flex items-center ${textMuted}`, children: showPasswords.current ? 'Hide' : 'Show' })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium mb-2 ${textSecondary}`, children: "New Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: showPasswords.new ? 'text' : 'password', value: formData.new_password, onChange: e => setFormData({ ...formData, new_password: e.target.value }), className: `w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputBorder} ${inputText}`, placeholder: "Enter new password", disabled: submitting }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPasswords(p => ({ ...p, new: !p.new })), className: `absolute inset-y-0 right-2 flex items-center ${textMuted}`, children: showPasswords.new ? 'Hide' : 'Show' })] }), formData.new_password && ((0, jsx_runtime_1.jsx)("div", { className: "mt-2", children: (0, jsx_runtime_1.jsx)(PasswordStrengthMeter, { score: newPasswordScore, failedRequirements: failedRequirements, tip: tip, isDark: isDark }) })), policy && formData.new_password && ((0, jsx_runtime_1.jsx)("div", { className: "mt-3", children: (0, jsx_runtime_1.jsx)(PolicyChecklist, { policy: policy, password: formData.new_password, isDark: isDark }) }))] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: `block text-sm font-medium mb-2 ${textSecondary}`, children: "Confirm New Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: showPasswords.confirm ? 'text' : 'password', value: formData.confirm_password, onChange: e => setFormData({ ...formData, confirm_password: e.target.value }), className: `w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputBorder} ${inputText}`, placeholder: "Confirm new password", disabled: submitting }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPasswords(p => ({ ...p, confirm: !p.confirm })), className: `absolute inset-y-0 right-2 flex items-center ${textMuted}`, children: showPasswords.confirm ? 'Hide' : 'Show' })] }), formData.confirm_password && !passwordsMatch && (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-red-400", children: "Passwords do not match" }), formData.confirm_password && passwordsMatch && (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-green-400", children: "Passwords match" })] }), error && (0, jsx_runtime_1.jsx)("div", { className: "bg-red-900/30 border border-red-600 rounded-lg p-3", children: (0, jsx_runtime_1.jsx)("p", { className: "text-red-400 text-sm", children: error }) }), success && (0, jsx_runtime_1.jsx)("div", { className: "bg-green-900/30 border border-green-600 rounded-lg p-3", children: (0, jsx_runtime_1.jsx)("p", { className: "text-green-400 text-sm", children: success }) }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: !canSubmit, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed", children: submitting ? 'Changing...' : 'Change Password' })] }) }), (0, jsx_runtime_1.jsx)(SecuritySection, { title: "Two-Factor Authentication", description: "Add an extra layer of security to your account", isDark: isDark, children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `font-medium ${textPrimary}`, children: "Status" }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMuted}`, children: twoFactorEnabled ? `Enabled via ${twoFactorMethod || 'SMS'}` : 'Not enabled' })] }), (0, jsx_runtime_1.jsx)(StatusBadge, { enabled: twoFactorEnabled, isDark: isDark })] }), twoFactorEnabled ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsx)("button", { className: `px-3 py-1.5 text-sm rounded border ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'} ${textSecondary}`, children: "Change Method" }), (0, jsx_runtime_1.jsx)("button", { className: "px-3 py-1.5 text-sm rounded border border-red-500 text-red-500 hover:bg-red-500/10", children: "Disable 2FA" })] })) : ((0, jsx_runtime_1.jsx)("button", { className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700", children: "Enable 2FA" })), securityData?.two_factor?.backup_codes_remaining !== undefined && ((0, jsx_runtime_1.jsxs)("div", { className: `mt-4 p-3 rounded-lg ${elevatedBg}`, children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textSecondary}`, children: "Backup Codes" }), (0, jsx_runtime_1.jsxs)("p", { className: textMuted, children: ["You have ", securityData.two_factor.backup_codes_remaining, " of 10 backup codes remaining"] }), (0, jsx_runtime_1.jsx)("button", { className: `mt-2 text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`, children: "View Codes" })] }))] }) }), (0, jsx_runtime_1.jsxs)(SecuritySection, { title: "Connected Accounts", description: "OAuth providers linked to your account", isDark: isDark, children: [securityData?.connected_accounts && securityData.connected_accounts.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: securityData.connected_accounts.map((account, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center justify-between p-3 rounded-lg ${elevatedBg}`, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `font-medium ${textPrimary}`, children: account.provider }), account.email && (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMuted}`, children: account.email }), account.connected_at && (0, jsx_runtime_1.jsxs)("p", { className: `text-xs ${textMuted}`, children: ["Connected ", formatDate(account.connected_at)] })] }), account.can_disconnect && ((0, jsx_runtime_1.jsx)("button", { className: "text-sm text-red-500 hover:text-red-400", children: "Disconnect" }))] }, idx))) })) : ((0, jsx_runtime_1.jsx)("p", { className: textMuted, children: "No connected accounts" })), (0, jsx_runtime_1.jsx)("button", { className: `mt-4 text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`, children: "Connect Another Account" })] }), (0, jsx_runtime_1.jsxs)(SecuritySection, { title: "Active Sessions", description: "Devices currently logged into your account", isDark: isDark, children: [securityData?.active_sessions && securityData.active_sessions.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: securityData.active_sessions.map((session, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center justify-between p-3 rounded-lg ${elevatedBg}`, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("p", { className: `font-medium ${textPrimary}`, children: session.device_name || 'Unknown Device' }), session.is_current && (0, jsx_runtime_1.jsx)("span", { className: "px-2 py-0.5 rounded text-xs bg-blue-500 text-white", children: "This Device" })] }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMuted}`, children: session.location || session.ip_address }), (0, jsx_runtime_1.jsx)("p", { className: `text-xs ${textMuted}`, children: session.is_current ? 'Active now' : `Last active ${formatRelativeTime(session.last_active_at)}` })] }), !session.is_current && ((0, jsx_runtime_1.jsx)("button", { className: "text-sm text-red-500 hover:text-red-400", children: "Revoke" }))] }, idx))) })) : ((0, jsx_runtime_1.jsx)("p", { className: textMuted, children: "Session information not available" })), (0, jsx_runtime_1.jsx)("button", { className: "mt-4 text-sm text-red-500 hover:text-red-400", children: "Sign Out All Other Devices" })] }), (0, jsx_runtime_1.jsxs)(SecuritySection, { title: "Recent Activity", description: "Security events on your account", isDark: isDark, children: [securityData?.recent_activity && securityData.recent_activity.length > 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: securityData.recent_activity.slice(0, 5).map((activity, idx) => ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center justify-between py-2 border-b last:border-b-0 ${borderColor}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: activity.success ? 'text-green-400' : 'text-red-400', children: activity.success ? 'v' : 'x' }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textPrimary}`, children: activity.description }), activity.device && (0, jsx_runtime_1.jsx)("p", { className: `text-xs ${textMuted}`, children: activity.device })] })] }), (0, jsx_runtime_1.jsx)("p", { className: `text-xs ${textMuted}`, children: formatRelativeTime(activity.timestamp) })] }, idx))) })) : ((0, jsx_runtime_1.jsx)("p", { className: textMuted, children: "No recent activity" })), (0, jsx_runtime_1.jsx)("button", { className: `mt-4 text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`, children: "View Full History" })] }), (0, jsx_runtime_1.jsx)(SecuritySection, { title: "Danger Zone", description: "Irreversible actions", isDark: isDark, children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: `flex items-center justify-between p-4 rounded-lg border border-yellow-500/50`, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `font-medium ${textPrimary}`, children: "Download My Data" }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMuted}`, children: "Get a copy of all your personal data" })] }), (0, jsx_runtime_1.jsx)("button", { className: "px-4 py-2 text-sm rounded border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10", children: "Request Export" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `flex items-center justify-between p-4 rounded-lg border border-red-500/50`, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: `font-medium ${textPrimary}`, children: "Delete Account" }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textMuted}`, children: "Permanently delete your account and all data" })] }), (0, jsx_runtime_1.jsx)("button", { className: "px-4 py-2 text-sm rounded border border-red-500 text-red-500 hover:bg-red-500/10", children: "Delete Account" })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "text-center", children: (0, jsx_runtime_1.jsx)("a", { href: "/account/profile", className: `text-sm hover:underline ${textMuted}`, children: "Back to Profile" }) })] }) }));
}
