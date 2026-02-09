"use strict";
/**
 * Basic Settings Page
 *
 * A simpler settings page that can be customized.
 * For the full-featured version, use EnhancedSettingsPage.
 */
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SettingsPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const useTheme_1 = require("../../theme/useTheme");
function SettingsPage() {
    const layout = (0, useTheme_1.useLayout)();
    const colors = (0, useTheme_1.useColors)();
    // Determine dark mode from theme colors
    const isDark = colors?.background?.includes('slate-9') ||
        colors?.background?.includes('gray-9') ||
        colors?.card?.includes('slate-8');
    const bgColor = isDark ? 'bg-slate-900' : 'bg-gray-50';
    const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
    const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
    return ((0, jsx_runtime_1.jsx)("div", { className: `min-h-screen ${bgColor}`, children: (0, jsx_runtime_1.jsxs)("div", { className: `max-w-2xl mx-auto ${layout?.padding || 'p-6'}`, children: [(0, jsx_runtime_1.jsx)("h1", { className: `text-3xl font-bold ${textPrimary} mb-6`, children: "Settings" }), (0, jsx_runtime_1.jsx)("div", { className: `${cardBg} rounded-lg shadow-lg border ${borderColor} p-6`, children: (0, jsx_runtime_1.jsx)("p", { className: textMuted, children: "Settings page content goes here. Use EnhancedSettingsPage for a full-featured implementation." }) }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 text-center", children: (0, jsx_runtime_1.jsx)("a", { href: "/account/profile", className: `text-sm hover:underline ${textMuted}`, children: "Back to Profile" }) })] }) }));
}
