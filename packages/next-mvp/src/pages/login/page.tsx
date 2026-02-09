/**
 * Themed Login Page for @payez/next-mvp
 *
 * DEPENDENCIES: Only React, Next.js, next-auth, and Tailwind CSS
 * NO shadcn/ui or other UI library required!
 *
 * FEATURES:
 * ✅ Atomic state management with visual feedback (submitting/error/success)
 * ✅ Enhanced error handling with user-friendly messages
 * ✅ Show/hide password toggle
 * ✅ Loading state management with timeouts
 * ✅ Proper autofill styling
 * ✅ Session expiration handling
 * ✅ Themeable styling via ThemeProvider
 * ✅ Placeholder for health check component
 *
 * USAGE:
 * 1. Import from @payez/next-mvp/pages/login
 * 2. Wrap your app with ThemeProvider to customize branding
 * 3. Optionally add your health check component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession, getSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ReservedStatusBox from '../../components/reserved/ReservedStatusBox';
import ReservedRecoveryWarning from '../../components/reserved/ReservedRecoveryWarning';
import { useBranding, useColors, useLayout } from '../../theme/useTheme';

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
  const urlError = searchParams?.get('error');

  const { data: session, status } = useSession();
  const branding = useBranding();
  const colors = useColors();
  const layout = useLayout();

  // Helper to create lighter/darker shades for hover states
  const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  };

  // Get the primary button color from theme (defaults to primary, or uses component override)
  const buttonColor = colors.secondary || colors.primary || '#3b82f6';
  const buttonHoverColor = adjustBrightness(buttonColor, -10);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Atomic state management - only ONE can be true at a time
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRecoveryOptions, setShowRecoveryOptions] = useState(false);

  // Force show form after timeout if stuck in loading
  const [forceShowForm, setForceShowForm] = useState(false);

  // Handle URL errors with user-friendly messages
  useEffect(() => {
    if (urlError) {
      let friendlyError: string | null = urlError;

      if (urlError === 'SessionExpired') {
        // Session expiration is normal - don't show as error
        console.log('[LOGIN] SessionExpired detected - normal behavior');
        friendlyError = null;
      } else if (urlError === 'ServiceUnavailable') {
        friendlyError = 'Authentication service is temporarily unavailable. Please try again in a few minutes.';
      } else if (urlError.startsWith("Unexpected token")) {
        friendlyError = 'An authentication error occurred. Please try signing in again.';
      } else if (urlError.includes('not valid JSON')) {
        friendlyError = 'An authentication error occurred. Please try signing in again.';
      } else if (urlError === 'CredentialsSignin') {
        friendlyError = 'Invalid email or password. Please try again.';
      }

      setLoginError(friendlyError);
    }
  }, [urlError]);

  // Timeout to prevent infinite loading states
  useEffect(() => {
    if (status === 'loading') {
      const timeout = setTimeout(() => {
        console.warn('[LOGIN] NextAuth status stuck in loading, forcing form display');
        setForceShowForm(true);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  // Force show form after 1 second if no session
  useEffect(() => {
    const immediateTimeout = setTimeout(() => {
      if (status === 'loading' && !session) {
        console.log('[LOGIN] Force showing form after 1 second');
        setForceShowForm(true);
      }
    }, 1000);
    return () => clearTimeout(immediateTimeout);
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Atomic state: set to submitting (clears error and success)
    setIsSubmitting(true);
    setLoading(true);
    setLoginError(null);
    setLoginSuccess(false);

    try {
      console.log('[LOGIN] Starting authentication...');
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        console.log('[LOGIN] Authentication failed:', result.error);

        setIsSubmitting(false);
        setLoading(false);
        setLoginSuccess(false);

        try {
          const errorData = JSON.parse(result.error);
          const passwordError = errorData.error?.details?.errors?.find((e: any) => e.field_name === 'password');

          if (passwordError) {
            // Show recovery options on ANY password error
            console.log('[LOGIN] Password error detected - showing recovery options');
            setShowRecoveryOptions(true);
            setLoginError(passwordError.message);
          } else {
            setLoginError(result.error);
          }
        } catch {
          if (result.error.includes('Unable to connect')) {
            setLoginError('The authentication service is currently unavailable. Please try again later.');
          } else if (result.error === 'CredentialsSignin') {
            setLoginError('Invalid email or password. Please try again.');
          } else {
            setLoginError(result.error);
          }
        }
        return;
      }

      // Atomic state: set to success
      console.log('[LOGIN] Authentication successful!');
      setLoginSuccess(true);
      setLoginError(null);
      setIsSubmitting(false);

      // Get updated session
      const freshSession = await getSession();
      console.log('[LOGIN] Fresh session obtained, redirecting to 2FA...');

      // Redirect to verify-code for 2FA
      const verifyUrl = `/account-auth/verify-code?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      console.log('[LOGIN] Redirecting to:', verifyUrl);
      window.location.href = verifyUrl;

    } catch (err) {
      console.error('[LOGIN] Unexpected error:', err);

      // Atomic state: set to error
      setIsSubmitting(false);
      setLoading(false);
      setLoginSuccess(false);
      setLoginError(err instanceof Error ? err.message : 'An error occurred during login');
    }
  };

  // Show loading spinner for initial loads
  if (!forceShowForm && !loginError && (loading || (status === 'loading' && !session))) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${colors.background}`}>
        <svg className="animate-spin h-6 w-6" style={{ color: buttonColor }} viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className={`mt-4 text-sm ${colors.muted}`}>
          {status === 'loading' ? 'Loading...' : 'Authenticating...'}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Dynamic styles for theme colors */}
      <style dangerouslySetInnerHTML={{__html: `
        .themed-input:focus {
          outline: none;
          border-color: ${buttonColor} !important;
          box-shadow: 0 0 0 2px ${buttonColor}40 !important;
        }
        .themed-button {
          background-color: ${buttonColor} !important;
        }
        .themed-button:hover:not(:disabled) {
          background-color: ${buttonHoverColor} !important;
        }
        .themed-link {
          color: ${buttonColor} !important;
        }
        .themed-link:hover {
          color: ${buttonHoverColor} !important;
        }
        .themed-status-submitting {
          background-color: ${buttonColor}1A !important;
          border-color: ${buttonColor}33 !important;
        }
        .themed-status-submitting-text {
          color: ${buttonColor} !important;
        }
        .themed-status-submitting svg {
          color: ${buttonColor} !important;
        }
      `}} />
      <div className={`min-h-screen flex items-center justify-center px-4 ${colors.background}`}>
        <div className="max-w-md w-full">
        {/* Card */}
        <div className={`rounded-2xl shadow-xl p-8 ${colors.card} ${colors.border} text-gray-800`}>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'inherit' }}>
              {branding.tagline || 'Welcome Back'}
            </h1>
            <p className={colors.muted}>
              Sign in to your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'inherit' }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`themed-input w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors`}
                placeholder="you@example.com"
                disabled={isSubmitting}
                style={{ backgroundColor: 'white', color: '#1f2937' }}
              />
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'inherit' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`themed-input w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg transition-colors`}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  style={{ backgroundColor: 'white', color: '#1f2937' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:opacity-70"
                  style={{ color: 'inherit', opacity: 0.7 }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.464 6.464m7.535 7.535l3.415 3.414M3 3l3.464 3.464M21 21l-3.415-3.414" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Atomic Status Display - Deterministic Reserved Space (zero layout shift) */}
            <ReservedStatusBox
              candidates={[
                "Ready",
                "Authenticating...",
                "The authentication service is currently unavailable. Please try again later.",
                "Invalid email or password. Please try again.",
                "Login successful! Redirecting..."
              ]}
              containerClass="p-3 text-sm leading-relaxed rounded-lg border"
              iconSizePx={16}
            >
              {isSubmitting ? (
                /* Themed: Submitting */
                <div className="themed-status-submitting flex items-start space-x-2 p-3 rounded-lg">
                  <svg className="animate-spin w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" style={{ color: buttonColor }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="themed-status-submitting-text text-sm leading-relaxed" style={{ color: buttonColor }}>Authenticating...</span>
                </div>
              ) : loginError ? (
                /* Red: Error */
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="w-4 h-4 bg-red-500 rounded-full mt-0.5 flex-shrink-0"></div>
                  <span className="text-red-600 text-sm leading-relaxed">{loginError}</span>
                </div>
              ) : loginSuccess ? (
                /* Green: Success */
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="w-4 h-4 bg-green-500 rounded-full mt-0.5 flex-shrink-0"></div>
                  <span className="text-green-600 text-sm leading-relaxed">Login successful! Redirecting...</span>
                </div>
              ) : (
                /* Ready State / Health Check Placeholder */
                <div className="flex items-start space-x-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="w-4 h-4 bg-green-500 rounded-full mt-0.5 flex-shrink-0"></div>
                  <span className="text-green-600 text-sm leading-relaxed">Ready</span>
                  {/*
                    CUSTOMIZATION: Replace above with your health check component
                    Example: <SignalRHealthCheck />
                    Or any real-time health status component
                  */}
                </div>
              )}
            </ReservedStatusBox>

            {/* Account Recovery Options - Deterministic Reserved Space (zero layout shift) */}
            <ReservedRecoveryWarning
              show={showRecoveryOptions}
              titleText="Account Lockout Warning"
              bodyText="Your account will be locked after one more failed attempt. Need help?"
              actionLabel="Start Account Recovery"
              containerClass="p-4 bg-amber-50 border border-amber-200 rounded-lg"
              titleClass="text-amber-900 font-medium mb-2"
              bodyClass="text-amber-800 text-sm mb-3"
              buttonClass="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
              iconSizePx={20}
            >
              {showRecoveryOptions && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-amber-900 font-medium mb-2">Account Lockout Warning</h3>
                      <p className="text-amber-800 text-sm mb-3">
                        Your account will be locked after one more failed attempt. Need help?
                      </p>
                      <button
                        type="button"
                        onClick={() => window.location.href = `/account-auth/recovery?email=${encodeURIComponent(email)}`}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
                      >
                        Start Account Recovery
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </ReservedRecoveryWarning>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="themed-button w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className={`mt-6 text-center text-sm ${colors.muted}`}>
            <a href="/account-auth/recovery" className="themed-link hover:underline">
              Start account recovery
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <p className={`mt-4 text-center text-sm ${colors.muted}`}>
          Don't have an account?{' '}
          <a href="/account-auth/register" className="themed-link font-medium hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
    </>
  );
}

function LoginPageFallback() {
  const colors = useColors();
  const buttonColor = colors.secondary || colors.primary || '#11B588';
  return (
    <div className={`min-h-screen flex items-center justify-center ${colors.background}`}>
      <div className="text-center">
        <svg className="animate-spin h-10 w-10 mx-auto" style={{ color: buttonColor }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className={`mt-4 ${colors.muted}`}>Loading...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginForm />
    </Suspense>
  );
}
