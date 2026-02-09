"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
/**
 * Update Phone Route
 *
 * Ready-to-use route handler for updating phone number.
 * Used for 2FA setup - users need to add a phone to enable SMS verification.
 *
 * @example
 * ```typescript
 * // app/api/account/update-phone/route.ts
 * export { POST } from '@payez/next-mvp/routes/account/update-phone';
 * ```
 */
var update_phone_1 = require("../../api-handlers/account/update-phone");
Object.defineProperty(exports, "POST", { enumerable: true, get: function () { return update_phone_1.POST; } });
