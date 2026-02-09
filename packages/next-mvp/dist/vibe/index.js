"use strict";
/**
 * =============================================================================
 * VIBE MODULE - MAIN EXPORTS
 * =============================================================================
 *
 * Typed Vibe App client for @payez/next-mvp
 *
 * Usage:
 *   import { vibe } from '@payez/next-mvp/vibe'
 *
 *   const users = await vibe.users.findMany({ where: { status: 'active' } })
 *
 * =============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBackendHmacSignature = exports.hasEnterpriseAuthHeaders = exports.validateEnterpriseAuth = exports.GenericTableDelegate = exports.GenericCollection = exports.extractVibeDocuments = exports.unwrapVibeDocument = exports.vibeGridPath = exports.vibeQueryPath = exports.vibeTablePath = exports.vibeTable = exports.vibeCollection = exports.getSessionStats = exports.checkSessionRevocation = exports.isSessionValid = exports.updateSessionActivity = exports.revokeAllUserSessions = exports.revokeSession = exports.getSessionById = exports.getAllSessions = exports.getUserSessions = exports.createLoginSession = exports.VibeServiceError = exports.VibeConflictError = exports.VibeRateLimitError = exports.VibeAuthError = exports.VibeValidationError = exports.VibeNotFoundError = exports.VibeError = exports.VibeSiteLog = exports.VibeComment = exports.VibeTag = exports.VibeActivityLog = exports.VibeNotification = exports.VibeFile = exports.VibeSetting = exports.VibeProfile = exports.VibeLoginSession = exports.VibeUser = exports.VibeTableDelegate = exports.VibeClient = exports.createVibeClient = exports.vibe = void 0;
// Client exports
var client_1 = require("./client");
Object.defineProperty(exports, "vibe", { enumerable: true, get: function () { return client_1.vibe; } });
Object.defineProperty(exports, "createVibeClient", { enumerable: true, get: function () { return client_1.createVibeClient; } });
Object.defineProperty(exports, "VibeClient", { enumerable: true, get: function () { return client_1.VibeClient; } });
Object.defineProperty(exports, "VibeTableDelegate", { enumerable: true, get: function () { return client_1.VibeTableDelegate; } });
// Class exports (for serialization)
var types_1 = require("./types");
Object.defineProperty(exports, "VibeUser", { enumerable: true, get: function () { return types_1.VibeUser; } });
Object.defineProperty(exports, "VibeLoginSession", { enumerable: true, get: function () { return types_1.VibeLoginSession; } });
Object.defineProperty(exports, "VibeProfile", { enumerable: true, get: function () { return types_1.VibeProfile; } });
Object.defineProperty(exports, "VibeSetting", { enumerable: true, get: function () { return types_1.VibeSetting; } });
Object.defineProperty(exports, "VibeFile", { enumerable: true, get: function () { return types_1.VibeFile; } });
Object.defineProperty(exports, "VibeNotification", { enumerable: true, get: function () { return types_1.VibeNotification; } });
Object.defineProperty(exports, "VibeActivityLog", { enumerable: true, get: function () { return types_1.VibeActivityLog; } });
Object.defineProperty(exports, "VibeTag", { enumerable: true, get: function () { return types_1.VibeTag; } });
Object.defineProperty(exports, "VibeComment", { enumerable: true, get: function () { return types_1.VibeComment; } });
Object.defineProperty(exports, "VibeSiteLog", { enumerable: true, get: function () { return types_1.VibeSiteLog; } });
// Error exports
var errors_1 = require("./errors");
Object.defineProperty(exports, "VibeError", { enumerable: true, get: function () { return errors_1.VibeError; } });
Object.defineProperty(exports, "VibeNotFoundError", { enumerable: true, get: function () { return errors_1.VibeNotFoundError; } });
Object.defineProperty(exports, "VibeValidationError", { enumerable: true, get: function () { return errors_1.VibeValidationError; } });
Object.defineProperty(exports, "VibeAuthError", { enumerable: true, get: function () { return errors_1.VibeAuthError; } });
Object.defineProperty(exports, "VibeRateLimitError", { enumerable: true, get: function () { return errors_1.VibeRateLimitError; } });
Object.defineProperty(exports, "VibeConflictError", { enumerable: true, get: function () { return errors_1.VibeConflictError; } });
Object.defineProperty(exports, "VibeServiceError", { enumerable: true, get: function () { return errors_1.VibeServiceError; } });
// Session management exports
var sessions_1 = require("./sessions");
Object.defineProperty(exports, "createLoginSession", { enumerable: true, get: function () { return sessions_1.createLoginSession; } });
Object.defineProperty(exports, "getUserSessions", { enumerable: true, get: function () { return sessions_1.getUserSessions; } });
Object.defineProperty(exports, "getAllSessions", { enumerable: true, get: function () { return sessions_1.getAllSessions; } });
Object.defineProperty(exports, "getSessionById", { enumerable: true, get: function () { return sessions_1.getSessionById; } });
Object.defineProperty(exports, "revokeSession", { enumerable: true, get: function () { return sessions_1.revokeSession; } });
Object.defineProperty(exports, "revokeAllUserSessions", { enumerable: true, get: function () { return sessions_1.revokeAllUserSessions; } });
Object.defineProperty(exports, "updateSessionActivity", { enumerable: true, get: function () { return sessions_1.updateSessionActivity; } });
Object.defineProperty(exports, "isSessionValid", { enumerable: true, get: function () { return sessions_1.isSessionValid; } });
Object.defineProperty(exports, "checkSessionRevocation", { enumerable: true, get: function () { return sessions_1.checkSessionRevocation; } });
Object.defineProperty(exports, "getSessionStats", { enumerable: true, get: function () { return sessions_1.getSessionStats; } });
// Generic/dynamic collection exports
var generic_1 = require("./generic");
Object.defineProperty(exports, "vibeCollection", { enumerable: true, get: function () { return generic_1.vibeCollection; } });
Object.defineProperty(exports, "vibeTable", { enumerable: true, get: function () { return generic_1.vibeTable; } });
Object.defineProperty(exports, "vibeTablePath", { enumerable: true, get: function () { return generic_1.vibeTablePath; } });
Object.defineProperty(exports, "vibeQueryPath", { enumerable: true, get: function () { return generic_1.vibeQueryPath; } });
Object.defineProperty(exports, "vibeGridPath", { enumerable: true, get: function () { return generic_1.vibeGridPath; } });
Object.defineProperty(exports, "unwrapVibeDocument", { enumerable: true, get: function () { return generic_1.unwrapVibeDocument; } });
Object.defineProperty(exports, "extractVibeDocuments", { enumerable: true, get: function () { return generic_1.extractVibeDocuments; } });
Object.defineProperty(exports, "GenericCollection", { enumerable: true, get: function () { return generic_1.GenericCollection; } });
Object.defineProperty(exports, "GenericTableDelegate", { enumerable: true, get: function () { return generic_1.GenericTableDelegate; } });
// Enterprise authentication exports
var enterprise_auth_1 = require("./enterprise-auth");
Object.defineProperty(exports, "validateEnterpriseAuth", { enumerable: true, get: function () { return enterprise_auth_1.validateEnterpriseAuth; } });
Object.defineProperty(exports, "hasEnterpriseAuthHeaders", { enumerable: true, get: function () { return enterprise_auth_1.hasEnterpriseAuthHeaders; } });
Object.defineProperty(exports, "generateBackendHmacSignature", { enumerable: true, get: function () { return enterprise_auth_1.generateBackendHmacSignature; } });
