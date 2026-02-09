/**
 * Two-Factor Authentication Presets for MVP Middleware
 *
 * Provides granular control over 2FA requirements per route.
 * Allows routes to require authentication but NOT require 2FA completion,
 * which is essential for 2FA onboarding flows.
 *
 * Ported from website-membership's TwoFactorPresets pattern.
 *
 * @version 2.6.29
 * @since auth-ready-v2
 */
/**
 * Two-Factor Authentication Requirements
 */
export interface TwoFactorRequirements {
    /** Whether 2FA is required for this route */
    requires2FA: boolean;
    /** Minimum Authentication Context Class Reference level (optional) */
    minACR?: string;
    /** Required Authentication Method References - ALL must be present (optional) */
    requiredAMR?: string[];
    /** Allowed Authentication Method References - at least ONE must be present (optional) */
    allowedAMR?: string[];
}
/**
 * Route configuration with 2FA requirements
 */
export interface RouteConfig {
    /** Whether authentication is required */
    requiresAuth: boolean;
    /** 2FA requirements for this route */
    twoFactorRequirements?: TwoFactorRequirements;
}
/**
 * Common 2FA requirement presets
 *
 * @example
 * ```typescript
 * // Configure routes with different 2FA requirements
 * configureRoutes({
 *   '/api/account/send-code': { requiresAuth: true, twoFactorRequirements: TwoFactorPresets.NONE },
 *   '/api/admin/users': { requiresAuth: true, twoFactorRequirements: TwoFactorPresets.HIGH_SECURITY },
 * });
 * ```
 */
export declare const TwoFactorPresets: {
    /**
     * No 2FA required - route is accessible with just authentication
     * Use for: 2FA onboarding routes, profile viewing, non-sensitive operations
     */
    readonly NONE: TwoFactorRequirements;
    /**
     * Basic 2FA - any authentication method acceptable
     * Use for: Standard protected routes
     */
    readonly BASIC: TwoFactorRequirements;
    /**
     * Standard 2FA - password + additional factor
     * Use for: Most application features
     */
    readonly STANDARD: TwoFactorRequirements;
    /**
     * High security - password + MFA required
     * Use for: Admin operations, settings changes
     */
    readonly HIGH_SECURITY: TwoFactorRequirements;
    /**
     * Admin operations - strict requirements
     * Use for: User management, system configuration
     */
    readonly ADMIN: TwoFactorRequirements;
    /**
     * Financial operations - maximum security
     * Use for: Payment processing, fund transfers
     */
    readonly FINANCIAL: TwoFactorRequirements;
};
/**
 * AMR (Authentication Methods Reference) values
 */
export declare const AMRValues: {
    /** Password authentication */
    readonly PASSWORD: "pwd";
    /** Multi-factor authentication completed */
    readonly MFA: "mfa";
    /** SMS verification */
    readonly SMS: "sms";
    /** Time-based one-time password (authenticator app) */
    readonly TOTP: "totp";
    /** One-time password (generic) */
    readonly OTP: "otp";
    /** Email verification */
    readonly EMAIL: "email";
    /** Hardware key */
    readonly HARDWARE_KEY: "hwk";
    /** Biometric */
    readonly BIOMETRIC: "bio";
};
/**
 * ACR (Authentication Context Class Reference) levels
 */
export declare const ACRLevels: {
    /** No authentication */
    readonly NONE: "0";
    /** Single factor (password only) */
    readonly SINGLE_FACTOR: "1";
    /** Multi-factor authentication */
    readonly MULTI_FACTOR: "2";
    /** Hardware-backed MFA */
    readonly HARDWARE_MFA: "3";
    /** Maximum assurance (hardware + biometric) */
    readonly MAXIMUM: "4";
};
/**
 * Validate AMR claims against requirements
 */
export declare function validateAMR(actualAMR: string[], requirements: TwoFactorRequirements): boolean;
/**
 * Validate ACR level against requirements
 */
export declare function validateACR(actualACR: string, minACR?: string): boolean;
/**
 * Check if 2FA requirements are met
 */
export declare function checkTwoFactorRequirements(requirements: TwoFactorRequirements, sessionStatus: {
    twoFactorComplete?: boolean;
    authenticationMethods?: string[];
    authenticationLevel?: string;
}): {
    satisfied: boolean;
    reason?: string;
};
export default TwoFactorPresets;
