"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogViewer = AuditLogViewer;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const audit_log_1 = require("../api/audit-log");
function AuditLogViewer({ query = {}, className }) {
    const [logs, setLogs] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [page, setPage] = (0, react_1.useState)(1);
    const [totalPages, setTotalPages] = (0, react_1.useState)(1);
    (0, react_1.useEffect)(() => {
        let mounted = true;
        async function fetchLogs() {
            try {
                setLoading(true);
                const result = await (0, audit_log_1.queryAuditLog)({
                    ...query,
                    page,
                    pageSize: 20,
                });
                if (mounted) {
                    setLogs(result.data);
                    setTotalPages(result.pagination?.totalPages || 1);
                    setError(null);
                }
            }
            catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
                }
            }
            finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }
        fetchLogs();
        return () => {
            mounted = false;
        };
    }, [query, page]);
    if (loading)
        return (0, jsx_runtime_1.jsx)("div", { className: className, children: "Loading audit logs..." });
    if (error)
        return (0, jsx_runtime_1.jsxs)("div", { className: className, children: ["Error: ", error] });
    return ((0, jsx_runtime_1.jsxs)("div", { className: className, children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold mb-4", children: "Audit Log" }), (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full divide-y divide-gray-200", children: [(0, jsx_runtime_1.jsx)("thead", { className: "bg-gray-50", children: (0, jsx_runtime_1.jsxs)("tr", { children: [(0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase", children: "Timestamp" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase", children: "Category" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase", children: "Action" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase", children: "User ID" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase", children: "Details" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "bg-white divide-y divide-gray-200", children: logs.map(log => ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-4 py-2 text-sm text-gray-900 font-mono", children: log.timestamp ? new Date(log.timestamp).toLocaleString() : '-' }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-2 text-sm text-gray-900", children: log.category }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-2 text-sm text-gray-900 font-mono", children: log.action }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-2 text-sm text-gray-900", children: log.userId || '-' }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-2 text-sm text-gray-500", children: log.details ? JSON.stringify(log.details).slice(0, 50) : '-' })] }, log.id))) })] }) }), totalPages > 1 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex justify-center gap-2 mt-4", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1, className: "px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50", children: "Previous" }), (0, jsx_runtime_1.jsxs)("span", { className: "px-3 py-1", children: ["Page ", page, " of ", totalPages] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setPage(p => Math.min(totalPages, p + 1)), disabled: page === totalPages, className: "px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50", children: "Next" })] }))] }));
}
