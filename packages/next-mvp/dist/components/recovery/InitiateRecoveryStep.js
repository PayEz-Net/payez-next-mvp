"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitiateRecoveryStep = InitiateRecoveryStep;
const jsx_runtime_1 = require("react/jsx-runtime");
function InitiateRecoveryStep({ email, setEmail, onSubmit, loading }) {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl p-8", style: { background: 'var(--bg-card)', border: '1px solid var(--border-default)' }, children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold mb-2", style: { color: 'var(--text-primary)' }, children: "Account Recovery" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm mb-6", style: { color: 'var(--text-secondary)' }, children: "Enter your email address to begin the account recovery process." }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "email", className: "block text-sm font-medium mb-1", style: { color: 'var(--text-primary)' }, children: "Email Address" }), (0, jsx_runtime_1.jsx)("input", { type: "email", id: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true, disabled: loading, placeholder: "Enter your email address", className: "w-full px-3 py-2 rounded focus:ring-2 focus:outline-none disabled:opacity-50", style: {
                                    border: '1px solid var(--border-default)',
                                    color: 'var(--text-primary)',
                                    background: 'var(--bg-default)'
                                } })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: loading || !email, className: "w-full py-2 px-4 rounded font-medium focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed", style: {
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-primary)',
                            background: 'var(--bg-default)'
                        }, children: loading ? 'Processing...' : 'Continue' }), (0, jsx_runtime_1.jsx)("div", { className: "text-center", children: (0, jsx_runtime_1.jsx)("a", { href: "/account-auth/login", className: "text-sm hover:underline font-medium", style: { color: 'var(--text-primary)' }, children: "Back to Login" }) })] })] }));
}
