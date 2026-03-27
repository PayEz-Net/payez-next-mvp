/**
 * Admin Login Page for @payez/next-mvp
 *
 * A standalone username/password login page for admin access.
 * NOT linked from any navigation - only accessible via direct URL.
 *
 * USAGE:
 * 1. Create app/account-auth/admin-login/page.tsx in your Next.js app
 * 2. Re-export this component:
 *    export { default } from '@payez/next-mvp/pages/admin-login';
 *
 * CUSTOMIZATION:
 * - Override styles via CSS variables or wrap with your own component
 * - Provide custom branding via ThemeProvider
 */

'use client';

import React, { useState } from 'react';
import { authClient } from '../../client/better-auth-client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useBranding, useColors } from '../../theme/useTheme';

interface AdminLoginFormProps {
  /** Optional custom title (default: "Admin Login") */
  title?: string;
  /** Optional custom subtitle (default: "Authorized personnel only") */
  subtitle?: string;
  /** Optional callback URL override */
  callbackUrl?: string;
  /** Optional logo component to render */
  logo?: React.ReactNode;
}

function AdminLoginForm({
  title = 'Admin Login',
  subtitle = 'Authorized personnel only',
  callbackUrl: propCallbackUrl,
  logo,
}: AdminLoginFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = propCallbackUrl || searchParams?.get('callbackUrl') || '/dashboard';

  const branding = useBranding();
  const colors = useColors();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: callbackUrl,
      });

      if ((result as any)?.error) {
        const errorMsg = typeof (result as any).error === 'object'
          ? ((result as any).error as any).message || 'Invalid credentials'
          : String((result as any).error);
        setError(errorMsg);
      } else if (result?.data) {
        // Redirect to verify-code for 2FA or directly to callback
        window.location.href = `/account-auth/verify-code?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Logo */}
        {logo && (
          <div className="flex justify-center mb-6">
            {logo}
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-2 text-slate-900">
          {title}
        </h1>
        <p className="text-center mb-8 text-slate-600">
          {subtitle}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500 text-white text-center text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-sm font-medium mb-2 text-slate-700"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium mb-2 text-slate-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Security notice */}
        <p className="mt-6 text-center text-xs text-slate-500">
          This login is for authorized administrators only.
          <br />
          All access attempts are logged.
        </p>
      </div>
    </div>
  );
}

function AdminLoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
      <div className="text-center">
        <svg className="animate-spin h-10 w-10 mx-auto text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="mt-4 text-slate-400">Loading...</p>
      </div>
    </div>
  );
}

export default function AdminLoginPage(props: AdminLoginFormProps) {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginForm {...props} />
    </Suspense>
  );
}

export { AdminLoginForm, AdminLoginFallback };
export type { AdminLoginFormProps };
