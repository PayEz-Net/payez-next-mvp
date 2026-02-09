"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAnalyticsLayout = AdminAnalyticsLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
function AdminAnalyticsLayout({ title, timeRange, onTimeRangeChange, children, }) {
    const timeRanges = ['1h', '24h', '7d', '30d'];
    return ((0, jsx_runtime_1.jsxs)("div", { className: "p-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-6", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-bold", children: title }), (0, jsx_runtime_1.jsx)("div", { className: "flex gap-2", children: timeRanges.map(range => ((0, jsx_runtime_1.jsx)("button", { onClick: () => onTimeRangeChange(range), className: `px-3 py-1 rounded text-sm font-medium transition-colors ${timeRange === range
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, children: range }, range))) })] }), (0, jsx_runtime_1.jsx)("div", { children: children })] }));
}
