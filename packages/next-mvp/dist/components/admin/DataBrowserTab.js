"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataBrowserTab = DataBrowserTab;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------
function DataBrowserTab({ isDark = true, apiBasePath = '/api/admin/vibe', focusCollection, title = 'Data Browser', }) {
    // Collections state
    const [collections, setCollections] = (0, react_1.useState)([]);
    const [loadingCollections, setLoadingCollections] = (0, react_1.useState)(true);
    const [expandedCollections, setExpandedCollections] = (0, react_1.useState)(new Set());
    // Selection state
    const [selectedCollection, setSelectedCollection] = (0, react_1.useState)(focusCollection || null);
    const [selectedTable, setSelectedTable] = (0, react_1.useState)(null);
    // Table data state
    const [tableData, setTableData] = (0, react_1.useState)(null);
    const [loadingData, setLoadingData] = (0, react_1.useState)(false);
    const [expandedRow, setExpandedRow] = (0, react_1.useState)(null);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    // Messages
    const [error, setError] = (0, react_1.useState)(null);
    const [success, setSuccess] = (0, react_1.useState)(null);
    // Track rows being deleted
    const [deletingRows, setDeletingRows] = (0, react_1.useState)(new Set());
    const themeClasses = {
        cardBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm',
        inputBg: isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
        textPrimary: isDark ? 'text-white' : 'text-gray-900',
        textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
        textMuted: isDark ? 'text-gray-500' : 'text-gray-500',
        hoverBg: isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50',
        tableBg: isDark ? 'bg-slate-900' : 'bg-gray-50',
        tableHeader: isDark ? 'bg-slate-800 text-gray-300' : 'bg-gray-100 text-gray-700',
        tableRow: isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-200 hover:bg-gray-50',
    };
    // Fetch collections
    const fetchCollections = (0, react_1.useCallback)(async () => {
        setLoadingCollections(true);
        setError(null);
        try {
            const response = await fetch(`${apiBasePath}/collections`);
            if (!response.ok)
                throw new Error('Failed to fetch collections');
            const data = await response.json();
            const rawCollections = Array.isArray(data) ? data
                : Array.isArray(data.collections) ? data.collections
                    : Array.isArray(data.data) ? data.data
                        : [];
            const collectionList = rawCollections.map((c) => ({
                name: typeof c === 'string' ? c : c.name,
                tableCount: typeof c === 'object' ? (c.table_count || c.tableCount || 0) : 0,
                tables: [],
                loadingTables: false,
            }));
            // If focusCollection is set, filter to just that collection
            const filteredList = focusCollection
                ? collectionList.filter(c => c.name === focusCollection)
                : collectionList;
            setCollections(filteredList);
            // Auto-expand first collection
            if (filteredList.length > 0) {
                const firstName = filteredList[0].name;
                setExpandedCollections(new Set([firstName]));
                fetchTablesForCollection(firstName);
            }
        }
        catch (err) {
            console.error('Failed to fetch collections:', err);
            setError('Failed to fetch collections');
            setCollections([]);
        }
        finally {
            setLoadingCollections(false);
        }
    }, [apiBasePath, focusCollection]);
    // Fetch tables for a collection
    const fetchTablesForCollection = (0, react_1.useCallback)(async (collectionName) => {
        setCollections(prev => prev.map(c => c.name === collectionName ? { ...c, loadingTables: true } : c));
        try {
            const response = await fetch(`${apiBasePath}/collections/${collectionName}/tables`);
            if (!response.ok)
                throw new Error('Failed to fetch tables');
            const data = await response.json();
            const rawTables = Array.isArray(data) ? data
                : Array.isArray(data.tables) ? data.tables
                    : Array.isArray(data.data) ? data.data
                        : [];
            const tableList = rawTables.map((t) => ({
                name: typeof t === 'string' ? t : t.name,
                count: typeof t === 'object' ? (t.document_count || t.count || 0) : 0,
            }));
            setCollections(prev => prev.map(c => c.name === collectionName ? { ...c, tables: tableList, loadingTables: false } : c));
        }
        catch (err) {
            console.error(`Failed to fetch tables for ${collectionName}:`, err);
            setCollections(prev => prev.map(c => c.name === collectionName ? { ...c, loadingTables: false } : c));
        }
    }, [apiBasePath]);
    // Fetch table data
    const fetchTableData = (0, react_1.useCallback)(async (collection, table) => {
        setLoadingData(true);
        setError(null);
        setExpandedRow(null);
        try {
            const response = await fetch(`${apiBasePath}/data/${collection}/${table}?limit=50`);
            if (!response.ok)
                throw new Error('Failed to fetch data');
            const data = await response.json();
            const records = Array.isArray(data) ? data
                : Array.isArray(data.data) ? data.data
                    : Array.isArray(data.documents) ? data.documents
                        : [];
            setTableData({
                data: records,
                meta: data.meta || { total: records.length, limit: 50, offset: 0 },
            });
        }
        catch (err) {
            console.error(`Failed to fetch data for ${collection}/${table}:`, err);
            setError(`Failed to fetch data: ${err}`);
            setTableData(null);
        }
        finally {
            setLoadingData(false);
        }
    }, [apiBasePath]);
    // Delete record
    const handleDelete = (0, react_1.useCallback)(async (id) => {
        if (!selectedCollection || !selectedTable)
            return;
        if (!confirm(`Delete record ${id}?`))
            return;
        setDeletingRows(prev => new Set(prev).add(id));
        try {
            const response = await fetch(`${apiBasePath}/data/${selectedCollection}/${selectedTable}/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || 'Delete failed');
            }
            setSuccess(`Record ${id} deleted`);
            setTimeout(() => setSuccess(null), 3000);
            // Remove from local state
            setTableData(prev => prev ? {
                ...prev,
                data: prev.data.filter(row => (row.id || row.document_id) !== id),
            } : null);
        }
        catch (err) {
            setError(`Failed to delete: ${err}`);
        }
        finally {
            setDeletingRows(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    }, [selectedCollection, selectedTable, apiBasePath]);
    // Toggle collection expansion
    const toggleCollection = (name) => {
        setExpandedCollections(prev => {
            const next = new Set(prev);
            if (next.has(name)) {
                next.delete(name);
            }
            else {
                next.add(name);
                // Fetch tables if not loaded
                const coll = collections.find(c => c.name === name);
                if (coll && coll.tables.length === 0 && !coll.loadingTables) {
                    fetchTablesForCollection(name);
                }
            }
            return next;
        });
    };
    // Select table
    const selectTable = (collection, table) => {
        setSelectedCollection(collection);
        setSelectedTable(table);
        fetchTableData(collection, table);
    };
    // Initial load
    (0, react_1.useEffect)(() => {
        fetchCollections();
    }, [fetchCollections]);
    // Get columns from data
    const getColumns = () => {
        if (!tableData?.data?.length)
            return [];
        const firstRow = tableData.data[0];
        return Object.keys(firstRow).filter(k => !['data', '__metadata'].includes(k));
    };
    // Filter data by search term
    const filteredData = tableData?.data?.filter(row => {
        if (!searchTerm)
            return true;
        const searchLower = searchTerm.toLowerCase();
        return Object.values(row).some(val => String(val).toLowerCase().includes(searchLower));
    }) || [];
    const columns = getColumns();
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-3", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Database, { className: `w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}` }), (0, jsx_runtime_1.jsx)("h2", { className: `text-xl font-semibold ${themeClasses.textPrimary}`, children: title })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: fetchCollections, disabled: loadingCollections, className: `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${themeClasses.hoverBg} ${themeClasses.textSecondary}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: `w-4 h-4 ${loadingCollections ? 'animate-spin' : ''}` }), "Refresh"] })] }), error && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: "w-4 h-4" }), error] })), success && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 p-3 bg-green-900/20 border border-green-800 rounded-lg text-green-400", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.CheckCircle, { className: "w-4 h-4" }), success] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: `w-64 flex-shrink-0 rounded-lg border ${themeClasses.cardBg} p-3`, children: [(0, jsx_runtime_1.jsx)("h3", { className: `text-sm font-medium mb-3 ${themeClasses.textSecondary}`, children: "Collections" }), loadingCollections ? ((0, jsx_runtime_1.jsx)("div", { className: `text-sm ${themeClasses.textMuted}`, children: "Loading..." })) : collections.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: `text-sm ${themeClasses.textMuted}`, children: "No collections found" })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-1", children: collections.map(coll => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => toggleCollection(coll.name), className: `w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm ${themeClasses.hoverBg} ${themeClasses.textPrimary}`, children: [expandedCollections.has(coll.name) ? ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "w-4 h-4" })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronRight, { className: "w-4 h-4" })), (0, jsx_runtime_1.jsx)(lucide_react_1.Database, { className: "w-4 h-4" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate flex-1", children: coll.name }), coll.tableCount > 0 && ((0, jsx_runtime_1.jsx)("span", { className: `text-xs ${themeClasses.textMuted}`, children: coll.tableCount }))] }), expandedCollections.has(coll.name) && ((0, jsx_runtime_1.jsx)("div", { className: "ml-6 mt-1 space-y-0.5", children: coll.loadingTables ? ((0, jsx_runtime_1.jsx)("div", { className: `text-xs px-2 py-1 ${themeClasses.textMuted}`, children: "Loading..." })) : coll.tables.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: `text-xs px-2 py-1 ${themeClasses.textMuted}`, children: "No tables" })) : (coll.tables.map(table => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => selectTable(coll.name, table.name), className: `w-full flex items-center gap-2 px-2 py-1 rounded text-left text-sm ${selectedCollection === coll.name && selectedTable === table.name
                                                    ? isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                                                    : themeClasses.hoverBg + ' ' + themeClasses.textSecondary}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Table2, { className: "w-3 h-3" }), (0, jsx_runtime_1.jsx)("span", { className: "truncate flex-1", children: table.name }), table.count > 0 && ((0, jsx_runtime_1.jsx)("span", { className: `text-xs ${themeClasses.textMuted}`, children: table.count }))] }, table.name)))) }))] }, coll.name))) }))] }), (0, jsx_runtime_1.jsx)("div", { className: "flex-1 min-w-0", children: !selectedTable ? ((0, jsx_runtime_1.jsxs)("div", { className: `rounded-lg border ${themeClasses.cardBg} p-8 text-center`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Table2, { className: `w-12 h-12 mx-auto mb-4 ${themeClasses.textMuted}` }), (0, jsx_runtime_1.jsx)("p", { className: themeClasses.textSecondary, children: "Select a table to view data" })] })) : ((0, jsx_runtime_1.jsxs)("div", { className: `rounded-lg border ${themeClasses.cardBg}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: `px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'} flex items-center justify-between`, children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { className: `font-medium ${themeClasses.textPrimary}`, children: [selectedCollection, " / ", selectedTable] }), (0, jsx_runtime_1.jsxs)("p", { className: `text-sm ${themeClasses.textMuted}`, children: [tableData?.meta?.total || filteredData.length, " records"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Search, { className: `absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${themeClasses.textMuted}` }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: `pl-9 pr-3 py-1.5 rounded-lg border text-sm ${themeClasses.inputBg}` })] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => fetchTableData(selectedCollection, selectedTable), disabled: loadingData, className: `p-1.5 rounded-lg ${themeClasses.hoverBg}`, children: (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: `w-4 h-4 ${loadingData ? 'animate-spin' : ''} ${themeClasses.textSecondary}` }) })] })] }), loadingData ? ((0, jsx_runtime_1.jsx)("div", { className: "p-8 text-center", children: (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: `w-8 h-8 mx-auto animate-spin ${themeClasses.textMuted}` }) })) : filteredData.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "p-8 text-center", children: (0, jsx_runtime_1.jsx)("p", { className: themeClasses.textMuted, children: "No records found" }) })) : ((0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-sm", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: themeClasses.tableHeader, children: [columns.slice(0, 6).map(col => ((0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2 text-left font-medium", children: col }, col))), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2 text-right", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filteredData.map((row, idx) => {
                                                    const rowId = row.id || row.document_id || idx;
                                                    const isExpanded = expandedRow === rowId;
                                                    const isDeleting = deletingRows.has(rowId);
                                                    return ((0, jsx_runtime_1.jsxs)(react_1.default.Fragment, { children: [(0, jsx_runtime_1.jsxs)("tr", { className: `border-t ${themeClasses.tableRow} ${isDeleting ? 'opacity-50' : ''}`, children: [columns.slice(0, 6).map(col => ((0, jsx_runtime_1.jsx)("td", { className: `px-4 py-2 ${themeClasses.textPrimary}`, children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-xs truncate", children: typeof row[col] === 'object'
                                                                                ? JSON.stringify(row[col]).slice(0, 50)
                                                                                : String(row[col] ?? '') }) }, col))), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-2 text-right", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-end gap-1", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setExpandedRow(isExpanded ? null : rowId), className: `p-1 rounded ${themeClasses.hoverBg}`, title: "View details", children: isExpanded ? ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronUp, { className: `w-4 h-4 ${themeClasses.textSecondary}` })) : ((0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: `w-4 h-4 ${themeClasses.textSecondary}` })) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleDelete(rowId), disabled: isDeleting, className: "p-1 rounded hover:bg-red-900/20 text-red-400", title: "Delete", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "w-4 h-4" }) })] }) })] }), isExpanded && ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 7, className: `px-4 py-3 ${themeClasses.tableBg}`, children: (0, jsx_runtime_1.jsx)("pre", { className: `text-xs overflow-auto max-h-64 p-3 rounded ${isDark ? 'bg-slate-950' : 'bg-gray-100'} ${themeClasses.textSecondary}`, children: JSON.stringify(row, null, 2) }) }) }))] }, rowId));
                                                }) })] }) }))] })) })] })] }));
}
exports.default = DataBrowserTab;
