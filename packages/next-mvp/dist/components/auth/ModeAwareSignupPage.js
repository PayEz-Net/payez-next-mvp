"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeAwareSignupPage = ModeAwareSignupPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const AuthContext_1 = require("../../client/AuthContext");
const FederatedAuthSection_1 = require("./FederatedAuthSection");
function ModeAwareSignupPage({ onFederatedSignUp, onTraditionalSignUp, isLoading = false, error = null, }) {
    const config = (0, AuthContext_1.useAuthConfig)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [confirmPassword, setConfirmPassword] = (0, react_1.useState)('');
    const [localLoading, setLocalLoading] = (0, react_1.useState)(false);
    const handleFederatedClick = (provider) => {
        onFederatedSignUp?.(provider);
    };
    const handleTraditionalSubmit = async (e) => {
        e.preventDefault();
        if (!onTraditionalSignUp)
            return;
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        setLocalLoading(true);
        try {
            await onTraditionalSignUp(email, password, confirmPassword);
        }
        finally {
            setLocalLoading(false);
        }
    };
    const isFederated = config.mode === 'federated';
    const isTraditional = config.mode === 'traditional';
    const totalLoading = isLoading || localLoading;
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [error && ((0, jsx_runtime_1.jsx)("div", { className: "mb-6 px-4 py-3 rounded-lg", style: {
                    background: 'var(--color-error, #ef4444)',
                    color: 'white',
                }, children: error })), isFederated && ((0, jsx_runtime_1.jsx)(FederatedAuthSection_1.FederatedAuthSection, { providers: config.providers, onProviderClick: handleFederatedClick, isLoading: totalLoading })), isTraditional && config.enableEmailSignup && ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleTraditionalSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Email Address" }), (0, jsx_runtime_1.jsx)("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@example.com", disabled: totalLoading, required: true, className: "w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50", style: {
                                    border: '1px solid var(--border-default)',
                                    color: 'var(--text-primary)',
                                    background: 'var(--bg-default)',
                                } })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Password" }), (0, jsx_runtime_1.jsx)("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", disabled: totalLoading, required: true, className: "w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50", style: {
                                    border: '1px solid var(--border-default)',
                                    color: 'var(--text-primary)',
                                    background: 'var(--bg-default)',
                                } })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Confirm Password" }), (0, jsx_runtime_1.jsx)("input", { type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", disabled: totalLoading, required: true, className: "w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50", style: {
                                    border: '1px solid var(--border-default)',
                                    color: 'var(--text-primary)',
                                    background: 'var(--bg-default)',
                                } })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: totalLoading, className: "w-full py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6", style: {
                            border: '1px solid var(--border-default)',
                            color: 'white',
                            background: 'var(--color-primary, #10b981)',
                        }, children: totalLoading ? 'Creating Account...' : 'Create Account' })] })), isFederated === false && isTraditional === false && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(FederatedAuthSection_1.FederatedAuthSection, { providers: config.providers, onProviderClick: handleFederatedClick, isLoading: totalLoading }), config.providers.length > 0 && config.enableEmailSignup && ((0, jsx_runtime_1.jsxs)("div", { className: "relative my-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 flex items-center", children: (0, jsx_runtime_1.jsx)("div", { className: "w-full", style: {
                                        borderTop: '1px solid var(--border-default)',
                                    } }) }), (0, jsx_runtime_1.jsx)("div", { className: "relative flex justify-center text-sm", children: (0, jsx_runtime_1.jsx)("span", { className: "px-2", style: {
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-secondary)',
                                    }, children: "Or sign up with email" }) })] })), config.enableEmailSignup && ((0, jsx_runtime_1.jsxs)("form", { onSubmit: handleTraditionalSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Email Address" }), (0, jsx_runtime_1.jsx)("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@example.com", disabled: totalLoading, required: true, className: "w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50", style: {
                                            border: '1px solid var(--border-default)',
                                            color: 'var(--text-primary)',
                                            background: 'var(--bg-default)',
                                        } })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Password" }), (0, jsx_runtime_1.jsx)("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", disabled: totalLoading, required: true, className: "w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50", style: {
                                            border: '1px solid var(--border-default)',
                                            color: 'var(--text-primary)',
                                            background: 'var(--bg-default)',
                                        } })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium mb-2", style: { color: 'var(--text-primary)' }, children: "Confirm Password" }), (0, jsx_runtime_1.jsx)("input", { type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", disabled: totalLoading, required: true, className: "w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50", style: {
                                            border: '1px solid var(--border-default)',
                                            color: 'var(--text-primary)',
                                            background: 'var(--bg-default)',
                                        } })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: totalLoading, className: "w-full py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6", style: {
                                    border: '1px solid var(--border-default)',
                                    color: 'white',
                                    background: 'var(--color-primary, #10b981)',
                                }, children: totalLoading ? 'Creating Account...' : 'Create Account' })] }))] }))] }));
}
