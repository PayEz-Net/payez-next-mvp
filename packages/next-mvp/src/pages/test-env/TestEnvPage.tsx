'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Test Environment Index Page
 *
 * Debug tools index showing session status and links to debug pages.
 *
 * Usage in consuming app:
 * ```typescript
 * // app/test-env/page.tsx
 * export { TestEnvPage as default } from '@payez/next-mvp/pages/test-env';
 * ```
 */
export function TestEnvPage() {
  const { data: session, status } = useSession();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    checkDarkMode();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  const testPages = [
    {
      name: 'JWT Inspector',
      url: '/test-env/jwt-inspect',
      description: 'Decode and inspect JWT tokens, view all claims',
    },
  ];

  const extSession = session as any;

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Test Environment</h1>

        {/* Current Session Status */}
        <div className={`mb-8 p-4 rounded-lg ${isDarkMode ? 'bg-slate-900' : 'bg-white border'}`}>
          <h2 className="text-lg font-semibold mb-3">Current Session</h2>
          {status === 'loading' ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : status === 'unauthenticated' ? (
            <p className="text-sm text-red-500">Not logged in</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Email:</strong></div>
              <div>{session?.user?.email || 'N/A'}</div>
              <div><strong>Has Access Token:</strong></div>
              <div className={extSession?.accessToken ? 'text-green-500' : 'text-red-500'}>
                {extSession?.accessToken ? 'Yes' : 'No'}
              </div>
              <div><strong>Has Refresh Token:</strong></div>
              <div className={extSession?.refreshToken ? 'text-green-500' : 'text-red-500'}>
                {extSession?.refreshToken ? 'Yes' : 'No'}
              </div>
              <div><strong>Token Expires:</strong></div>
              <div>{extSession?.accessTokenExpires ? new Date(extSession.accessTokenExpires).toLocaleString() : 'N/A'}</div>
              <div><strong>2FA Required:</strong></div>
              <div>{extSession?.user?.requiresTwoFactor ? 'Yes' : 'No'}</div>
              <div><strong>2FA Verified:</strong></div>
              <div>{extSession?.user?.twoFactorSessionVerified ? 'Yes' : 'No'}</div>
            </div>
          )}
        </div>

        {/* Test Pages */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Debug Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testPages.map((page) => (
              <Link
                key={page.url}
                href={page.url}
                className={`p-4 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-slate-900 hover:bg-slate-800 border border-slate-700'
                    : 'bg-white hover:bg-gray-50 border'
                }`}
              >
                <h3 className="font-semibold mb-2">{page.name}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {page.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Session Warning */}
        {session && !extSession.refreshToken && (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-amber-900/30 border border-amber-700' : 'bg-amber-50 border border-amber-200'}`}>
            <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>No Refresh Token</h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              This session does not have a refresh token. This typically means 2FA has not been completed.
              Token refresh will fail when the access token expires.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestEnvPage;
