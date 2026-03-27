/**
 * Themed 2FA Verification Page for @payez/next-mvp
 *
 * PLAIN STYLING, FULL FUNCTIONALITY
 * - Clean, professional appearance
 * - All functional patterns from website-membership
 * - Themeable via ThemeProvider
 *
 * DEPENDENCIES: Only React, Next.js, next-auth, and Tailwind CSS
 * NO shadcn/ui or other UI library required!
 *
 * FEATURES:
 * ✅ Progressive disclosure: method selection → code input
 * ✅ Method locking after selection (prevents accidental multi-send)
 * ✅ Masked contact info display (informational only)
 * ✅ Auto-submit when code reaches 6 digits
 * ✅ Cooldown timers (30s) on resend buttons
 * ✅ Stale session detection (401 → redirect to login)
 * ✅ JWT-specific error detection and messaging
 * ✅ Session viability polling (every 30s) to detect expiration early
 * ✅ Duplicate submission prevention
 * ✅ Success/error states with atomic management
 * ✅ "Change method" action
 * ✅ Session cleanup on success/expiry
 *
 * USAGE:
 * 1. Import from @payez/next-mvp/pages/verify-code
 * 2. Wrap your app with ThemeProvider to customize branding
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '../../client/better-auth-client';
import { Suspense } from 'react';
import { useColors } from '../../theme/useTheme';

/**
 * Session storage key to track that user intentionally navigated to verify-code.
 * Prevents auto-redirect back to dashboard when session refreshes in background.
 */
const VERIFY_IN_PROGRESS_KEY = 'idealvibe_2fa_verify_in_progress';

// Masked info structure from IDP
interface MaskedInfo {
  masked_email?: string;
  masked_phone_number?: string;
  has_authenticator?: boolean;
}

function VerifyCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

  const { data: sessionData, isPending } = authClient.useSession();
  const session = sessionData;
  const status = isPending ? 'loading' : session ? 'authenticated' : 'unauthenticated';
  // TODO: Better Auth session refresh
  const updateSession = async () => { return session; };
  const colors = useColors();

  // Method selection
  type Method = 'email' | 'sms' | null;
  const [method, setMethod] = useState<Method>(null);
  const [methodLocked, setMethodLocked] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [maskedInfo, setMaskedInfo] = useState<MaskedInfo | null>(null);
  const [loadingMasked, setLoadingMasked] = useState(true);

  // Atomic state - only one active at a time
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cooldown timers
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [smsCooldown, setSmsCooldown] = useState(0);

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Refs
  const codeInputRef = useRef<HTMLInputElement>(null);
  const lastSubmittedCode = useRef<string>('');

  // Track that user is intentionally on this page
  const [verifyInProgress, setVerifyInProgress] = useState(false);

  // ==========================================================================
  // CRITICAL FIX: Mark that user is intentionally on verify page
  // This prevents auto-redirect when background token refresh updates session
  // ==========================================================================
  useEffect(() => {
    // On mount, mark that verification is in progress
    if (typeof window !== 'undefined') {
      const wasInProgress = sessionStorage.getItem(VERIFY_IN_PROGRESS_KEY) === 'true';
      if (!wasInProgress) {
        console.log('[2FA] User navigated to verify-code page, marking verify in progress');
        sessionStorage.setItem(VERIFY_IN_PROGRESS_KEY, 'true');
      }
      setVerifyInProgress(true);
    }
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Cooldown countdown
  useEffect(() => {
    if (emailCooldown > 0) {
      const timer = setTimeout(() => setEmailCooldown(emailCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCooldown]);

  useEffect(() => {
    if (smsCooldown > 0) {
      const timer = setTimeout(() => setSmsCooldown(smsCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [smsCooldown]);

  // Fetch masked info on mount
  useEffect(() => {
    const fetchMaskedInfo = async () => {
      // BUGFIX: Always set loadingMasked=false, even if not authenticated
      // Otherwise page stays stuck in loading spinner
      if (status !== 'authenticated' || !session) {
        setLoadingMasked(false);
        return;
      }

      try {
        const res = await fetch('/api/account/masked-info', {
          method: 'POST',
          credentials: 'include',
        });

        if (res.status === 401) {
          // Session expired - redirect to login
          setError('Your session has expired. Redirecting to login...');
          setTimeout(async () => {
            await authClient.signOut();
            const safeCallback = callbackUrl.startsWith('/account-auth/') ? '/dashboard' : callbackUrl;
            router.push(`/account-auth/login?callbackUrl=${encodeURIComponent(safeCallback)}`);
          }, 1200);
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to load contact information');
        }

        const data = await res.json();
        setMaskedInfo(data);
      } catch (err) {
        console.error('[2FA] Error fetching masked info:', err);
        setError('Could not load your contact information. Please try again.');
      } finally {
        setLoadingMasked(false);
      }
    };

    fetchMaskedInfo();
  }, [status, session, callbackUrl, router]);

  // Auto-submit when code is 6 digits
  useEffect(() => {
    if (code.length === 6 && method && !verifying) {
      handleVerifyCode();
    }
  }, [code, method, verifying]);

  // ==========================================================================
  // Session viability check - detect expiration early and warn user
  // ==========================================================================
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    // Check session viability every 30 seconds
    const checkSession = async () => {
      try {
        const res = await fetch('/api/session/viability', {
          credentials: 'include',
        });
        
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          
          // Session is no longer valid - warn user and redirect
          if (data.valid === false || data.mfaExpired === true) {
            setError('Your session has expired. Redirecting to login...');
            setTimeout(async () => {
              await authClient.signOut();
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem(VERIFY_IN_PROGRESS_KEY);
              }
              router.push(`/account-auth/login?error=SessionExpired`);
            }, 2000);
          }
        }
      } catch (err) {
        // Silent fail - let the next actual API call handle the error
        console.log('[2FA] Session viability check failed:', err);
      }
    };
    
    // Initial check after 5 seconds, then every 30 seconds
    const initialTimeout = setTimeout(checkSession, 5000);
    const interval = setInterval(checkSession, 30000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [status, router]);

  const handleSendCode = async (selectedMethod: 'email' | 'sms') => {
    setSending(true);
    setError(null);

    try {
      const res = await fetch('/api/account/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: selectedMethod }),
        credentials: 'include',
      });

      if (res.status === 401) {
        const errorData = await res.json().catch(() => ({}));
        const isJwtExpired = errorData?.error?.includes('JWT') || errorData?.message?.includes('JWT') || errorData?.error?.includes('expired');
        
        setError(isJwtExpired 
          ? 'Your 2FA session has expired. Please sign in again.' 
          : 'Your session has expired. Redirecting to login...'
        );
        
        setTimeout(async () => {
          await authClient.signOut();
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(VERIFY_IN_PROGRESS_KEY);
          }
          const safeCallback = callbackUrl.startsWith('/account-auth/') ? '/dashboard' : callbackUrl;
          const errorParam = isJwtExpired ? '&error=SessionExpired' : '';
          router.push(`/account-auth/login?callbackUrl=${encodeURIComponent(safeCallback)}${errorParam}`);
        }, 1500);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'Failed to send code');
      }

      // Lock method and set cooldown
      setMethod(selectedMethod);
      setMethodLocked(true);

      if (selectedMethod === 'email') {
        setEmailCooldown(30);
      } else {
        setSmsCooldown(30);
      }

      setToast({
        type: 'success',
        message: `Verification code sent to your ${selectedMethod === 'email' ? 'email' : 'phone'}`,
      });

      // Focus code input
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || !method || code.length !== 6) {
      return;
    }

    // Prevent duplicate submissions
    if (lastSubmittedCode.current === code) {
      console.log('[2FA] Duplicate submission prevented');
      return;
    }
    lastSubmittedCode.current = code;

    setVerifying(true);
    setError(null);

    try {
      const endpoint = method === 'sms' ? '/api/account/verify-sms' : '/api/account/verify-email';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationCode: code }),
        credentials: 'include',
      });

      if (res.status === 401) {
        const errorData = await res.json().catch(() => ({}));
        const isJwtExpired = errorData?.error?.includes('JWT') || errorData?.message?.includes('JWT') || errorData?.error?.includes('expired');
        
        setError(isJwtExpired 
          ? 'Your 2FA session has expired. Please sign in again.' 
          : 'Your session has expired. Redirecting to login...'
        );
        
        setTimeout(async () => {
          await authClient.signOut();
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(VERIFY_IN_PROGRESS_KEY);
          }
          const safeCallback = callbackUrl.startsWith('/account-auth/') ? '/dashboard' : callbackUrl;
          const errorParam = isJwtExpired ? '&error=SessionExpired' : '';
          router.push(`/account-auth/login?callbackUrl=${encodeURIComponent(safeCallback)}${errorParam}`);
        }, 1500);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || 'Verification failed');
      }

      const result = await res.json();

      // Normalize response: support both enveloped and unwrapped payloads
      const payload = (result && typeof result === 'object' && 'data' in result)
        ? (result as any).data
        : result;

      // Check if verification was successful
      const verified =
        payload?.verificationSuccessful === true ||
        payload?.twoFactorSessionVerified === true ||
        payload?.success === true ||
        // Accept token-based success (unwrapped raw tokens from backend)
        (!!payload?.access_token && !!payload?.refresh_token);

      if (!verified) {
        throw new Error('Verification failed. Please try again.');
      }

      // CRITICAL: If tokens are included (unwrapped response), persist them in server session
      if (payload?.access_token && payload?.refresh_token) {
        try {
          console.log('[2FA] Updating session with new MFA tokens...');
          const updateRes = await fetch('/api/auth/update-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              access_token: payload.access_token,
              refresh_token: payload.refresh_token
            })
          });

          if (!updateRes.ok) {
            console.warn('[2FA] update-session returned non-OK status:', updateRes.status);
            const errorData = await updateRes.json();
            console.warn('[2FA] update-session error:', errorData);
          } else {
            console.log('[2FA] Session updated successfully with MFA tokens');
          }
        } catch (e) {
          console.warn('[2FA] Failed to call update-session:', e);
        }
      }

      // Show success state
      setSuccess(true);
      setError(null);

      // CRITICAL: Force NextAuth to refetch session from server
      // This ensures useSession() gets the updated twoFactorComplete: true
      console.log('[2FA] Forcing session refresh after verification...');
      try {
        await updateSession(); // This triggers /api/auth/session and updates useSession() state
        console.log('[2FA] Session refresh completed');
      } catch (e) {
        console.warn('[2FA] updateSession failed:', e);
      }

      // Clear verify-in-progress flag before redirect
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(VERIFY_IN_PROGRESS_KEY);
      }

      // Redirect after showing success state
      setTimeout(() => {
        window.location.href = callbackUrl;
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
      lastSubmittedCode.current = ''; // Allow retry
    } finally {
      setVerifying(false);
    }
  };

  const handleResetMethod = () => {
    setMethod(null);
    setMethodLocked(false);
    setCode('');
    setError(null);
    setEmailCooldown(0);
    setSmsCooldown(0);
    lastSubmittedCode.current = '';
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(value);
  };

  // Loading state
  if (status === 'loading' || loadingMasked) {
    return (
      <div className="flex flex-col items-center justify-center py-8" style={{ background: 'hsl(var(--background))' }}>
        <svg className="animate-spin h-10 w-10" style={{ color: 'hsl(var(--primary))' }} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="mt-4 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-4 py-8" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-md w-full">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 p-4 rounded border transition-all duration-300 ${
              toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border p-8" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>Verify Your Identity</h1>
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Choose how you'd like to receive your verification code</p>
          </div>

          {/* Masked Info Display */}
          {maskedInfo && (
            <div className="mb-6 p-3 rounded border text-sm" style={{ background: 'hsl(var(--muted) / 0.1)', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
              {maskedInfo.masked_email && (
                <div className="mb-1">
                  Email: <span className="font-mono">{maskedInfo.masked_email}</span>
                </div>
              )}
              {maskedInfo.masked_phone_number && (
                <div>
                  Phone: <span className="font-mono">{maskedInfo.masked_phone_number}</span>
                </div>
              )}
            </div>
          )}

          {/* Method Selection or Code Input */}
          {!method ? (
            /* Method Selection */
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSendCode('email')}
                disabled={sending || !maskedInfo?.masked_email}
                className="w-full flex items-center justify-between p-3 border rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{
                  background: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))'
                }}
              >
                <div className="text-left">
                  <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>Email</p>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{maskedInfo?.masked_email || 'Not available'}</p>
                </div>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>→</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendCode('sms')}
                disabled={sending || !maskedInfo?.masked_phone_number}
                className="w-full flex items-center justify-between p-3 border rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{
                  background: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))'
                }}
              >
                <div className="text-left">
                  <p className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>SMS</p>
                  <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>{maskedInfo?.masked_phone_number || 'Not available'}</p>
                </div>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>→</span>
              </button>
            </div>
          ) : (
            /* Code Input */
            <div className="space-y-4">
              {/* Method indicator */}
              <div className="flex items-center justify-between p-3 rounded border" style={{ background: 'hsl(var(--muted) / 0.1)', borderColor: 'hsl(var(--border))' }}>
                <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                  Code sent to your {method === 'email' ? 'email' : 'phone'}
                </span>
                <button type="button" onClick={handleResetMethod} className="text-sm hover:underline font-medium" style={{ color: 'hsl(var(--primary))' }}>
                  Change method
                </button>
              </div>

              {/* Code input */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--foreground))' }}>
                  Verification Code
                </label>
                <input
                  ref={codeInputRef}
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={handleCodeChange}
                  className="w-full px-4 py-3 text-center text-2xl font-mono border rounded focus:ring-2 tracking-widest"
                  style={{
                    background: 'hsl(var(--input))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    caretColor: 'hsl(var(--foreground))'
                  }}
                  placeholder="000000"
                  disabled={verifying || success}
                  autoComplete="one-time-code"
                  autoFocus
                />
                <p className="mt-2 text-sm text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>Enter the 6-digit code</p>
              </div>

              {/* Status Display - Pre-sized container to prevent layout shift */}
              <div className="min-h-[3.5rem] flex items-center">
                {verifying ? (
                  <div className="w-full flex items-start space-x-2 p-3 rounded border" style={{ background: 'hsl(var(--muted) / 0.1)', borderColor: 'hsl(var(--border))' }}>
                    <svg className="animate-spin w-4 h-4 mt-0.5" style={{ color: 'hsl(var(--primary))' }} fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>Verifying code...</span>
                  </div>
                ) : error ? (
                  <div className="w-full flex items-start space-x-2 p-3 rounded bg-red-50 border border-red-200">
                    <span className="text-red-700 text-sm font-medium">✗</span>
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                ) : success ? (
                  <div className="w-full flex items-start space-x-2 p-2.5 rounded bg-green-50 border border-green-200">
                    <span className="text-green-700 text-xs font-medium">✓</span>
                    <span className="text-green-700 text-xs">Verification successful! Redirecting...</span>
                  </div>
                ) : null}
              </div>

              {/* Resend button */}
              {methodLocked && (
                <button
                  type="button"
                  onClick={() => handleSendCode(method)}
                  disabled={sending || (method === 'email' ? emailCooldown > 0 : smsCooldown > 0)}
                  className="w-full text-sm hover:underline font-medium disabled:no-underline disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: 'hsl(var(--primary))' }}
                >
                  {sending
                    ? 'Sending...'
                    : method === 'email'
                    ? emailCooldown > 0
                      ? `Resend code in ${emailCooldown}s`
                      : 'Resend code'
                    : smsCooldown > 0
                    ? `Resend code in ${smsCooldown}s`
                    : 'Resend code'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Back to login */}
        <p className="mt-4 text-center text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <a href="/account-auth/login" className="hover:underline font-medium" style={{ color: 'hsl(var(--primary))' }}>
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
}

function VerifyCodePageFallback() {
  const colors = useColors();
  return (
    <div className="flex items-center justify-center py-8" style={{ background: 'hsl(var(--background))' }}>
      <div className="text-center">
        <svg className="animate-spin h-10 w-10 mx-auto" style={{ color: 'hsl(var(--primary))' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="mt-4" style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p>
      </div>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<VerifyCodePageFallback />}>
      <VerifyCodeForm />
    </Suspense>
  );
}
