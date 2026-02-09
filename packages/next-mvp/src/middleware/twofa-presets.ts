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
export const TwoFactorPresets = {
  /**
   * No 2FA required - route is accessible with just authentication
   * Use for: 2FA onboarding routes, profile viewing, non-sensitive operations
   */
  NONE: {
    requires2FA: false
  } as TwoFactorRequirements,

  /**
   * Basic 2FA - any authentication method acceptable
   * Use for: Standard protected routes
   */
  BASIC: {
    requires2FA: true,
    minACR: '1',
    allowedAMR: ['pwd', 'mfa', 'sms', 'totp', 'otp']
  } as TwoFactorRequirements,

  /**
   * Standard 2FA - password + additional factor
   * Use for: Most application features
   */
  STANDARD: {
    requires2FA: true,
    minACR: '2',
    requiredAMR: ['pwd'],
    allowedAMR: ['pwd', 'mfa', 'sms', 'totp', 'otp']
  } as TwoFactorRequirements,

  /**
   * High security - password + MFA required
   * Use for: Admin operations, settings changes
   */
  HIGH_SECURITY: {
    requires2FA: true,
    minACR: '2',
    requiredAMR: ['pwd', 'mfa']
  } as TwoFactorRequirements,

  /**
   * Admin operations - strict requirements
   * Use for: User management, system configuration
   */
  ADMIN: {
    requires2FA: true,
    minACR: '3',
    requiredAMR: ['pwd', 'mfa']
  } as TwoFactorRequirements,

  /**
   * Financial operations - maximum security
   * Use for: Payment processing, fund transfers
   */
  FINANCIAL: {
    requires2FA: true,
    minACR: '4',
    requiredAMR: ['pwd', 'mfa', 'totp']
  } as TwoFactorRequirements
} as const;

/**
 * AMR (Authentication Methods Reference) values
 */
export const AMRValues = {
  /** Password authentication */
  PASSWORD: 'pwd',
  /** Multi-factor authentication completed */
  MFA: 'mfa',
  /** SMS verification */
  SMS: 'sms',
  /** Time-based one-time password (authenticator app) */
  TOTP: 'totp',
  /** One-time password (generic) */
  OTP: 'otp',
  /** Email verification */
  EMAIL: 'email',
  /** Hardware key */
  HARDWARE_KEY: 'hwk',
  /** Biometric */
  BIOMETRIC: 'bio'
} as const;

/**
 * ACR (Authentication Context Class Reference) levels
 */
export const ACRLevels = {
  /** No authentication */
  NONE: '0',
  /** Single factor (password only) */
  SINGLE_FACTOR: '1',
  /** Multi-factor authentication */
  MULTI_FACTOR: '2',
  /** Hardware-backed MFA */
  HARDWARE_MFA: '3',
  /** Maximum assurance (hardware + biometric) */
  MAXIMUM: '4'
} as const;

/**
 * Validate AMR claims against requirements
 */
export function validateAMR(
  actualAMR: string[],
  requirements: TwoFactorRequirements
): boolean {
  // If no AMR requirements, valid
  if (!requirements.requiredAMR?.length && !requirements.allowedAMR?.length) {
    return true;
  }

  // If required methods specified, all must be present
  if (requirements.requiredAMR && requirements.requiredAMR.length > 0) {
    return requirements.requiredAMR.every(method => actualAMR.includes(method));
  }

  // If allowed methods specified, at least one must be present
  if (requirements.allowedAMR && requirements.allowedAMR.length > 0) {
    return actualAMR.some(method => requirements.allowedAMR!.includes(method));
  }

  return true;
}

/**
 * Validate ACR level against requirements
 */
export function validateACR(actualACR: string, minACR?: string): boolean {
  if (!minACR) {
    return true;
  }

  const actualLevel = parseInt(actualACR, 10) || 0;
  const minLevel = parseInt(minACR, 10) || 1;

  return actualLevel >= minLevel;
}

/**
 * Check if 2FA requirements are met
 */
export function checkTwoFactorRequirements(
  requirements: TwoFactorRequirements,
  sessionStatus: {
    twoFactorComplete?: boolean;
    authenticationMethods?: string[];
    authenticationLevel?: string;
  }
): { satisfied: boolean; reason?: string } {
  // If 2FA not required, always satisfied
  if (!requirements.requires2FA) {
    return { satisfied: true };
  }

  // Check if 2FA is complete
  if (!sessionStatus.twoFactorComplete) {
    return { satisfied: false, reason: '2FA not completed' };
  }

  // Check AMR if specified
  const amr = sessionStatus.authenticationMethods || [];
  if (!validateAMR(amr, requirements)) {
    return { satisfied: false, reason: 'AMR requirements not met' };
  }

  // Check ACR if specified
  const acr = sessionStatus.authenticationLevel || '0';
  if (!validateACR(acr, requirements.minACR)) {
    return { satisfied: false, reason: 'ACR level insufficient' };
  }

  return { satisfied: true };
}

export default TwoFactorPresets;
