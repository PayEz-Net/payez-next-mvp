"use strict";
/**
 * =============================================================================
 * VIBE ADMIN COMPONENTS
 * =============================================================================
 *
 * Generic admin panel components for Vibe-powered applications.
 * These components are designed to be multi-tenant and can be configured
 * per-collection via the VibeAdminProvider.
 *
 * Usage:
 * ------
 * import {
 *   VibeAdminProvider,
 *   VibeAdminLayout,
 *   SessionsTab,
 *   AnalyticsTab,
 *   StatsTab,
 * } from '@payez/next-mvp/components/admin';
 *
 * =============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertSettingsTab = exports.LoggingSettingsTab = exports.DataBrowserTab = exports.StatsTab = exports.AnalyticsTab = exports.SessionsTab = exports.VibeAdminLayout = exports.useVibeAdmin = exports.VibeAdminProvider = void 0;
// Context & Provider
var VibeAdminContext_1 = require("./VibeAdminContext");
Object.defineProperty(exports, "VibeAdminProvider", { enumerable: true, get: function () { return VibeAdminContext_1.VibeAdminProvider; } });
Object.defineProperty(exports, "useVibeAdmin", { enumerable: true, get: function () { return VibeAdminContext_1.useVibeAdmin; } });
// Layout
var VibeAdminLayout_1 = require("./VibeAdminLayout");
Object.defineProperty(exports, "VibeAdminLayout", { enumerable: true, get: function () { return VibeAdminLayout_1.VibeAdminLayout; } });
// Tab Components
var SessionsTab_1 = require("./SessionsTab");
Object.defineProperty(exports, "SessionsTab", { enumerable: true, get: function () { return SessionsTab_1.SessionsTab; } });
var AnalyticsTab_1 = require("./AnalyticsTab");
Object.defineProperty(exports, "AnalyticsTab", { enumerable: true, get: function () { return AnalyticsTab_1.AnalyticsTab; } });
var StatsTab_1 = require("./StatsTab");
Object.defineProperty(exports, "StatsTab", { enumerable: true, get: function () { return StatsTab_1.StatsTab; } });
var DataBrowserTab_1 = require("./DataBrowserTab");
Object.defineProperty(exports, "DataBrowserTab", { enumerable: true, get: function () { return DataBrowserTab_1.DataBrowserTab; } });
var LoggingSettingsTab_1 = require("./LoggingSettingsTab");
Object.defineProperty(exports, "LoggingSettingsTab", { enumerable: true, get: function () { return LoggingSettingsTab_1.LoggingSettingsTab; } });
var AlertSettingsTab_1 = require("./AlertSettingsTab");
Object.defineProperty(exports, "AlertSettingsTab", { enumerable: true, get: function () { return AlertSettingsTab_1.AlertSettingsTab; } });
