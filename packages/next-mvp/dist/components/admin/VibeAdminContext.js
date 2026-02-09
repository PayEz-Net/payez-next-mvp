"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVibeAdmin = useVibeAdmin;
exports.VibeAdminProvider = VibeAdminProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
// -----------------------------------------------------------------------------
// CONTEXT
// -----------------------------------------------------------------------------
const VibeAdminContext = (0, react_1.createContext)(null);
// -----------------------------------------------------------------------------
// HOOK
// -----------------------------------------------------------------------------
function useVibeAdmin() {
    const context = (0, react_1.useContext)(VibeAdminContext);
    if (!context) {
        throw new Error('useVibeAdmin must be used within a VibeAdminProvider');
    }
    return context;
}
function VibeAdminProvider({ config, children }) {
    // Default tabs - will be populated with actual components
    const defaultTabs = [
        { id: 'stats', label: 'Stats', component: () => null },
        { id: 'users', label: 'Users', component: () => null },
        { id: 'sessions', label: 'Sessions', component: () => null },
        { id: 'analytics', label: 'Analytics', component: () => null },
    ];
    const allTabs = [...defaultTabs, ...(config.customTabs || [])];
    const value = {
        ...config,
        basePath: config.basePath || '/vibe-admin',
        allTabs,
    };
    return ((0, jsx_runtime_1.jsx)(VibeAdminContext.Provider, { value: value, children: children }));
}
exports.default = VibeAdminProvider;
