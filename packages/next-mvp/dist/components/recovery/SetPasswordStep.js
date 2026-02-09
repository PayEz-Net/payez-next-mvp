"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetPasswordStep = SetPasswordStep;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function SetPasswordStep({ onSubmit, loading }) {
    const [password, setPassword] = (0, react_1.useState)('');
    const [confirmPassword, setConfirmPassword] = (0, react_1.useState)('');
    const [showPassword, setShowPassword] = (0, react_1.useState)(false);
    const [showConfirmPassword, setShowConfirmPassword] = (0, react_1.useState)(false);
    const passwordsMatch = password === confirmPassword && password !== '';
    const handleSubmit = (e) => {
        e.preventDefault();
        if (passwordsMatch) {
            onSubmit(password, confirmPassword);
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white border border-gray-300 rounded p-8", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Set New Password" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-600 mb-6", children: "Choose a strong password for your account." }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-900 mb-1", children: "New Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: showPassword ? 'text' : 'password', id: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, disabled: loading, className: "w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:outline-none disabled:opacity-50 disabled:bg-gray-50 pr-10" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900", children: showPassword ? '👁️' : '👁️‍🗨️' })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-gray-900 mb-1", children: "Confirm New Password" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)("input", { type: showConfirmPassword ? 'text' : 'password', id: "confirmPassword", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), required: true, disabled: loading, className: "w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:outline-none disabled:opacity-50 disabled:bg-gray-50 pr-10" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900", children: showConfirmPassword ? '👁️' : '👁️‍🗨️' })] })] }), !passwordsMatch && confirmPassword && ((0, jsx_runtime_1.jsx)("div", { className: "bg-red-50 border border-red-200 rounded p-3", children: (0, jsx_runtime_1.jsx)("p", { className: "text-red-700 text-sm", children: "Passwords do not match" }) })), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: !passwordsMatch || loading, className: "w-full py-2 px-4 border border-gray-300 rounded text-gray-900 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? 'Resetting Password...' : 'Reset Password' })] })] }));
}
