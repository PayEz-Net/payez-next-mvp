"use strict";
/**
 * Roles Page exports
 *
 * - MyRolesPage: User view of their roles (/account/roles)
 * - Components: RoleCard, RoleBadge, PermissionsList, RoleSourceHeader
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleSourceHeader = exports.PermissionsList = exports.RoleBadge = exports.RoleCard = exports.MyRolesPage = void 0;
var MyRolesPage_1 = require("./MyRolesPage");
Object.defineProperty(exports, "MyRolesPage", { enumerable: true, get: function () { return __importDefault(MyRolesPage_1).default; } });
var components_1 = require("./components");
Object.defineProperty(exports, "RoleCard", { enumerable: true, get: function () { return components_1.RoleCard; } });
Object.defineProperty(exports, "RoleBadge", { enumerable: true, get: function () { return components_1.RoleBadge; } });
Object.defineProperty(exports, "PermissionsList", { enumerable: true, get: function () { return components_1.PermissionsList; } });
Object.defineProperty(exports, "RoleSourceHeader", { enumerable: true, get: function () { return components_1.RoleSourceHeader; } });
