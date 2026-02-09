"use strict";
/**
 * Security Page exports
 *
 * - SecurityPage: Basic security display (legacy)
 * - EnhancedSecurityPage: Full-featured security with password, 2FA, sessions, activity, danger zone
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedSecurityPage = exports.SecurityPage = void 0;
var page_1 = require("./page");
Object.defineProperty(exports, "SecurityPage", { enumerable: true, get: function () { return __importDefault(page_1).default; } });
var EnhancedSecurityPage_1 = require("./EnhancedSecurityPage");
Object.defineProperty(exports, "EnhancedSecurityPage", { enumerable: true, get: function () { return __importDefault(EnhancedSecurityPage_1).default; } });
