"use strict";
/**
 * @payez/next-mvp API Module Exports
 *
 * Provides enhanced API route handlers with automatic token management
 *
 * @version 2.0.0
 * @since auth-ready-v2
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.createAuthHandler = void 0;
var auth_handler_1 = require("./auth-handler");
Object.defineProperty(exports, "createAuthHandler", { enumerable: true, get: function () { return auth_handler_1.createAuthHandler; } });
// Default export for convenience
var auth_handler_2 = require("./auth-handler");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(auth_handler_2).default; } });
