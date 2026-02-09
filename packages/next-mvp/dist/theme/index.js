"use strict";
/**
 * Theme Module for @payez/next-mvp
 *
 * Main export for the theme system. Provides:
 * - ThemeProvider component
 * - Theme hooks (useTheme, useBranding, useColors, etc.)
 * - TypeScript types for theme configuration
 * - Default theme
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeDeep = exports.defaultTheme = exports.useComponentTheme = exports.useLayout = exports.useTypography = exports.useColors = exports.useBranding = exports.useTheme = exports.ThemeProvider = void 0;
var ThemeProvider_1 = require("./ThemeProvider");
Object.defineProperty(exports, "ThemeProvider", { enumerable: true, get: function () { return ThemeProvider_1.ThemeProvider; } });
var useTheme_1 = require("./useTheme");
Object.defineProperty(exports, "useTheme", { enumerable: true, get: function () { return useTheme_1.useTheme; } });
Object.defineProperty(exports, "useBranding", { enumerable: true, get: function () { return useTheme_1.useBranding; } });
Object.defineProperty(exports, "useColors", { enumerable: true, get: function () { return useTheme_1.useColors; } });
Object.defineProperty(exports, "useTypography", { enumerable: true, get: function () { return useTheme_1.useTypography; } });
Object.defineProperty(exports, "useLayout", { enumerable: true, get: function () { return useTheme_1.useLayout; } });
Object.defineProperty(exports, "useComponentTheme", { enumerable: true, get: function () { return useTheme_1.useComponentTheme; } });
var default_1 = require("./default");
Object.defineProperty(exports, "defaultTheme", { enumerable: true, get: function () { return default_1.defaultTheme; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "mergeDeep", { enumerable: true, get: function () { return utils_1.mergeDeep; } });
