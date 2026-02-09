/**
 * Auth Decision Engine (lifted)
 */
import { NextRequest } from 'next/server';

export interface AuthContext {
  pathname: string;
  isPublicRoute: boolean;
  isLoginPage: boolean;
  searchParams: URLSearchParams;
  sessionPointer: { exists: boolean; sessionToken?: string; expired?: boolean; hasRefreshToken?: boolean; };
  sessionStatus: { exists: boolean | null; forceInvalid: boolean | null; requires2FA: boolean; twoFactorComplete: boolean; };
  circuitBreakerOpen: boolean;
}

export type AuthAction = 
  | { type: 'allow' }
  | { type: 'redirect'; location: string; reason: string; clearCookies?: boolean }
  | { type: 'service_error'; reason: string };

export function makeAuthDecision(context: AuthContext): AuthAction {
  const { pathname, isPublicRoute, isLoginPage, searchParams, sessionPointer, sessionStatus, circuitBreakerOpen } = context;
  // SAFEGUARD: Never use auth pages as callback URLs to prevent redirect loops
  const safeCallbackUrl = pathname.startsWith('/account-auth/') ? '/' : pathname;
  if (isPublicRoute && !isLoginPage) return { type: 'allow' };
  if (circuitBreakerOpen) { if (isLoginPage) return { type: 'allow' }; return { type: 'redirect', location: '/account-auth/login?error=ServiceUnavailable&reason=CircuitBreakerOpen', reason: 'CircuitBreakerOpen', clearCookies: true }; }
  if (!sessionPointer.exists) { if (isLoginPage) return { type: 'allow' }; if (pathname === '/') { const unauthUrl = process.env.UNAUTHENTICATED_REDIRECT_URL || '/account-auth/login'; return { type: 'redirect', location: unauthUrl, reason: 'unauthenticated_root_redirect' }; } return { type: 'redirect', location: `/account-auth/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`, reason: 'no_session_pointer' }; }
  if (sessionStatus.exists === null || sessionStatus.forceInvalid === null) return { type: 'service_error', reason: 'redis_unavailable' };
  if (sessionStatus.forceInvalid) { if (isLoginPage) return { type: 'allow' }; return { type: 'redirect', location: `/account-auth/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}&reason=force_invalidated`, reason: 'force_invalidated' }; }
  if (!sessionStatus.exists) { if (isLoginPage) return { type: 'allow' }; return { type: 'redirect', location: `/account-auth/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}&reason=stale_session`, reason: 'stale_session' }; }
  if (sessionStatus.requires2FA && !sessionStatus.twoFactorComplete) {
    if (pathname === '/account-auth/verify-code') return { type: 'allow' };
    if (isLoginPage) { const callbackUrl = searchParams.get('callbackUrl') || '/'; const safeCallbackUrl2 = callbackUrl.startsWith('/account-auth/') ? '/' : callbackUrl; return { type: 'redirect', location: `/account-auth/verify-code?callbackUrl=${encodeURIComponent(safeCallbackUrl2)}`, reason: '2fa_required_login_redirect' }; }
    return { type: 'allow' };
  }
  if (sessionPointer.expired) { if (isLoginPage) return { type: 'allow' }; return { type: 'redirect', location: `/account-auth/login?callbackUrl=${encodeURIComponent(safeCallbackUrl)}&error=SessionExpired`, reason: 'token_expired' }; }
  if (pathname === '/') return { type: 'redirect', location: '/', reason: 'authenticated_root_redirect' };
  if (isLoginPage) { const callbackUrl = searchParams.get('callbackUrl') || '/'; const safeCallbackUrl = callbackUrl.startsWith('/account-auth/') ? '/' : callbackUrl; return { type: 'redirect', location: safeCallbackUrl, reason: 'already_authenticated' }; }
  return { type: 'allow' };
}

export function isLoginPage(pathname: string): boolean { return pathname === '/account-auth/login'; }
export function getCallbackUrl(pathname: string, searchParams: URLSearchParams): string { if (pathname.startsWith('/account-auth/')) return '/'; const existingCallback = searchParams.get('callbackUrl'); if (existingCallback && !existingCallback.startsWith('/account-auth/')) return existingCallback; return pathname; }
