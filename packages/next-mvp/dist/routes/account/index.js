"use strict";
/**
 * Account Route Exports
 *
 * Provides ready-to-use route exports for all 2FA/account management endpoints.
 * These routes handle the complete 2FA flow with zero configuration.
 *
 * @example
 * ```typescript
 * // Import individual routes
 * export { POST } from '@payez/next-mvp/routes/account/masked-info';
 * export { POST } from '@payez/next-mvp/routes/account/send-code';
 * export { POST } from '@payez/next-mvp/routes/account/verify-email';
 * export { POST } from '@payez/next-mvp/routes/account/verify-sms';
 * ```
 *
 * @version 2.3.0
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
exports.updatePhonePOST = exports.verifySmsPOST = exports.verifyEmailPOST = exports.sendCodePOST = exports.maskedInfoPOST = exports.updatePhone = exports.verifySms = exports.verifyEmail = exports.sendCode = exports.maskedInfo = void 0;
// Export individual route modules
exports.maskedInfo = __importStar(require("./masked-info"));
exports.sendCode = __importStar(require("./send-code"));
exports.verifyEmail = __importStar(require("./verify-email"));
exports.verifySms = __importStar(require("./verify-sms"));
exports.updatePhone = __importStar(require("./update-phone"));
// Re-export POST handlers for convenience (all 2FA endpoints use POST)
var masked_info_1 = require("./masked-info");
Object.defineProperty(exports, "maskedInfoPOST", { enumerable: true, get: function () { return masked_info_1.POST; } });
var send_code_1 = require("./send-code");
Object.defineProperty(exports, "sendCodePOST", { enumerable: true, get: function () { return send_code_1.POST; } });
var verify_email_1 = require("./verify-email");
Object.defineProperty(exports, "verifyEmailPOST", { enumerable: true, get: function () { return verify_email_1.POST; } });
var verify_sms_1 = require("./verify-sms");
Object.defineProperty(exports, "verifySmsPOST", { enumerable: true, get: function () { return verify_sms_1.POST; } });
var update_phone_1 = require("./update-phone");
Object.defineProperty(exports, "updatePhonePOST", { enumerable: true, get: function () { return update_phone_1.POST; } });
