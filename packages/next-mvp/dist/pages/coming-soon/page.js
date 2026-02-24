"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ComingSoonPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const useTheme_1 = require("../../theme/useTheme");
function ComingSoonContent({ homeUrl = '/', logo }) {
    const branding = (0, useTheme_1.useBranding)();
    const colors = (0, useTheme_1.useColors)();
    const fallbackLogo = branding.logo?.dark || branding.logo?.light;
    const logoAlt = branding.logo?.alt || branding.appName || 'App Logo';
    const logoHeight = branding.logo?.height || 48;
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-md w-full text-center rounded-xl p-8 shadow-lg border", style: {
                backgroundColor: 'var(--bg-card, #ffffff)',
                borderColor: 'var(--border-default, #e5e7eb)',
            }, children: [(0, jsx_runtime_1.jsx)("div", { className: "mb-6 flex justify-center", children: logo || (fallbackLogo && ((0, jsx_runtime_1.jsx)("img", { src: fallbackLogo, alt: logoAlt, style: { height: logoHeight } }))) }), (0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold mb-2", style: { color: 'var(--text-primary, #111827)' }, children: branding.appName || 'Our App' }), (0, jsx_runtime_1.jsx)("span", { className: "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full lowercase tracking-wide border mb-4", style: {
                        borderColor: colors.primary || '#3b82f6',
                        color: colors.primary || '#3b82f6',
                    }, children: "coming soon" }), (0, jsx_runtime_1.jsx)("p", { className: "mb-6", style: { color: 'var(--text-secondary, #6b7280)' }, children: "We're currently in beta and access is limited to approved users. Check back soon \u2014 we're working hard to open the doors!" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: homeUrl, className: "inline-block w-full font-medium py-3 px-4 rounded-lg transition-colors text-white", style: { backgroundColor: colors.primary || '#3b82f6' }, children: "Go to Home" })] }) }));
}
function ComingSoonPage(props) {
    return ((0, jsx_runtime_1.jsx)(react_1.Suspense, { children: (0, jsx_runtime_1.jsx)(ComingSoonContent, { ...props }) }));
}
