"use strict";
/**
 * Edge Runtime Compatible Exports
 *
 * This module exports only Edge Runtime compatible code for use in Next.js middleware.
 * Client-side utilities that depend on browser APIs or server-only code are excluded.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInternalApiUrl = exports.checkTwoFactorRequirements = exports.validateACR = exports.validateAMR = exports.ACRLevels = exports.AMRValues = exports.TwoFactorPresets = exports.createMvpMiddleware = exports.get2FABypassConfig = exports.should2FABypass = exports.configure2FABypassRoutes = exports.getRouteConfig = exports.configurePublicRoutes = exports.isUnauthenticatedRoute = exports.makeAuthDecision = void 0;
// Authentication middleware and configuration (Edge Runtime compatible)
var auth_decision_1 = require("../auth/auth-decision");
Object.defineProperty(exports, "makeAuthDecision", { enumerable: true, get: function () { return auth_decision_1.makeAuthDecision; } });
var route_config_1 = require("../auth/route-config");
Object.defineProperty(exports, "isUnauthenticatedRoute", { enumerable: true, get: function () { return route_config_1.isUnauthenticatedRoute; } });
Object.defineProperty(exports, "configurePublicRoutes", { enumerable: true, get: function () { return route_config_1.configurePublicRoutes; } });
Object.defineProperty(exports, "getRouteConfig", { enumerable: true, get: function () { return route_config_1.getRouteConfig; } });
Object.defineProperty(exports, "configure2FABypassRoutes", { enumerable: true, get: function () { return route_config_1.configure2FABypassRoutes; } });
Object.defineProperty(exports, "should2FABypass", { enumerable: true, get: function () { return route_config_1.should2FABypass; } });
Object.defineProperty(exports, "get2FABypassConfig", { enumerable: true, get: function () { return route_config_1.get2FABypassConfig; } });
var create_middleware_1 = require("../middleware/create-middleware");
Object.defineProperty(exports, "createMvpMiddleware", { enumerable: true, get: function () { return create_middleware_1.createMvpMiddleware; } });
// Two-Factor Authentication Presets (Edge Runtime compatible)
var twofa_presets_1 = require("../middleware/twofa-presets");
Object.defineProperty(exports, "TwoFactorPresets", { enumerable: true, get: function () { return twofa_presets_1.TwoFactorPresets; } });
Object.defineProperty(exports, "AMRValues", { enumerable: true, get: function () { return twofa_presets_1.AMRValues; } });
Object.defineProperty(exports, "ACRLevels", { enumerable: true, get: function () { return twofa_presets_1.ACRLevels; } });
Object.defineProperty(exports, "validateAMR", { enumerable: true, get: function () { return twofa_presets_1.validateAMR; } });
Object.defineProperty(exports, "validateACR", { enumerable: true, get: function () { return twofa_presets_1.validateACR; } });
Object.defineProperty(exports, "checkTwoFactorRequirements", { enumerable: true, get: function () { return twofa_presets_1.checkTwoFactorRequirements; } });
// Internal API URL utilities for Edge Runtime
var internal_api_url_1 = require("./internal-api-url");
Object.defineProperty(exports, "getInternalApiUrl", { enumerable: true, get: function () { return internal_api_url_1.getInternalApiUrl; } });
