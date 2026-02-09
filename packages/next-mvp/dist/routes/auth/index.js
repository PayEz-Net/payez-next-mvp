"use strict";
/**
 * @payez/next-mvp Ready-to-Use Route Exports
 *
 * Pre-configured route handlers that can be imported directly
 * into your Next.js app with zero configuration.
 *
 * @version 2.0.0
 * @since auth-ready-v2
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextauth = exports.viability = exports.logout = exports.session = exports.refresh = exports.nextAuthPOST = exports.nextAuthGET = exports.viabilityGET = exports.logoutPOST = exports.sessionPOST = exports.sessionGET = exports.refreshPOST = void 0;
// Export individual route handlers
var refresh_1 = require("./refresh");
Object.defineProperty(exports, "refreshPOST", { enumerable: true, get: function () { return refresh_1.POST; } });
var session_1 = require("./session");
Object.defineProperty(exports, "sessionGET", { enumerable: true, get: function () { return session_1.GET; } });
Object.defineProperty(exports, "sessionPOST", { enumerable: true, get: function () { return session_1.POST; } });
var logout_1 = require("./logout");
Object.defineProperty(exports, "logoutPOST", { enumerable: true, get: function () { return logout_1.POST; } });
var viability_1 = require("./viability");
Object.defineProperty(exports, "viabilityGET", { enumerable: true, get: function () { return viability_1.GET; } });
var nextauth_1 = require("./nextauth");
Object.defineProperty(exports, "nextAuthGET", { enumerable: true, get: function () { return nextauth_1.GET; } });
Object.defineProperty(exports, "nextAuthPOST", { enumerable: true, get: function () { return nextauth_1.POST; } });
// Also export as namespaced objects for cleaner imports
exports.refresh = __importStar(require("./refresh"));
exports.session = __importStar(require("./session"));
exports.logout = __importStar(require("./logout"));
exports.viability = __importStar(require("./viability"));
exports.nextauth = __importStar(require("./nextauth"));
