"use strict";
/**
 * Profile Page exports
 *
 * - ProfilePage: Basic profile display (legacy)
 * - EnhancedProfilePage: Full-featured profile with identity, personal info, contact, address sections
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedProfilePage = exports.ProfilePage = void 0;
var page_1 = require("./page");
Object.defineProperty(exports, "ProfilePage", { enumerable: true, get: function () { return __importDefault(page_1).default; } });
var EnhancedProfilePage_1 = require("./EnhancedProfilePage");
Object.defineProperty(exports, "EnhancedProfilePage", { enumerable: true, get: function () { return __importDefault(EnhancedProfilePage_1).default; } });
