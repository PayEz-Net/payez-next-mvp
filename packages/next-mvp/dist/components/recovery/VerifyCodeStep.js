"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyCodeStep = VerifyCodeStep;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function VerifyCodeStep({ code, setCode, onSubmit, onResend, loading, maskedDestination }) {
    const [resendCooldown, setResendCooldown] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };
    const handleResend = () => {
        onResend();
        setResendCooldown(30);
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white border border-gray-300 rounded p-8", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Enter Verification Code" }), maskedDestination && ((0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-600 mb-6", children: ["Enter the 6-digit code sent to ", (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: maskedDestination })] })), (0, jsx_runtime_1.jsxs)("form", { onSubmit: handleSubmit, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "code", className: "block text-sm font-medium text-gray-900 mb-1", children: "Verification Code" }), (0, jsx_runtime_1.jsx)("input", { type: "text", id: "code", value: code, onChange: (e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6)), required: true, disabled: loading, placeholder: "000000", maxLength: 6, className: "w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:outline-none disabled:opacity-50 disabled:bg-gray-50 text-center text-2xl tracking-widest font-mono" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-600 mt-1", children: "Code expires in 5 minutes" })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: loading || code.length !== 6, className: "w-full py-2 px-4 border border-gray-300 rounded text-gray-900 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed", children: loading ? 'Verifying...' : 'Verify Code' }), (0, jsx_runtime_1.jsx)("div", { className: "text-center", children: (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleResend, disabled: loading || resendCooldown > 0, className: "text-sm text-gray-900 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline", children: resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code' }) })] })] }));
}
