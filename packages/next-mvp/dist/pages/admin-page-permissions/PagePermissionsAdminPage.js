"use strict";
/**
 * Page Permissions Admin Page (/admin/page-permissions)
 *
 * Design: Aurum (DESIGN_SPEC.md)
 * Control which roles can access which pages
 *
 * Three sections:
 * 1. Search & Filters — Find pages by route or category
 * 2. Pages & Role Requirements — Table showing pages and their role assignments
 * 3. Change History — Audit log of permission changes
 *
 * Design Principles:
 * - No shadows, gradients, or animation
 * - One accent color (blue #0066cc)
 * - Inline interactions (no modals)
 * - Scan-friendly tables and lists
 */
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PagePermissionsAdminPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
// Mock data
const MOCK_PAGES = [
    {
        id: 1,
        route: '/dashboard',
        displayName: 'Dashboard',
        requires2fa: false,
        roles: [],
        category: 'user',
    },
    {
        id: 2,
        route: '/admin',
        displayName: 'Admin Dashboard',
        requires2fa: true,
        roles: ['SiteAdmin', 'ClientAdmin'],
        category: 'admin',
    },
    {
        id: 3,
        route: '/admin/users',
        displayName: 'User Management',
        requires2fa: true,
        roles: ['SiteAdmin'],
        category: 'admin',
    },
    {
        id: 4,
        route: '/account/security',
        displayName: 'Security Settings',
        requires2fa: true,
        roles: [],
        category: 'account',
    },
    {
        id: 5,
        route: '/interview-practice',
        displayName: 'Interview Practice',
        requires2fa: false,
        roles: ['ClientAdmin'],
        category: 'user',
    },
];
const MOCK_CHANGES = [
    {
        timestamp: '3/10/2026, 10:30 AM',
        event: '/admin/users role requirement changed: Added ClientAdmin by Admin User',
    },
    {
        timestamp: '3/10/2026, 10:15 AM',
        event: '/dashboard updated: 2FA requirement removed by Admin User',
    },
    {
        timestamp: '3/9/2026, 3:45 PM',
        event: '/interview-practice role requirement changed: Added SiteAdmin by Admin User',
    },
];
const CATEGORIES = ['All Pages', 'Admin Pages', 'Account Pages', 'User Pages'];
const categoryMap = {
    'All Pages': '',
    'Admin Pages': 'admin',
    'Account Pages': 'account',
    'User Pages': 'user',
};
function PagePermissionsAdminPage() {
    const [pages, setPages] = (0, react_1.useState)(MOCK_PAGES);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [activeFilter, setActiveFilter] = (0, react_1.useState)('All Pages');
    const [message, setMessage] = (0, react_1.useState)(null);
    const [editingPageId, setEditingPageId] = (0, react_1.useState)(null);
    const [tempRoles, setTempRoles] = (0, react_1.useState)([]);
    const filteredPages = pages.filter((page) => {
        const matchesSearch = page.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
            page.displayName.toLowerCase().includes(searchQuery.toLowerCase());
        const categoryFilter = categoryMap[activeFilter];
        const matchesCategory = !categoryFilter || page.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });
    const handleEditRoles = (pageId, currentRoles) => {
        setEditingPageId(pageId);
        setTempRoles([...currentRoles]);
    };
    const handleToggleRole = (role) => {
        setTempRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
    };
    const handleSaveRoles = (pageId) => {
        setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, roles: tempRoles } : p)));
        setMessage('Page updated');
        setEditingPageId(null);
        setTimeout(() => setMessage(null), 3000);
    };
    const handleRemoveRole = (pageId, role) => {
        setPages((prev) => prev.map((p) => p.id === pageId ? { ...p, roles: p.roles.filter((r) => r !== role) } : p));
        setMessage('Role removed');
        setTimeout(() => setMessage(null), 3000);
    };
    return ((0, jsx_runtime_1.jsx)("div", { style: { background: '#f8f8f8', minHeight: '100vh', padding: '40px 20px' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { maxWidth: '1200px', margin: '0 auto' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '40px' }, children: [(0, jsx_runtime_1.jsx)("h1", { style: {
                                fontSize: '32px',
                                fontWeight: 400,
                                color: '#333',
                                marginBottom: '8px',
                            }, children: "Page Permissions" }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '16px', color: '#666', fontWeight: 400 }, children: "Control which roles can access which pages" })] }), (0, jsx_runtime_1.jsx)("div", { style: { height: '1px', background: '#e0e0e0', margin: '24px 0' } }), (0, jsx_runtime_1.jsxs)("section", { style: { marginBottom: '40px' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { marginBottom: '16px' }, children: (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search pages...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), style: {
                                    width: '100%',
                                    padding: '10px 14px',
                                    fontSize: '14px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '4px',
                                    background: 'white',
                                    boxSizing: 'border-box',
                                } }) }), (0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' }, children: CATEGORIES.map((cat) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setActiveFilter(cat), style: {
                                    padding: '8px 14px',
                                    fontSize: '13px',
                                    border: activeFilter === cat ? 'none' : '1px solid #e0e0e0',
                                    borderRadius: '4px',
                                    background: activeFilter === cat ? '#0066cc' : 'white',
                                    color: activeFilter === cat ? 'white' : '#333',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }, onMouseEnter: (e) => {
                                    if (activeFilter !== cat) {
                                        e.currentTarget.style.background = '#f5f5f5';
                                    }
                                }, onMouseLeave: (e) => {
                                    if (activeFilter !== cat) {
                                        e.currentTarget.style.background = 'white';
                                    }
                                }, children: cat }, cat))) })] }), (0, jsx_runtime_1.jsx)("div", { style: { height: '1px', background: '#e0e0e0', margin: '24px 0' } }), message && ((0, jsx_runtime_1.jsxs)("div", { style: {
                        padding: '8px 12px',
                        background: '#e8f5e9',
                        color: '#2e7d32',
                        borderRadius: '4px',
                        marginBottom: '12px',
                        fontSize: '13px',
                    }, children: ["\u2713 ", message] })), (0, jsx_runtime_1.jsxs)("section", { style: { marginBottom: '60px' }, children: [(0, jsx_runtime_1.jsx)("h2", { style: {
                                fontSize: '18px',
                                fontWeight: 400,
                                color: '#666',
                                marginBottom: '24px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }, children: "Pages & Permissions" }), (0, jsx_runtime_1.jsxs)("table", { style: {
                                width: '100%',
                                borderCollapse: 'collapse',
                                background: 'white',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                overflow: 'hidden',
                            }, children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { style: { background: '#f8f8f8', borderBottom: '1px solid #e0e0e0' }, children: [(0, jsx_runtime_1.jsx)("th", { style: {
                                                    padding: '16px',
                                                    textAlign: 'left',
                                                    fontSize: '12px',
                                                    color: '#999',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: 'normal',
                                                }, children: "Route" }), (0, jsx_runtime_1.jsx)("th", { style: {
                                                    padding: '16px',
                                                    textAlign: 'left',
                                                    fontSize: '12px',
                                                    color: '#999',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: 'normal',
                                                }, children: "Display Name" }), (0, jsx_runtime_1.jsx)("th", { style: {
                                                    padding: '16px',
                                                    textAlign: 'center',
                                                    fontSize: '12px',
                                                    color: '#999',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: 'normal',
                                                }, children: "2FA" }), (0, jsx_runtime_1.jsx)("th", { style: {
                                                    padding: '16px',
                                                    textAlign: 'left',
                                                    fontSize: '12px',
                                                    color: '#999',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: 'normal',
                                                }, children: "Roles" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filteredPages.map((page) => ((0, jsx_runtime_1.jsxs)("tr", { style: {
                                            borderBottom: '1px solid #e0e0e0',
                                            height: '48px',
                                        }, onMouseEnter: (e) => (e.currentTarget.style.background = '#f5f5f5'), onMouseLeave: (e) => (e.currentTarget.style.background = 'white'), children: [(0, jsx_runtime_1.jsx)("td", { style: {
                                                    padding: '16px',
                                                    fontSize: '12px',
                                                    fontFamily: 'Courier New, monospace',
                                                    color: '#333',
                                                }, title: "Click to copy", children: page.route }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '16px', fontSize: '14px', color: '#333' }, children: page.displayName }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '16px', textAlign: 'center', fontSize: '14px' }, children: page.requires2fa ? '✓' : '✕' }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '16px', fontSize: '13px' }, children: editingPageId === page.id ? ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '12px', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', gap: '12px' }, children: ['SiteAdmin', 'ClientAdmin'].map((role) => ((0, jsx_runtime_1.jsxs)("label", { style: {
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    cursor: 'pointer',
                                                                }, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: tempRoles.includes(role), onChange: () => handleToggleRole(role), style: { cursor: 'pointer' } }), (0, jsx_runtime_1.jsx)("span", { style: { fontSize: '12px', color: '#333' }, children: role })] }, role))) }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '6px' }, children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => handleSaveRoles(page.id), style: {
                                                                        padding: '6px 10px',
                                                                        background: '#0066cc',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '11px',
                                                                    }, onMouseEnter: (e) => (e.currentTarget.style.background = '#0052a3'), onMouseLeave: (e) => (e.currentTarget.style.background = '#0066cc'), children: "Save" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setEditingPageId(null), style: {
                                                                        padding: '6px 10px',
                                                                        background: 'white',
                                                                        color: '#333',
                                                                        border: '1px solid #e0e0e0',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '11px',
                                                                    }, onMouseEnter: (e) => (e.currentTarget.style.background = '#f5f5f5'), onMouseLeave: (e) => (e.currentTarget.style.background = 'white'), children: "Cancel" })] })] })) : ((0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', gap: '6px', alignItems: 'center' }, children: page.roles.length > 0 ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [page.roles.map((role) => ((0, jsx_runtime_1.jsxs)("span", { style: {
                                                                    background: '#e3f2fd',
                                                                    color: '#0066cc',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '3px',
                                                                    fontSize: '12px',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                }, children: [role, (0, jsx_runtime_1.jsx)("button", { onClick: () => handleRemoveRole(page.id, role), style: {
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            color: '#0066cc',
                                                                            cursor: 'pointer',
                                                                            fontSize: '12px',
                                                                            padding: '0',
                                                                            lineHeight: '1',
                                                                        }, children: "\u2715" })] }, role))), (0, jsx_runtime_1.jsx)("button", { onClick: () => handleEditRoles(page.id, page.roles), style: {
                                                                    padding: '4px 8px',
                                                                    background: 'white',
                                                                    color: '#0066cc',
                                                                    border: '1px solid #e0e0e0',
                                                                    borderRadius: '3px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '11px',
                                                                }, onMouseEnter: (e) => (e.currentTarget.style.background = '#f5f5f5'), onMouseLeave: (e) => (e.currentTarget.style.background = 'white'), children: "+" })] })) : ((0, jsx_runtime_1.jsx)("button", { onClick: () => handleEditRoles(page.id, []), style: {
                                                            padding: '4px 8px',
                                                            background: 'white',
                                                            color: '#0066cc',
                                                            border: '1px solid #e0e0e0',
                                                            borderRadius: '3px',
                                                            cursor: 'pointer',
                                                            fontSize: '11px',
                                                        }, onMouseEnter: (e) => (e.currentTarget.style.background = '#f5f5f5'), onMouseLeave: (e) => (e.currentTarget.style.background = 'white'), children: "+ Add Role" })) })) })] }, page.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginTop: '12px', fontSize: '12px', color: '#999' }, children: [filteredPages.length, " of ", pages.length, " pages shown"] })] }), (0, jsx_runtime_1.jsx)("div", { style: { height: '1px', background: '#e0e0e0', margin: '24px 0' } }), (0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { style: {
                                fontSize: '18px',
                                fontWeight: 400,
                                color: '#666',
                                marginBottom: '24px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }, children: "Recent Changes" }), (0, jsx_runtime_1.jsx)("div", { style: { background: 'white', border: '1px solid #e0e0e0', borderRadius: '4px' }, children: MOCK_CHANGES.map((change, idx) => ((0, jsx_runtime_1.jsxs)("div", { style: {
                                    padding: '16px',
                                    borderBottom: idx < MOCK_CHANGES.length - 1 ? '1px solid #e0e0e0' : 'none',
                                }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontSize: '12px', color: '#999', marginBottom: '4px' }, children: change.timestamp }), (0, jsx_runtime_1.jsx)("div", { style: { fontSize: '14px', color: '#333' }, children: change.event })] }, idx))) })] })] }) }));
}
