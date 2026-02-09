'use client';

import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

/**
 * Emergency Logout Page
 *
 * Nuclear option for clearing auth state when things go wrong.
 * Clears cookies, localStorage, and forces NextAuth signout.
 *
 * Usage in consuming app:
 * ```typescript
 * // app/test-env/emergency-logout/page.tsx
 * export { EmergencyLogoutPage as default } from '@payez/next-mvp/pages/test-env';
 * ```
 */
export function EmergencyLogoutPage() {
  const { status } = useSession();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutComplete, setLogoutComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

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

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString().substring(11, 19)}] ${message}`]);
  };

  const handleEmergencyLogout = async () => {
    setIsLoggingOut(true);
    setLogs([]);

    try {
      // Step 1: Clear all cookies
      addLog('Clearing cookies...');
      document.cookie.split(';').forEach(cookie => {
        const name = cookie.split('=')[0].trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      });
      addLog('Cookies cleared');

      // Step 2: Clear localStorage
      addLog('Clearing localStorage...');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keysToRemove.push(key);
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        addLog(`  Removed: ${key}`);
      });
      addLog(`localStorage cleared (${keysToRemove.length} items)`);

      // Step 3: Clear sessionStorage
      addLog('Clearing sessionStorage...');
      sessionStorage.clear();
      addLog('sessionStorage cleared');

      // Step 4: Call NextAuth signOut
      addLog('Calling NextAuth signOut...');
      await signOut({ redirect: false });
      addLog('NextAuth signOut complete');

      // Step 5: Clear any auth-related fetch cache
      addLog('Invalidating caches...');
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        addLog(`Cleared ${cacheNames.length} caches`);
      }

      addLog('Emergency logout complete!');
      setLogoutComplete(true);

    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRedirectHome = () => {
    window.location.href = '/';
  };

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Emergency Logout</h1>
        <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Nuclear option for when auth gets into a bad state. Clears everything.
        </p>

        {/* Current Status */}
        <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-slate-900' : 'bg-white border'}`}>
          <h2 className="font-semibold mb-2">Current Status</h2>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-3 h-3 rounded-full ${
              status === 'authenticated' ? 'bg-green-500' :
              status === 'loading' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span className="capitalize">{status}</span>
          </div>
        </div>

        {/* Action Button */}
        {!logoutComplete ? (
          <button
            onClick={handleEmergencyLogout}
            disabled={isLoggingOut}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              isLoggingOut
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isLoggingOut ? 'Logging out...' : 'Emergency Logout'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
              <p className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                Logout complete! All auth state has been cleared.
              </p>
            </div>
            <button
              onClick={handleRedirectHome}
              className="w-full py-3 px-4 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              Go to Home Page
            </button>
          </div>
        )}

        {/* Log Output */}
        {logs.length > 0 && (
          <div className={`mt-6 p-4 rounded-lg font-mono text-sm ${isDarkMode ? 'bg-slate-900' : 'bg-gray-100'}`}>
            <h3 className="font-semibold mb-2">Log</h3>
            <div className="space-y-1">
              {logs.map((log, i) => (
                <div key={i} className={log.includes('ERROR') ? 'text-red-500' : isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What this does */}
        <div className={`mt-8 p-4 rounded-lg ${isDarkMode ? 'bg-slate-900' : 'bg-white border'}`}>
          <h2 className="font-semibold mb-2">What this does</h2>
          <ul className={`list-disc list-inside space-y-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <li>Clears all browser cookies</li>
            <li>Clears localStorage (theme, preferences, etc.)</li>
            <li>Clears sessionStorage</li>
            <li>Calls NextAuth signOut</li>
            <li>Invalidates browser caches</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default EmergencyLogoutPage;
