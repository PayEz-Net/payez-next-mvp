"use strict";
/**
 * Settings Page exports
 *
 * - SettingsPage: Basic settings display (legacy)
 * - EnhancedSettingsPage: Full-featured settings with appearance, localization, notifications, privacy
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedSettingsPage = exports.SettingsPage = void 0;
var page_1 = require("./page");
Object.defineProperty(exports, "SettingsPage", { enumerable: true, get: function () { return __importDefault(page_1).default; } });
var EnhancedSettingsPage_1 = require("./EnhancedSettingsPage");
Object.defineProperty(exports, "EnhancedSettingsPage", { enumerable: true, get: function () { return __importDefault(EnhancedSettingsPage_1).default; } });
