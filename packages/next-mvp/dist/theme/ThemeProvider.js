"use strict";
/**
 * Theme Provider for @payez/next-mvp
 *
 * Provides theme configuration to all child components via React Context.
 * Consumer apps wrap their app with this provider and pass custom theme config.
 */
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeProvider = ThemeProvider;
exports.useTheme = useTheme;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const default_1 = require("./default");
const utils_1 = require("./utils");
const ThemeContext = (0, react_1.createContext)(default_1.defaultTheme);
function ThemeProvider({ children, theme }) {
    // Deep merge consumer theme with defaults
    const mergedTheme = (0, utils_1.mergeDeep)(default_1.defaultTheme, theme || {});
    return ((0, jsx_runtime_1.jsx)(ThemeContext.Provider, { value: mergedTheme, children: children }));
}
function useTheme() {
    const context = (0, react_1.useContext)(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}
