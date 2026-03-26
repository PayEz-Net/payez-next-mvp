"use strict";
/**
 * Role Management Admin Page (/admin/roles)
 *
 * Design: Aurum (DESIGN_SPEC.md)
 * Three sections:
 * 1. Available Roles — Cards showing SiteAdmin, ClientAdmin
 * 2. User Assignments — Table with inline role dropdowns
 * 3. Change History — Audit log of role changes
 *
 * Design Principles:
 * - No shadows, gradients, or animation
 * - One accent color (blue #0066cc)
 * - Inline interactions (no modals)
 * - Scan-friendly tables and lists
 */
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RolesAdminPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
// Mock data
const MOCK_ROLES = [
    {
        id: 1,
        name: 'SiteAdmin',
        description: 'System-wide administrator. Manages all vibe_app features.',
        userCount: 1,
        lastChanged: '3/10/2026 by Admin',
    },
    {
        id: 2,
        name: 'ClientAdmin',
        description: 'Resume admin for Ideal Resume. Manages users, resumes, audit logs.',
        userCount: 2,
        lastChanged: '3/9/2026 by Admin',
    },
];
const MOCK_USERS = [
    { id: 1, email: 'alice@example.com', role: 'ClientAdmin', assigned: '3/10/2026' },
    { id: 2, email: 'bob@example.com', role: 'SiteAdmin', assigned: '2/28/2026' },
    { id: 3, email: 'carol@example.com', role: null, assigned: null },
    { id: 4, email: 'dave@example.com', role: 'ClientAdmin', assigned: '3/5/2026' },
    { id: 5, email: 'eve@example.com', role: 'ClientAdmin', assigned: '3/8/2026' },
];
const MOCK_CHANGES = [
    { timestamp: '3/10/2026, 10:15 AM', event: 'Alice assigned to ClientAdmin by Admin User' },
    { timestamp: '3/9/2026, 2:30 PM', event: 'Bob assigned to SiteAdmin by Admin User' },
    { timestamp: '3/8/2026, 4:45 PM', event: 'Carol removed from ClientAdmin by Admin User' },
    { timestamp: '3/8/2026, 3:00 PM', event: 'SiteAdmin edited: Description changed by Admin User' },
];
function RolesAdminPage() {
    const [users, setUsers] = (0, react_1.useState)(MOCK_USERS);
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const [editingUserId, setEditingUserId] = (0, react_1.useState)(null);
    const [tempRole, setTempRole] = (0, react_1.useState)(null);
    const [message, setMessage] = (0, react_1.useState)(null);
    const filteredUsers = users.filter((u) => u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const handleEditRole = (userId, currentRole) => {
        setEditingUserId(userId);
        setTempRole(currentRole);
    };
    const handleSaveRole = (userId) => {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: tempRole, assigned: '3/10/2026' } : u));
        setMessage(`Role updated`);
        setEditingUserId(null);
        setTimeout(() => setMessage(null), 3000);
    };
    const handleRemoveRole = (userId) => {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: null, assigned: null } : u)));
        setMessage(`Role removed`);
        setTimeout(() => setMessage(null), 3000);
    };
    return ((0, jsx_runtime_1.jsx)("div", { style: { background: '#f8f8f8', minHeight: '100vh', padding: '40px 20px' }, children: (0, jsx_runtime_1.jsxs)("div", { style: { maxWidth: '1200px', margin: '0 auto' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '40px' }, children: [(0, jsx_runtime_1.jsx)("h1", { style: {
                                fontSize: '32px',
                                fontWeight: 400,
                                color: '#333',
                                marginBottom: '8px',
                            }, children: "Role Management" }), (0, jsx_runtime_1.jsx)("p", { style: { fontSize: '16px', color: '#666', fontWeight: 400 }, children: "Manage who has access to what role" })] }), (0, jsx_runtime_1.jsx)("div", { style: { height: '1px', background: '#e0e0e0', margin: '24px 0' } }), (0, jsx_runtime_1.jsxs)("section", { style: { marginBottom: '60px' }, children: [(0, jsx_runtime_1.jsx)("h2", { style: {
                                fontSize: '18px',
                                fontWeight: 400,
                                color: '#666',
                                marginBottom: '24px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }, children: "Available Roles" }), (0, jsx_runtime_1.jsx)("div", { style: {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                                gap: '24px',
                            }, children: MOCK_ROLES.map((role) => ((0, jsx_runtime_1.jsxs)("div", { style: {
                                    background: 'white',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '6px',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.2s ease',
                                    cursor: 'default',
                                }, onMouseEnter: (e) => {
                                    e.currentTarget.style.background = '#f9f9f9';
                                    e.currentTarget.style.borderColor = '#d0d0d0';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.borderColor = '#e0e0e0';
                                }, children: [(0, jsx_runtime_1.jsx)("h3", { style: {
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            color: '#333',
                                            marginBottom: '8px',
                                        }, children: role.name }), (0, jsx_runtime_1.jsx)("p", { style: {
                                            fontSize: '14px',
                                            color: '#666',
                                            marginBottom: '16px',
                                            flex: 1,
                                            lineHeight: 1.6,
                                        }, children: role.description }), (0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: '16px' }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '12px', color: '#999' }, children: ["Users: ", role.userCount] }), (0, jsx_runtime_1.jsxs)("div", { style: { fontSize: '12px', color: '#999' }, children: ["Last changed: ", role.lastChanged] })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '8px' }, children: [(0, jsx_runtime_1.jsx)("button", { style: {
                                                    padding: '8px 16px',
                                                    fontSize: '13px',
                                                    background: '#0066cc',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                }, onMouseEnter: (e) => (e.currentTarget.style.background = '#0052a3'), onMouseLeave: (e) => (e.currentTarget.style.background = '#0066cc'), children: "Edit" }), (0, jsx_runtime_1.jsx)("button", { style: {
                                                    padding: '8px 16px',
                                                    fontSize: '13px',
                                                    background: 'white',
                                                    color: '#333',
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                }, onMouseEnter: (e) => (e.currentTarget.style.background = '#f5f5f5'), onMouseLeave: (e) => (e.currentTarget.style.background = 'white'), children: "Remove" })] })] }, role.id))) })] }), (0, jsx_runtime_1.jsx)("div", { style: { height: '1px', background: '#e0e0e0', margin: '24px 0' } }), (0, jsx_runtime_1.jsxs)("section", { style: { marginBottom: '60px' }, children: [(0, jsx_runtime_1.jsx)("h2", { style: {
                                fontSize: '18px',
                                fontWeight: 400,
                                color: '#666',
                                marginBottom: '24px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }, children: "User Assignments" }), (0, jsx_runtime_1.jsx)("div", { style: { marginBottom: '24px' }, children: (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search users...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), style: {
                                    width: '100%',
                                    padding: '10px 14px',
                                    fontSize: '14px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '4px',
                                    background: 'white',
                                    boxSizing: 'border-box',
                                } }) }), message && ((0, jsx_runtime_1.jsxs)("div", { style: {
                                padding: '8px 12px',
                                background: '#e8f5e9',
                                color: '#2e7d32',
                                borderRadius: '4px',
                                marginBottom: '12px',
                                fontSize: '13px',
                            }, children: ["\u2713 ", message] })), (0, jsx_runtime_1.jsxs)("table", { style: {
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
                                                }, children: "User" }), (0, jsx_runtime_1.jsx)("th", { style: {
                                                    padding: '16px',
                                                    textAlign: 'left',
                                                    fontSize: '12px',
                                                    color: '#999',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: 'normal',
                                                }, children: "Role" }), (0, jsx_runtime_1.jsx)("th", { style: {
                                                    padding: '16px',
                                                    textAlign: 'left',
                                                    fontSize: '12px',
                                                    color: '#999',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: 'normal',
                                                }, children: "Assigned" }), (0, jsx_runtime_1.jsx)("th", { style: {
                                                    padding: '16px',
                                                    textAlign: 'left',
                                                    fontSize: '12px',
                                                    color: '#999',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: 'normal',
                                                }, children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filteredUsers.map((user) => ((0, jsx_runtime_1.jsxs)("tr", { style: {
                                            borderBottom: '1px solid #e0e0e0',
                                            height: '48px',
                                        }, onMouseEnter: (e) => (e.currentTarget.style.background = '#f5f5f5'), onMouseLeave: (e) => (e.currentTarget.style.background = 'white'), children: [(0, jsx_runtime_1.jsx)("td", { style: { padding: '16px', fontSize: '14px', color: '#333' }, children: user.email }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '16px', fontSize: '14px' }, children: editingUserId === user.id ? ((0, jsx_runtime_1.jsxs)("select", { value: tempRole || '', onChange: (e) => setTempRole(e.target.value || null), style: {
                                                        padding: '6px 10px',
                                                        fontSize: '13px',
                                                        border: '1px solid #0066cc',
                                                        borderRadius: '4px',
                                                        background: 'white',
                                                        color: '#333',
                                                    }, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "\u2014 Remove role \u2014" }), (0, jsx_runtime_1.jsx)("option", { value: "SiteAdmin", children: "SiteAdmin" }), (0, jsx_runtime_1.jsx)("option", { value: "ClientAdmin", children: "ClientAdmin" })] })) : user.role ? ((0, jsx_runtime_1.jsx)("span", { style: {
                                                        background: '#e3f2fd',
                                                        color: '#0066cc',
                                                        padding: '6px 10px',
                                                        borderRadius: '4px',
                                                        fontSize: '13px',
                                                        display: 'inline-block',
                                                    }, children: user.role })) : ((0, jsx_runtime_1.jsx)("span", { style: { color: '#999', fontStyle: 'italic' }, children: "(none)" })) }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '16px', fontSize: '12px', color: '#999' }, children: user.assigned || '—' }), (0, jsx_runtime_1.jsx)("td", { style: { padding: '16px', fontSize: '13px' }, children: editingUserId === user.id ? ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '8px' }, children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => handleSaveRole(user.id), style: {
                                                                padding: '6px 12px',
                                                                background: '#0066cc',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                            }, onMouseEnter: (e) => (e.currentTarget.style.background = '#0052a3'), onMouseLeave: (e) => (e.currentTarget.style.background = '#0066cc'), children: "Save" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setEditingUserId(null), style: {
                                                                padding: '6px 12px',
                                                                background: 'white',
                                                                color: '#333',
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                            }, onMouseEnter: (e) => (e.currentTarget.style.background = '#f5f5f5'), onMouseLeave: (e) => (e.currentTarget.style.background = 'white'), children: "Cancel" })] })) : ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '8px' }, children: [user.role && ((0, jsx_runtime_1.jsx)("button", { onClick: () => handleEditRole(user.id, user.role), style: {
                                                                padding: '6px 10px',
                                                                background: 'white',
                                                                color: '#0066cc',
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                            }, onMouseEnter: (e) => (e.currentTarget.style.background = '#f5f5f5'), onMouseLeave: (e) => (e.currentTarget.style.background = 'white'), children: "\u2193" })), !user.role ? ((0, jsx_runtime_1.jsx)("button", { onClick: () => handleEditRole(user.id, null), style: {
                                                                padding: '6px 10px',
                                                                background: 'white',
                                                                color: '#0066cc',
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                            }, onMouseEnter: (e) => (e.currentTarget.style.background = '#f5f5f5'), onMouseLeave: (e) => (e.currentTarget.style.background = 'white'), children: "+" })) : ((0, jsx_runtime_1.jsx)("button", { onClick: () => handleRemoveRole(user.id), style: {
                                                                padding: '6px 10px',
                                                                background: 'white',
                                                                color: '#cc0000',
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                            }, onMouseEnter: (e) => (e.currentTarget.style.background = '#fff0f0'), onMouseLeave: (e) => (e.currentTarget.style.background = 'white'), children: "\u2715" }))] })) })] }, user.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { style: { marginTop: '12px', fontSize: '12px', color: '#999' }, children: [filteredUsers.length, " of ", users.length, " users shown"] })] }), (0, jsx_runtime_1.jsx)("div", { style: { height: '1px', background: '#e0e0e0', margin: '24px 0' } }), (0, jsx_runtime_1.jsxs)("section", { children: [(0, jsx_runtime_1.jsx)("h2", { style: {
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
