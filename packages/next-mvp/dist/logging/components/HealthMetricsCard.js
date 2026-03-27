"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthMetricsCard = HealthMetricsCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const useHealthMetrics_1 = require("../hooks/useHealthMetrics");
function HealthMetricsCard({ timeRange = '1h', className }) {
    const { data, loading, error } = (0, useHealthMetrics_1.useHealthMetrics)(timeRange);
    if (loading)
        return (0, jsx_runtime_1.jsx)("div", { className: className, children: "Loading health metrics..." });
    if (error)
        return (0, jsx_runtime_1.jsxs)("div", { className: className, children: ["Error: ", error] });
    if (!data)
        return null;
    return ((0, jsx_runtime_1.jsxs)("div", { className: className, children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-lg font-semibold mb-4", children: ["System Health (", data.timeRange, ")"] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-2xl font-bold", children: [data.apiHealth.avgResponseTimeMs, "ms"] }), (0, jsx_runtime_1.jsx)("div", { className: "text-sm text-gray-600", children: "Avg Response Time" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "text-2xl font-bold", children: data.apiHealth.requestCount }), (0, jsx_runtime_1.jsx)("div", { className: "text-sm text-gray-600", children: "Total Requests" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-2xl font-bold", children: [data.apiHealth.p95ResponseTimeMs, "ms"] }), (0, jsx_runtime_1.jsx)("div", { className: "text-sm text-gray-600", children: "P95 Response Time" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-2xl font-bold", children: [(data.apiHealth.errorRate * 100).toFixed(2), "%"] }), (0, jsx_runtime_1.jsx)("div", { className: "text-sm text-gray-600", children: "Error Rate" })] })] }), data.endpointBreakdown.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("h4", { className: "font-medium mb-2", children: "Slowest Endpoints" }), (0, jsx_runtime_1.jsx)("ul", { className: "space-y-1", children: data.endpointBreakdown
                            .sort((a, b) => b.avgDurationMs - a.avgDurationMs)
                            .slice(0, 5)
                            .map((ep, i) => ((0, jsx_runtime_1.jsxs)("li", { className: "flex justify-between text-sm", children: [(0, jsx_runtime_1.jsx)("span", { className: "font-mono", children: ep.endpoint }), (0, jsx_runtime_1.jsxs)("span", { className: "text-orange-600", children: [ep.avgDurationMs, "ms"] })] }, i))) })] })), data.rateLimitHits > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "text-sm text-yellow-600", children: ["\u26A0\uFE0F ", data.rateLimitHits, " rate limit hits"] }))] }));
}
