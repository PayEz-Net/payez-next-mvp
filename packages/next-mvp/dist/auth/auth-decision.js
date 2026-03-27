"use strict";
/**
 * Auth Decision Engine - Pure function for middleware auth flow
 *
 * This module provides a deterministic decision tree for authentication middleware.
 * All auth flow logic is centralized here for testability and maintainability.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeAuthDecision = makeAuthDecision;
/**
 * Main decision function - pure, testable, deterministic
 */
function makeAuthDecision(context) {
    const { pathname, isPublicRoute, isLoginPage, searchParams, sessionPointer, sessionStatus, circuitBreakerOpen } = context;
    // SAFEGUARD: Never use auth pages as callback URLs to prevent redirect loops
    const safeCallbackUrl = pathname.startsWith('/account-auth/') ? '/' : pathname;
    // Public routes are allowed, but we need to check login page separately
    if (isPublicRoute && !isLoginPage) {
        // For non-login public routes, check if authenticated user needs 2FA
        if (sessionPointer.exists && sessionStatus.exists && sessionStatus.requires2FA && !sessionStatus.twoFactorComplete) {
            // Skip redirect for verify-code page
            if (pathname === '/account-auth/verify-code') {
                return { type: 'allow' };
            }
        }
        return { type: 'allow' };
    }
    // Circuit breaker open - redirect to login with service unavailable
    if (circuitBreakerOpen) {
        if (isLoginPage) {
            return { type: 'allow' }; // Let them see login page
        }
        return {
            type: 'redirect',
            location: '/account-auth/login?error=ServiceUnavailable&reason=CircuitBreakerOpen',
            reason: 'CircuitBreakerOpen',
            clearCookies: true
        };
    }
    // No session pointer (JWT cookie) - need to login
    if (!sessionPointer.exists) {
        if (isLoginPage) {
            return { type: 'allow' };
        }
        // Redirect root to configured URL for unauthenticated users
        if (pathname === '/') {
            const unauthUrl = process.env.UNAUTHENTICATED_REDIRECT_URL || '/account-auth/login';
            return {
                type: 'redirect',
                location: unauthUrl,
                reason: 'unauthenticated_root_redirect'
            };
        }
        return {
            type: 'redirect',
            location: `/account-auth/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`,
            reason: 'no_session_pointer'
        };
    }
    // Redis/service errors - can't verify session
    if (sessionStatus.exists === null || sessionStatus.forceInvalid === null) {
        return {
            type: 'service_error',
            reason: 'redis_unavailable'
        };
    }
    // Session force invalidated - need fresh login
    if (sessionStatus.forceInvalid) {
        if (isLoginPage) {
            return { type: 'allow' };
        }
        return {
            type: 'redirect',
            location: `/account-auth/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}&reason=force_invalidated`,
            reason: 'force_invalidated',
            clearCookies: true
        };
    }
    // Stale session (cookie exists but not in Redis) - need fresh login
    if (!sessionStatus.exists) {
        if (isLoginPage) {
            return { type: 'allow' };
        }
        return {
            type: 'redirect',
            location: `/account-auth/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}&reason=stale_session`,
            reason: 'stale_session',
            clearCookies: true
        };
    }
    // PRIORITIZE 2FA: If session exists and 2FA is required but not complete, handle this before token-expired logic
    if (sessionStatus.requires2FA && !sessionStatus.twoFactorComplete) {
        console.log('[MIDDLEWARE-DECISION] 2FA required but not complete', {
            pathname,
            isLoginPage,
            sessionExists: sessionStatus.exists,
            sessionToken: sessionPointer.sessionToken?.substring(0, 8) + '...'
        });
        // Already on the 2FA page
        if (pathname === '/account-auth/verify-code') {
            console.log('[MIDDLEWARE-DECISION] Already on verify-code page, allowing');
            return { type: 'allow' };
        }
        // If user is on the login page, send them to verify-code with the original callback
        if (isLoginPage) {
            const callbackUrl = searchParams.get('callbackUrl') || '/';
            // CRITICAL FIX: Never use auth pages as callback URLs
            const safeCallbackUrl = callbackUrl.startsWith('/account-auth/') ? '/' : callbackUrl;
            console.log('[MIDDLEWARE-DECISION] On login page with 2FA incomplete, redirecting to verify-code', {
                originalCallback: callbackUrl,
                safeCallback: safeCallbackUrl,
                originalUrl: pathname
            });
            return {
                type: 'redirect',
                location: `/account-auth/verify-code?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`,
                reason: '2fa_required_login_redirect'
            };
        }
        // For protected routes, allow middleware to proceed (it may refresh tokens); pages will enforce 2FA
        console.log('[MIDDLEWARE-DECISION] Protected route with incomplete 2FA, allowing middleware to handle');
        return { type: 'allow' };
    }
    // Token expired - redirect to login
    if (sessionPointer.expired) {
        if (isLoginPage) {
            return { type: 'allow' };
        }
        return {
            type: 'redirect',
            location: `/account-auth/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}&error=SessionExpired`,
            reason: 'token_expired'
        };
    }
    // Authenticated root path should land on dashboards
    if (pathname === '/') {
        return {
            type: 'redirect',
            location: '/',
            reason: 'authenticated_root_redirect'
        };
    }
    // Valid session but 2FA required and not complete - more intelligent handling
    if (sessionStatus.requires2FA && !sessionStatus.twoFactorComplete) {
        if (pathname === '/account-auth/verify-code') {
            return { type: 'allow' }; // Already on 2FA page
        }
        // For login page, redirect to 2FA with original callback
        if (isLoginPage) {
            const callbackUrl = searchParams.get('callbackUrl') || '/';
            // CRITICAL FIX: Never use auth pages as callback URLs
            const safeCallbackUrl = callbackUrl.startsWith('/account-auth/') ? '/' : callbackUrl;
            return {
                type: 'redirect',
                location: `/account-auth/verify-code?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`,
                reason: '2fa_required'
            };
        }
        // For protected routes:
        // - If access token is expired and we have a valid refresh token, let middleware handle refresh first
        // - Only redirect to verify-code if access token is still valid or refresh failed
        // - Allow middleware to pass - it will either refresh successfully or handle redirect appropriately
        return { type: 'allow' };
    }
    // Authenticated user on login page - redirect to dashboard or callback
    if (isLoginPage) {
        const callbackUrl = searchParams.get('callbackUrl') || '/';
        // CRITICAL FIX: Never redirect back to login page (prevents infinite loop)
        const safeCallbackUrl = callbackUrl.startsWith('/account-auth/') ? '/' : callbackUrl;
        console.log('[MIDDLEWARE-DECISION] Authenticated user on login page, redirecting', {
            originalCallback: callbackUrl,
            safeCallback: safeCallbackUrl
        });
        return {
            type: 'redirect',
            location: safeCallbackUrl,
            reason: 'already_authenticated'
        };
    }
    // All checks passed - allow access
    return { type: 'allow' };
}
