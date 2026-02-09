"use strict";
/**
 * Ready-to-Use Verify Email Route
 *
 * Provides a pre-configured handler for verifying email-based 2FA codes.
 * Can be imported directly into your app's API routes with zero configuration.
 *
 * @example
 * ```typescript
 * // app/api/account/verify-email/route.ts
 * export { POST } from '@payez/next-mvp/routes/account/verify-email';
 * ```
 *
 * @version 2.3.0
 * @since auth-ready-v2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
// Re-export the POST handler from api-handlers
var verify_email_1 = require("../../api-handlers/account/verify-email");
Object.defineProperty(exports, "POST", { enumerable: true, get: function () { return verify_email_1.POST; } });
/**
 * Pre-configured POST handler for verifying email 2FA codes
 *
 * This endpoint verifies the code sent to the user's email address
 * and upgrades the provisional session to a full session.
 *
 * Request body:
 * - code: string - The 6-digit verification code
 * - emailId: string - ID of the email address used
 *
 * Environment variables used:
 * - IDP_URL or NEXT_PUBLIC_IDP_URL (default: http://localhost:32785)
 * - CLIENT_ID or NEXT_PUBLIC_IDP_CLIENT_ID (required)
 * - NEXTAUTH_SECRET (required)
 *
 * Returns:
 * - Upgraded access token with MFA claim
 * - New refresh token
 * - Session upgrade status
 * - AMR (Authentication Methods Reference) array
 * - ACR (Authentication Context Class) level
 */ 
