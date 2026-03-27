"use strict";
// NOTE: Server-only exports are NOT exported from the root to prevent bundling Node.js modules in client code.
// Server-side code should import from subpath exports:
// - Session management: import { sessionStore } from '@payez/next-mvp/lib/session-store'
// - Redis client: import { redis } from '@payez/next-mvp/lib/redis'
// - Token expiry: import { computeTokenExpiries } from '@payez/next-mvp/lib/token-expiry'
// - Refresh validation: import { validateRefreshToken } from '@payez/next-mvp/lib/refresh-token-validator'
// - Better Auth: import { createBetterAuthInstance } from '@payez/next-mvp/auth/better-auth'
// - Server auth: import { getSession } from '@payez/next-mvp/server/auth'
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryAuditLog = exports.writeAuditLog = exports.getHealthMetrics = exports.getErrorMetrics = exports.useAdminAnalytics = exports.useAuditLog = exports.useHealthMetrics = exports.useErrorMetrics = exports.AdminAnalyticsLayout = exports.AuditLogViewer = exports.HealthMetricsCard = exports.ErrorMetricsCard = exports.MobileNavDrawer = exports.UserAvatarMenu = exports.createMvpMiddleware = exports.getRouteConfig = exports.configurePublicRoutes = exports.isUnauthenticatedRoute = exports.makeAuthDecision = exports.useTraditionalAuthEnabled = exports.useFederatedAuthEnabled = exports.useFederatedProviders = exports.useAuthMode = exports.useAuthConfig = exports.AuthProvider = exports.useAnonSession = exports.fetchWithAuth = void 0;
// Client-safe exports only
// Client-side utilities
var fetch_with_auth_1 = require("./client/fetch-with-auth");
Object.defineProperty(exports, "fetchWithAuth", { enumerable: true, get: function () { return fetch_with_auth_1.fetchWithAuth; } });
// Anonymous session hook (for pre-login preferences like theme)
var useAnonSession_1 = require("./client/useAnonSession");
Object.defineProperty(exports, "useAnonSession", { enumerable: true, get: function () { return useAnonSession_1.useAnonSession; } });
// Authentication Context and Hooks
var AuthContext_1 = require("./client/AuthContext");
Object.defineProperty(exports, "AuthProvider", { enumerable: true, get: function () { return AuthContext_1.AuthProvider; } });
Object.defineProperty(exports, "useAuthConfig", { enumerable: true, get: function () { return AuthContext_1.useAuthConfig; } });
Object.defineProperty(exports, "useAuthMode", { enumerable: true, get: function () { return AuthContext_1.useAuthMode; } });
Object.defineProperty(exports, "useFederatedProviders", { enumerable: true, get: function () { return AuthContext_1.useFederatedProviders; } });
Object.defineProperty(exports, "useFederatedAuthEnabled", { enumerable: true, get: function () { return AuthContext_1.useFederatedAuthEnabled; } });
Object.defineProperty(exports, "useTraditionalAuthEnabled", { enumerable: true, get: function () { return AuthContext_1.useTraditionalAuthEnabled; } });
// Route configuration (client-safe)
var auth_decision_1 = require("./auth/auth-decision");
Object.defineProperty(exports, "makeAuthDecision", { enumerable: true, get: function () { return auth_decision_1.makeAuthDecision; } });
var route_config_1 = require("./auth/route-config");
Object.defineProperty(exports, "isUnauthenticatedRoute", { enumerable: true, get: function () { return route_config_1.isUnauthenticatedRoute; } });
Object.defineProperty(exports, "configurePublicRoutes", { enumerable: true, get: function () { return route_config_1.configurePublicRoutes; } });
Object.defineProperty(exports, "getRouteConfig", { enumerable: true, get: function () { return route_config_1.getRouteConfig; } });
var create_middleware_1 = require("./middleware/create-middleware");
Object.defineProperty(exports, "createMvpMiddleware", { enumerable: true, get: function () { return create_middleware_1.createMvpMiddleware; } });
// Account Components
var account_1 = require("./components/account");
Object.defineProperty(exports, "UserAvatarMenu", { enumerable: true, get: function () { return account_1.UserAvatarMenu; } });
Object.defineProperty(exports, "MobileNavDrawer", { enumerable: true, get: function () { return account_1.MobileNavDrawer; } });
// Admin Logging & Analytics (client-side components and hooks)
var logging_1 = require("./logging");
Object.defineProperty(exports, "ErrorMetricsCard", { enumerable: true, get: function () { return logging_1.ErrorMetricsCard; } });
Object.defineProperty(exports, "HealthMetricsCard", { enumerable: true, get: function () { return logging_1.HealthMetricsCard; } });
Object.defineProperty(exports, "AuditLogViewer", { enumerable: true, get: function () { return logging_1.AuditLogViewer; } });
Object.defineProperty(exports, "AdminAnalyticsLayout", { enumerable: true, get: function () { return logging_1.AdminAnalyticsLayout; } });
Object.defineProperty(exports, "useErrorMetrics", { enumerable: true, get: function () { return logging_1.useErrorMetrics; } });
Object.defineProperty(exports, "useHealthMetrics", { enumerable: true, get: function () { return logging_1.useHealthMetrics; } });
Object.defineProperty(exports, "useAuditLog", { enumerable: true, get: function () { return logging_1.useAuditLog; } });
Object.defineProperty(exports, "useAdminAnalytics", { enumerable: true, get: function () { return logging_1.useAdminAnalytics; } });
Object.defineProperty(exports, "getErrorMetrics", { enumerable: true, get: function () { return logging_1.getErrorMetrics; } });
Object.defineProperty(exports, "getHealthMetrics", { enumerable: true, get: function () { return logging_1.getHealthMetrics; } });
Object.defineProperty(exports, "writeAuditLog", { enumerable: true, get: function () { return logging_1.writeAuditLog; } });
Object.defineProperty(exports, "queryAuditLog", { enumerable: true, get: function () { return logging_1.queryAuditLog; } });
