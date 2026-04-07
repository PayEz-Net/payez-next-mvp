"use strict";
/**
 * Enhanced Profile Page for @payez/next-mvp
 *
 * Implements BAPert's Member Self-Service spec with:
 * - Identity header (avatar, name, email, phone, member since)
 * - Personal info section (first name, last name, title, bio)
 * - Contact info section (secondary email/phone, website)
 * - Address section with state/country dropdowns
 * - Edit capabilities with inline forms
 *
 * @see docs/specs/MEMBER_SELF_SERVICE_SPEC.md
 */
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EnhancedProfilePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const useProfile_1 = require("../../hooks/useProfile");
const useTheme_1 = require("../../theme/useTheme");
function EditableSection({ title, children, onEdit, isEditing, onSave, onCancel, isDarkMode }) {
    const cardBg = isDarkMode ? 'bg-slate-800' : 'bg-white';
    const borderColor = isDarkMode ? 'border-slate-700' : 'border-gray-200';
    const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
    const textSecondary = isDarkMode ? 'text-slate-300' : 'text-gray-600';
    return ((0, jsx_runtime_1.jsxs)("div", { className: `rounded-lg border ${cardBg} ${borderColor}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: `flex items-center justify-between px-6 py-4 border-b ${borderColor}`, children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-lg font-semibold ${textPrimary}`, children: title }), !isEditing && onEdit && ((0, jsx_runtime_1.jsx)("button", { onClick: onEdit, className: `text-sm font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`, children: "Edit" })), isEditing && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: onCancel, className: `text-sm font-medium ${textSecondary} hover:${textPrimary}`, children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { onClick: onSave, className: "text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded", children: "Save" })] }))] }), (0, jsx_runtime_1.jsx)("div", { className: "px-6 py-4", children: children })] }));
}
function FieldRow({ label, value, verified, action, isDarkMode }) {
    const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
    const textSecondary = isDarkMode ? 'text-slate-400' : 'text-gray-500';
    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between py-3 border-b last:border-b-0 border-slate-700/30", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("p", { className: `text-sm ${textSecondary}`, children: label }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mt-1", children: [(0, jsx_runtime_1.jsx)("span", { className: textPrimary, children: value || '—' }), verified !== undefined && ((0, jsx_runtime_1.jsx)("span", { className: `inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${verified ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`, children: verified ? '✓ Verified' : 'Not Verified' }))] })] }), action && (0, jsx_runtime_1.jsx)("div", { className: "ml-4", children: action })] }));
}
function formatDate(dateString) {
    if (!dateString)
        return '—';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    catch {
        return dateString;
    }
}
function formatRelativeTime(dateString) {
    if (!dateString)
        return '—';
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
            return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
        if (diffHours < 24)
            return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        if (diffDays < 7)
            return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        return formatDate(dateString);
    }
    catch {
        return dateString;
    }
}
function EnhancedProfilePage() {
    const { data: rawProfile, isLoading, error, refetch } = (0, useProfile_1.useProfile)();
    const layout = (0, useTheme_1.useLayout)();
    const colors = (0, useTheme_1.useColors)();
    // Normalize profile data (handles both new structured and legacy flat formats)
    const profile = react_1.default.useMemo(() => {
        if (!rawProfile)
            return {};
        // If data already has identity section, use as-is
        if (rawProfile.identity) {
            return rawProfile;
        }
        // Convert legacy flat format to structured format
        return {
            user_id: rawProfile.user_id,
            identity: {
                email: rawProfile.email || '',
                email_confirmed: rawProfile.email_confirmed,
                phone_number: rawProfile.phone_number,
                phone_confirmed: rawProfile.phone_confirmed,
                full_name: rawProfile.full_name ||
                    [rawProfile.first_name, rawProfile.last_name].filter(Boolean).join(' ') ||
                    rawProfile.email,
                avatar_url: null,
                created_at: undefined,
                last_sign_in: undefined,
            },
            personal_info: {
                first_name: rawProfile.first_name,
                last_name: rawProfile.last_name,
                title: undefined,
                bio: undefined,
            },
            contact_info: rawProfile.contact_information ? {
                secondary_email: rawProfile.contact_information.secondary_email,
                secondary_phone: rawProfile.contact_information.secondary_phone,
                website: rawProfile.contact_information.website,
            } : undefined,
            address: rawProfile.contact_information ? {
                address_line_1: rawProfile.contact_information.addressLine1,
                address_line_2: rawProfile.contact_information.addressLine2,
                city: rawProfile.contact_information.city,
                state_id: rawProfile.contact_information.stateId,
                state_name: rawProfile.contact_information.stateName,
                postal_code: rawProfile.contact_information.postalCode,
                country_code: rawProfile.contact_information.countryCode,
                country_name: rawProfile.contact_information.countryName,
            } : undefined,
            two_factor_enabled: rawProfile.two_factor_enabled,
            roles: rawProfile.roles,
        };
    }, [rawProfile]);
    // Determine dark mode
    const isDarkMode = colors?.background?.includes('slate-9') ||
        colors?.background?.includes('gray-9') ||
        colors?.background?.includes('dark') ||
        colors?.card?.includes('slate-8');
    // Theme classes
    const bgClass = isDarkMode ? 'bg-slate-900' : 'bg-gray-50';
    const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
    const textSecondary = isDarkMode ? 'text-slate-300' : 'text-gray-600';
    const textMuted = isDarkMode ? 'text-slate-400' : 'text-gray-500';
    const cardBg = isDarkMode ? 'bg-slate-800' : 'bg-white';
    const borderColor = isDarkMode ? 'border-slate-700' : 'border-gray-200';
    // Loading state
    if (isLoading || !profile.identity) {
        return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen ${bgClass}`, children: (0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center min-h-[400px]", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center space-y-4", children: [(0, jsx_runtime_1.jsxs)("svg", { className: `animate-spin h-8 w-8 ${textMuted}`, viewBox: "0 0 24 24", fill: "none", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12 a 8 8 0 0 1 8 -8 v 4 a 4 4 0 0 0 -4 4 H4 z" })] }), (0, jsx_runtime_1.jsx)("p", { className: textMuted, children: "Loading profile..." }), error && ((0, jsx_runtime_1.jsx)("p", { className: "text-red-500 text-sm mt-2", children: error.message }))] }) }) }));
    }
    const { identity, personal_info, contact_info, address } = profile;
    const userInitial = identity?.email?.charAt(0).toUpperCase() || 'U';
    return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen ${bgClass}`, children: (0, jsx_runtime_1.jsxs)("div", { className: `${layout?.maxWidth || 'max-w-3xl'} mx-auto ${layout?.padding || 'p-6'} space-y-6`, children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-between", children: (0, jsx_runtime_1.jsx)("h1", { className: `text-2xl font-bold ${textPrimary}`, children: "Profile" }) }), (0, jsx_runtime_1.jsx)("div", { className: `rounded-lg border ${cardBg} ${borderColor} p-6`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex-shrink-0", children: [identity?.avatar_url ? ((0, jsx_runtime_1.jsx)("img", { src: identity.avatar_url, alt: "Profile", className: "w-24 h-24 rounded-full object-cover" })) : ((0, jsx_runtime_1.jsx)("div", { className: "w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-white font-semibold text-3xl", children: userInitial }) })), (0, jsx_runtime_1.jsx)("button", { className: `mt-2 text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} w-full text-center`, children: "Change Photo" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("h2", { className: `text-2xl font-bold ${textPrimary}`, children: identity?.full_name || identity?.email }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2 space-y-1", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: textSecondary, children: identity?.email }), identity?.email_confirmed && ((0, jsx_runtime_1.jsx)("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", children: "\u2713" }))] }), identity?.phone_number && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: textSecondary, children: identity.phone_number }), identity?.phone_confirmed && ((0, jsx_runtime_1.jsx)("span", { className: "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", children: "\u2713" }))] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: `mt-4 pt-4 border-t ${borderColor} text-sm ${textMuted} space-y-1`, children: [identity?.created_at && ((0, jsx_runtime_1.jsxs)("p", { children: ["Member since ", formatDate(identity.created_at)] })), identity?.last_activity && ((0, jsx_runtime_1.jsxs)("p", { children: ["Last active ", formatRelativeTime(identity.last_activity)] })), profile.user_id && ((0, jsx_runtime_1.jsxs)("p", { children: ["Account ID: USR-", profile.user_id] }))] })] })] }) }), (0, jsx_runtime_1.jsx)(EditableSection, { title: "Personal Information", isDarkMode: isDarkMode, children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-0", children: [(0, jsx_runtime_1.jsx)(FieldRow, { label: "First Name", value: personal_info?.first_name, isDarkMode: isDarkMode }), (0, jsx_runtime_1.jsx)(FieldRow, { label: "Last Name", value: personal_info?.last_name, isDarkMode: isDarkMode }), (0, jsx_runtime_1.jsx)(FieldRow, { label: "Title", value: personal_info?.title, isDarkMode: isDarkMode }), (0, jsx_runtime_1.jsx)(FieldRow, { label: "Bio", value: personal_info?.bio, isDarkMode: isDarkMode })] }) }), (0, jsx_runtime_1.jsx)(EditableSection, { title: "Contact Information", isDarkMode: isDarkMode, children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-0", children: [(0, jsx_runtime_1.jsx)(FieldRow, { label: "Primary Email", value: identity?.email, verified: identity?.email_confirmed, action: (0, jsx_runtime_1.jsx)("button", { className: `text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`, children: "Change" }), isDarkMode: isDarkMode }), (0, jsx_runtime_1.jsx)(FieldRow, { label: "Primary Phone", value: identity?.phone_number, verified: identity?.phone_confirmed, action: (0, jsx_runtime_1.jsx)("button", { className: `text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`, children: "Change" }), isDarkMode: isDarkMode }), (0, jsx_runtime_1.jsx)(FieldRow, { label: "Secondary Email", value: contact_info?.secondary_email, isDarkMode: isDarkMode }), (0, jsx_runtime_1.jsx)(FieldRow, { label: "Secondary Phone", value: contact_info?.secondary_phone, isDarkMode: isDarkMode }), (0, jsx_runtime_1.jsx)(FieldRow, { label: "Website", value: contact_info?.website, isDarkMode: isDarkMode }), (0, jsx_runtime_1.jsx)(FieldRow, { label: "Preferred Contact", value: contact_info?.preferred_contact_method ?
                                    contact_info.preferred_contact_method.charAt(0).toUpperCase() +
                                        contact_info.preferred_contact_method.slice(1) : undefined, isDarkMode: isDarkMode })] }) }), (0, jsx_runtime_1.jsx)(EditableSection, { title: "Address", isDarkMode: isDarkMode, children: address?.address_line_1 ? ((0, jsx_runtime_1.jsxs)("div", { className: textPrimary, children: [(0, jsx_runtime_1.jsx)("p", { children: address.address_line_1 }), address.address_line_2 && (0, jsx_runtime_1.jsx)("p", { children: address.address_line_2 }), (0, jsx_runtime_1.jsx)("p", { children: [address.city, address.state_name, address.postal_code]
                                    .filter(Boolean)
                                    .join(', ') }), (0, jsx_runtime_1.jsx)("p", { children: address.country_name || address.country_code })] })) : ((0, jsx_runtime_1.jsx)("p", { className: textMuted, children: "No address on file" })) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap justify-center gap-6 pt-4", children: [(0, jsx_runtime_1.jsx)("a", { href: "/account/subscription", className: `text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`, children: "Subscription & Billing \u2192" }), (0, jsx_runtime_1.jsx)("a", { href: "/account/security", className: `text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`, children: "Security Settings \u2192" }), (0, jsx_runtime_1.jsx)("a", { href: "/account/settings", className: `text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`, children: "Preferences \u2192" })] })] }) }));
}
