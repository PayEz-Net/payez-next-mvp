"use strict";
/**
 * Client-Side Exports
 *
 * This module exports only client-safe code for use in browser environments.
 * Server-only utilities and Node.js dependencies are excluded.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTraditionalAuthEnabled = exports.useFederatedAuthEnabled = exports.useFederatedProviders = exports.useAuthMode = exports.useAuthConfig = exports.AuthProvider = exports.fetchWithAuth = void 0;
// Client-side fetch utility
var fetch_with_auth_1 = require("./fetch-with-auth");
Object.defineProperty(exports, "fetchWithAuth", { enumerable: true, get: function () { return fetch_with_auth_1.fetchWithAuth; } });
// Authentication context and hooks
var AuthContext_1 = require("./AuthContext");
Object.defineProperty(exports, "AuthProvider", { enumerable: true, get: function () { return AuthContext_1.AuthProvider; } });
Object.defineProperty(exports, "useAuthConfig", { enumerable: true, get: function () { return AuthContext_1.useAuthConfig; } });
Object.defineProperty(exports, "useAuthMode", { enumerable: true, get: function () { return AuthContext_1.useAuthMode; } });
Object.defineProperty(exports, "useFederatedProviders", { enumerable: true, get: function () { return AuthContext_1.useFederatedProviders; } });
Object.defineProperty(exports, "useFederatedAuthEnabled", { enumerable: true, get: function () { return AuthContext_1.useFederatedAuthEnabled; } });
Object.defineProperty(exports, "useTraditionalAuthEnabled", { enumerable: true, get: function () { return AuthContext_1.useTraditionalAuthEnabled; } });
