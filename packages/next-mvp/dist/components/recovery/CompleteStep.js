"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteStep = CompleteStep;
const jsx_runtime_1 = require("react/jsx-runtime");
function CompleteStep({ onGoToLogin }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white border border-gray-300 rounded p-8 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-green-50 border border-green-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4", children: (0, jsx_runtime_1.jsx)("svg", { className: "w-8 h-8 text-green-700", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: (0, jsx_runtime_1.jsx)("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), (0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-semibold text-gray-900 mb-2", children: "Password Reset Complete" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mb-2", children: "Your password has been successfully reset and your account lockout has been cleared." }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mb-6", children: "You can now log in with your new password." }), (0, jsx_runtime_1.jsx)("button", { onClick: onGoToLogin, className: "w-full py-2 px-4 border border-gray-300 rounded text-gray-900 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900", children: "Go to Login" })] }));
}
