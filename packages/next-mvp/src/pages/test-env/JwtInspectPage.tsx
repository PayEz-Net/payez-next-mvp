'use client';

import { authClient } from '../../client/better-auth-client';
import { useState, useEffect } from 'react';

// Decode JWT header (contains kid, alg, typ)
function decodeJwtHeader(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(header);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// Decode JWT payload (contains claims)
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Session Inspector Page
 *
 * Debug page for inspecting session data from Redis.
 * Shows user info, roles, 2FA status, and tokens.
 *
 * Usage in consuming app:
 * ```typescript
 * // app/test-env/jwt-inspect/page.tsx
 * export { JwtInspectPage as default } from '@payez/next-mvp/pages/test-env';
 * ```
 */
export function JwtInspectPage() {
  const { data: sessionData, isPending } = authClient.useSession();
  const session = sessionData;
  const status = isPending ? 'loading' : session ? 'authenticated' : 'unauthenticated';
  const [copied, setCopied] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [jwtHeader, setJwtHeader] = useState<any>(null);
  const [jwtPayload, setJwtPayload] = useState<any>(null);

  // Detect dark mode
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

  // Decode JWT header and payload when accessToken changes
  useEffect(() => {
    const ext = session as any;
    if (ext?.accessToken) {
      setJwtHeader(decodeJwtHeader(ext.accessToken));
      setJwtPayload(decodeJwtPayload(ext.accessToken));
    }
  }, [session]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (status === 'loading') {
    return (
      <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        Loading session...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
          <h2 className="text-lg font-semibold mb-2">Not Authenticated</h2>
          <p>Please log in to inspect session data.</p>
        </div>
      </div>
    );
  }

  // Extended session with all custom fields
  const ext = session as any;
  const user = ext?.user || {};

  // Card styling helpers
  const cardClass = isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200';
  const labelClass = isDarkMode ? 'text-slate-400' : 'text-gray-500';
  const valueClass = isDarkMode ? 'text-white' : 'text-gray-900';

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Session Inspector</h1>
        <p className={`text-sm ${labelClass}`}>
          Session data from Redis (via NextAuth session callback)
        </p>

        {/* User Identity */}
        <div className={`p-4 rounded-lg ${cardClass}`}>
          <h2 className="text-lg font-semibold mb-4">User Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <InfoRow label="User ID" value={user.id} labelClass={labelClass} valueClass={valueClass} />
            <InfoRow label="Email" value={user.email} labelClass={labelClass} valueClass={valueClass} />
            <InfoRow label="Name" value={user.name} labelClass={labelClass} valueClass={valueClass} />
            <InfoRow label="OAuth Provider" value={user.oauthProvider} labelClass={labelClass} valueClass={valueClass} />
            <InfoRow label="IDP Client ID" value={user.idpClientId} labelClass={labelClass} valueClass={valueClass} />
            <InfoRow label="Merchant ID" value={user.merchantId} labelClass={labelClass} valueClass={valueClass} />
          </div>
        </div>

        {/* Roles */}
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-purple-900/30 border border-purple-700' : 'bg-purple-50 border border-purple-200'}`}>
          <h2 className="text-lg font-semibold mb-4">Roles</h2>
          {user.roles && user.roles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role: string) => (
                <span
                  key={role}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isDarkMode ? 'bg-purple-800 text-purple-100' : 'bg-purple-200 text-purple-800'
                  }`}
                >
                  {role}
                </span>
              ))}
            </div>
          ) : (
            <p className={labelClass}>No roles assigned</p>
          )}
        </div>

        {/* 2FA Status */}
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
          <h2 className="text-lg font-semibold mb-4">2FA Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className={labelClass}>2FA Verified:</span>{' '}
              <StatusBadge
                value={user.twoFactorSessionVerified}
                trueText="Yes"
                falseText="No"
                isDarkMode={isDarkMode}
              />
            </div>
            <div>
              <span className={labelClass}>Requires 2FA:</span>{' '}
              <StatusBadge
                value={user.requiresTwoFactor}
                trueText="Yes"
                falseText="No"
                isDarkMode={isDarkMode}
                invertColors
              />
            </div>
            <InfoRow
              label="Auth Methods (AMR)"
              value={user.authenticationMethods?.join(', ')}
              labelClass={labelClass}
              valueClass={valueClass}
            />
            <InfoRow
              label="Auth Level (ACR)"
              value={user.authenticationLevel}
              labelClass={labelClass}
              valueClass={valueClass}
            />
            <InfoRow
              label="MFA Completed At"
              value={user.mfaCompletedAt ? new Date(user.mfaCompletedAt).toISOString() : undefined}
              labelClass={labelClass}
              valueClass={valueClass}
            />
            <InfoRow
              label="MFA Expires At"
              value={user.mfaExpiresAt ? new Date(user.mfaExpiresAt).toISOString() : undefined}
              labelClass={labelClass}
              valueClass={valueClass}
            />
          </div>
        </div>

        {/* Tokens */}
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
          <h2 className="text-lg font-semibold mb-4">Tokens</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={labelClass}>Session Token (Redis Key):</span>
                {ext.sessionToken && (
                  <CopyButton
                    onClick={() => copyToClipboard(ext.sessionToken, 'session')}
                    copied={copied === 'session'}
                    isDarkMode={isDarkMode}
                  />
                )}
              </div>
              <code className={`block p-2 rounded text-xs break-all ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                {ext.sessionToken || 'N/A'}
              </code>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={labelClass}>Access Token (IDP):</span>
                {ext.accessToken && (
                  <CopyButton
                    onClick={() => copyToClipboard(ext.accessToken, 'access')}
                    copied={copied === 'access'}
                    isDarkMode={isDarkMode}
                  />
                )}
              </div>
              <code className={`block p-2 rounded text-xs break-all max-h-24 overflow-auto ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                {ext.accessToken || 'N/A'}
              </code>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className={labelClass}>Has Refresh Token:</span>{' '}
                <StatusBadge
                  value={!!ext.refreshToken}
                  trueText="Yes"
                  falseText="No"
                  isDarkMode={isDarkMode}
                />
              </div>
              <InfoRow
                label="Access Token Expires"
                value={ext.accessTokenExpires ? new Date(ext.accessTokenExpires).toISOString() : undefined}
                labelClass={labelClass}
                valueClass={valueClass}
              />
            </div>
          </div>
        </div>

        {/* JWT Header (contains kid for key lookup) */}
        {jwtHeader && (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-orange-900/30 border border-orange-700' : 'bg-orange-50 border border-orange-200'}`}>
            <h2 className="text-lg font-semibold mb-4">JWT Header</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <InfoRow label="Algorithm (alg)" value={jwtHeader.alg} labelClass={labelClass} valueClass={valueClass} />
              <InfoRow label="Type (typ)" value={jwtHeader.typ} labelClass={labelClass} valueClass={valueClass} />
              <div>
                <span className={labelClass}>Key ID (kid):</span>{' '}
                <span className={`font-mono ${jwtHeader.kid ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                  {jwtHeader.kid || 'NOT PRESENT'}
                </span>
              </div>
              {Object.entries(jwtHeader)
                .filter(([key]) => !['alg', 'typ', 'kid'].includes(key))
                .map(([key, value]) => (
                  <InfoRow
                    key={key}
                    label={key}
                    value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    labelClass={labelClass}
                    valueClass={valueClass}
                  />
                ))
              }
            </div>
          </div>
        )}

        {/* JWT Payload Claims */}
        {jwtPayload && (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
            <h2 className="text-lg font-semibold mb-4">JWT Payload Claims</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <InfoRow label="Subject (sub)" value={jwtPayload.sub} labelClass={labelClass} valueClass={valueClass} />
              <InfoRow label="Issuer (iss)" value={jwtPayload.iss} labelClass={labelClass} valueClass={valueClass} />
              <InfoRow label="Audience (aud)" value={Array.isArray(jwtPayload.aud) ? jwtPayload.aud.join(', ') : jwtPayload.aud} labelClass={labelClass} valueClass={valueClass} />
              <InfoRow label="Client ID" value={jwtPayload.client_id} labelClass={labelClass} valueClass={valueClass} />
              <InfoRow
                label="Expires (exp)"
                value={jwtPayload.exp ? new Date(jwtPayload.exp * 1000).toISOString() : undefined}
                labelClass={labelClass}
                valueClass={valueClass}
              />
              <InfoRow
                label="Issued At (iat)"
                value={jwtPayload.iat ? new Date(jwtPayload.iat * 1000).toISOString() : undefined}
                labelClass={labelClass}
                valueClass={valueClass}
              />
              <InfoRow
                label="AMR (Auth Methods)"
                value={Array.isArray(jwtPayload.amr) ? jwtPayload.amr.join(', ') : jwtPayload.amr}
                labelClass={labelClass}
                valueClass={valueClass}
              />
              <InfoRow label="ACR (Auth Context)" value={jwtPayload.acr} labelClass={labelClass} valueClass={valueClass} />
            </div>
          </div>
        )}

        {/* Session Expiry */}
        <div className={`p-4 rounded-lg ${cardClass}`}>
          <h2 className="text-lg font-semibold mb-4">Session Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <InfoRow
              label="Session Expires"
              value={(session as any)?.expires ? new Date((session as any).expires).toISOString() : undefined}
              labelClass={labelClass}
              valueClass={valueClass}
            />
            <InfoRow
              label="Error"
              value={ext.error}
              labelClass={labelClass}
              valueClass={ext.error ? 'text-red-500' : valueClass}
            />
          </div>
        </div>

        {/* Raw Session Data */}
        <details className={`p-4 rounded-lg ${cardClass}`}>
          <summary className="font-semibold cursor-pointer">Raw Session Data (Click to expand)</summary>
          <pre className={`mt-4 text-xs overflow-auto p-3 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
            {JSON.stringify(session, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

// Helper Components

function InfoRow({
  label,
  value,
  labelClass,
  valueClass,
}: {
  label: string;
  value?: string | null;
  labelClass: string;
  valueClass: string;
}) {
  return (
    <div>
      <span className={labelClass}>{label}:</span>{' '}
      <span className={valueClass}>{value || 'N/A'}</span>
    </div>
  );
}

function StatusBadge({
  value,
  trueText,
  falseText,
  isDarkMode,
  invertColors = false,
}: {
  value: boolean;
  trueText: string;
  falseText: string;
  isDarkMode: boolean;
  invertColors?: boolean;
}) {
  const isPositive = invertColors ? !value : value;
  const colorClass = isPositive
    ? isDarkMode ? 'bg-green-800 text-green-100' : 'bg-green-200 text-green-800'
    : isDarkMode ? 'bg-red-800 text-red-100' : 'bg-red-200 text-red-800';

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {value ? trueText : falseText}
    </span>
  );
}

function CopyButton({
  onClick,
  copied,
  isDarkMode,
}: {
  onClick: () => void;
  copied: boolean;
  isDarkMode: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs ${
        copied
          ? 'bg-green-600 text-white'
          : isDarkMode
            ? 'bg-slate-700 hover:bg-slate-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
      }`}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default JwtInspectPage;
