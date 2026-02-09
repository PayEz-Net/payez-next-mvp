"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraditionalAuthSection = TraditionalAuthSection;
const jsx_runtime_1 = require("react/jsx-runtime");
function TraditionalAuthSection({ email, password, onEmailChange, onPasswordChange, onSubmit, isLoading, buttonText = 'Sign In', showForgotPassword = true, onForgotPassword, }) {
    return ((0, jsx_runtime_1.jsxs)("form", { onSubmit: onSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Email Address" }), (0, jsx_runtime_1.jsx)("input", { type: "email", value: email, onChange: (e) => onEmailChange(e.target.value), placeholder: "you@example.com", disabled: isLoading, required: true, className: "w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50", style: {
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-primary)',
                            background: 'var(--bg-default)',
                        } })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium", style: { color: 'var(--text-primary)' }, children: "Password" }), showForgotPassword && onForgotPassword && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: onForgotPassword, className: "text-xs hover:underline", style: { color: 'var(--text-primary)' }, children: "Forgot?" }))] }), (0, jsx_runtime_1.jsx)("input", { type: "password", value: password, onChange: (e) => onPasswordChange(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", disabled: isLoading, required: true, className: "w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50", style: {
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-primary)',
                            background: 'var(--bg-default)',
                        } })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isLoading, className: "w-full py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6", style: {
                    border: '1px solid var(--border-default)',
                    color: 'white',
                    background: 'var(--color-primary, #10b981)',
                }, children: isLoading ? 'Signing in...' : buttonText })] }));
}
