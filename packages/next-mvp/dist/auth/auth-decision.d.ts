/**
 * Auth Decision Engine - Pure function for middleware auth flow
 *
 * This module provides a deterministic decision tree for authentication middleware.
 * All auth flow logic is centralized here for testability and maintainability.
 */
export interface AuthContext {
    pathname: string;
    isPublicRoute: boolean;
    isLoginPage: boolean;
    searchParams: URLSearchParams;
    sessionPointer: {
        exists: boolean;
        sessionToken?: string;
        expired?: boolean;
    };
    sessionStatus: {
        exists: boolean | null;
        forceInvalid: boolean | null;
        requires2FA: boolean;
        twoFactorComplete: boolean;
    };
    circuitBreakerOpen: boolean;
}
export type AuthAction = {
    type: 'allow';
} | {
    type: 'redirect';
    location: string;
    reason: string;
    clearCookies?: boolean;
} | {
    type: 'service_error';
    reason: string;
};
/**
 * Main decision function - pure, testable, deterministic
 */
export declare function makeAuthDecision(context: AuthContext): AuthAction;
