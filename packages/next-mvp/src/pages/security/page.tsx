/**
 * Themed Security Page for @payez/next-mvp
 *
 * DEPENDENCIES: Only React, Next.js, next-auth, React Query, and Tailwind CSS
 * NO shadcn/ui or other UI library required!
 *
 * FEATURES:
 * - Security summary (2FA status, email status, phone status)
 * - Change password form with policy validation
 * - Themeable styling via ThemeProvider
 * - Uses React Query for data fetching (matches website-membership pattern)
 *
 * USAGE:
 * 1. Import from @payez/next-mvp/pages/security
 * 2. Wrap your app with ThemeProvider to customize branding
 * 3. Create API routes at:
 *    - src/app/api/account/profile/route.ts
 *    - src/app/api/account/change-password/route.ts
 *    - src/app/api/account/validate-password/route.ts
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { usePasswordValidation } from '../../hooks/usePasswordValidation';
import { useLayout, useColors } from '../../theme/useTheme';

interface PasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Inline PasswordStrengthMeter component
function PasswordStrengthMeter({
  score,
  failedRequirements,
  tip,
  isDarkMode = false,
}: {
  score: number;
  failedRequirements: string[];
  tip?: string;
  isDarkMode?: boolean;
}) {
  const getStrengthColor = (s: number) => {
    if (s >= 4) return 'bg-green-500';
    if (s >= 3) return 'bg-yellow-500';
    if (s >= 2) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStrengthLabel = (s: number) => {
    if (s >= 4) return 'Strong';
    if (s >= 3) return 'Good';
    if (s >= 2) return 'Fair';
    if (s >= 1) return 'Weak';
    return 'Very Weak';
  };

  const mutedTextClass = isDarkMode ? 'text-slate-400' : 'text-gray-500';
  const barBgClass = isDarkMode ? 'bg-slate-600' : 'bg-gray-200';

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className={`flex-1 h-2 rounded-full overflow-hidden ${barBgClass}`}>
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor(score)}`}
            style={{ width: `${Math.min(score * 20, 100)}%` }}
          />
        </div>
        <span className={`text-xs w-16 ${mutedTextClass}`}>{getStrengthLabel(score)}</span>
      </div>

      {/* Failed requirements */}
      {failedRequirements.length > 0 && (
        <ul className={`text-xs space-y-1 ${mutedTextClass}`}>
          {failedRequirements.map((req, i) => (
            <li key={i} className="flex items-center gap-1">
              <span className="text-red-400">×</span> {req}
            </li>
          ))}
        </ul>
      )}

      {/* Tip */}
      {tip && (
        <p className="text-xs text-blue-400">{tip}</p>
      )}
    </div>
  );
}

// Inline PasswordPolicyChecklist component
function PasswordPolicyChecklist({
  policy,
  password,
  isDarkMode = false,
}: {
  policy: any;
  password: string;
  isDarkMode?: boolean;
}) {
  const checks = React.useMemo(() => {
    const list: { label: string; ok: boolean }[] = [];
    const minLen = typeof policy?.min_length === 'number' && policy.min_length > 0 ? policy.min_length : 8;
    list.push({ label: `At least ${minLen} characters`, ok: (password?.length || 0) >= minLen });
    if (policy?.require_uppercase) list.push({ label: 'One uppercase letter (A-Z)', ok: /[A-Z]/.test(password || '') });
    if (policy?.require_lowercase) list.push({ label: 'One lowercase letter (a-z)', ok: /[a-z]/.test(password || '') });
    if (policy?.require_digit) list.push({ label: 'One digit (0-9)', ok: /\d/.test(password || '') });
    if (policy?.require_special) list.push({ label: 'One special character (!@#$% etc.)', ok: /[^A-Za-z0-9]/.test(password || '') });
    return list;
  }, [policy, password]);

  const mutedTextClass = isDarkMode ? 'text-slate-400' : 'text-gray-500';
  const successTextClass = 'text-green-400';

  return (
    <div className="space-y-1 text-xs">
      {checks.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          {c.ok ? (
            <span className={successTextClass}>✓</span>
          ) : (
            <span className={mutedTextClass}>○</span>
          )}
          <span className={c.ok ? successTextClass : mutedTextClass}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function SecurityPage() {
  const { data: profileData, isLoading: isProfileLoading } = useProfile();
  const layout = useLayout();
  const colors = useColors();

  // Determine if dark mode based on background color
  const isDarkMode = colors?.background?.includes('slate-9') ||
                     colors?.background?.includes('gray-9') ||
                     colors?.background?.includes('dark') ||
                     colors?.card?.includes('slate-8') ||
                     colors?.card?.includes('gray-8');

  // Password form state
  const [formData, setFormData] = useState<PasswordData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password validation
  const {
    setPassword: validateNewPassword,
    isValid: newPasswordIsValid,
    score: newPasswordScore,
    failedRequirements,
    tip,
    policy,
  } = usePasswordValidation({ debounceMs: 250 });

  // Validate new password on change
  useEffect(() => {
    validateNewPassword(formData.new_password);
  }, [formData.new_password, validateNewPassword]);

  const passwordsMatch = formData.confirm_password.length > 0 && formData.new_password === formData.confirm_password;
  const canSubmit = !submitting && newPasswordIsValid && passwordsMatch && formData.current_password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
      setError('All fields are required');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('New password and confirmation do not match');
      return;
    }

    if (!newPasswordIsValid) {
      setError('Please meet the password requirements before submitting');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: formData.current_password,
          new_password: formData.new_password,
          confirm_password: formData.confirm_password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Extract error message
        let errorMsg = result.message || 'Failed to change password';
        if (result.details?.value && Array.isArray(result.details.value) && result.details.value.length > 0) {
          errorMsg = result.details.value[0].message || errorMsg;
        } else if (result.details?.message) {
          errorMsg = result.details.message;
        }
        setError(errorMsg);
        return;
      }

      // Success
      setSuccess(result.message || 'Password changed successfully');
      setFormData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine loading state colors before any early returns
  const loadingTextClass = isDarkMode ? 'text-slate-400' : 'text-gray-500';

  // Loading state
  if (isProfileLoading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <svg className={`animate-spin h-8 w-8 ${loadingTextClass}`} viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12 a 8 8 0 0 1 8 -8 v 4 a 4 4 0 0 0 -4 4 H4 z" />
            </svg>
            <p className={loadingTextClass}>Loading security settings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Theme-aware styling using colors from ThemeProvider
  const cardBgClass = colors?.card || 'bg-white';
  const borderClass = colors?.border || 'border-gray-200';

  // Text colors based on dark/light mode
  const textPrimaryClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = isDarkMode ? 'text-slate-300' : 'text-gray-600';
  const textMutedClass = isDarkMode ? 'text-slate-400' : 'text-gray-500';

  // Input styling
  const inputBgClass = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const inputBorderClass = isDarkMode ? 'border-slate-600' : 'border-gray-300';
  const inputTextClass = isDarkMode ? 'text-white placeholder-slate-400' : 'text-gray-900 placeholder-gray-400';

  // Elevated surfaces (status boxes)
  const elevatedBgClass = isDarkMode ? 'bg-slate-700' : 'bg-gray-100';

  return (
    <div className="min-h-screen">
      <div className={`${layout?.spacing || 'space-y-6'} ${layout?.maxWidth || 'max-w-4xl'} mx-auto ${layout?.padding || 'p-6'}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className={`text-3xl font-bold ${textPrimaryClass}`}>Security</h1>
        </div>

        {/* Security Summary */}
        <div className={`rounded-lg shadow-sm border p-6 ${cardBgClass} ${borderClass}`}>
          <h2 className={`text-xl font-semibold mb-4 ${textPrimaryClass}`}>Security Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 2FA Status */}
            <div className={`p-4 rounded-lg ${elevatedBgClass}`}>
              <p className={`text-sm font-medium mb-2 ${textSecondaryClass}`}>2FA Status</p>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profileData?.two_factor_enabled ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                }`}>
                  {profileData?.two_factor_enabled ? 'Enabled' : 'Not Active'}
                </span>
              </div>
              {!profileData?.two_factor_enabled && (
                <p className={`text-xs mt-2 ${textMutedClass}`}>Self-service 2FA enrollment coming soon</p>
              )}
            </div>

            {/* Email Status */}
            <div className={`p-4 rounded-lg ${elevatedBgClass}`}>
              <p className={`text-sm font-medium mb-2 ${textSecondaryClass}`}>Email Status</p>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profileData?.email_confirmed ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                }`}>
                  {profileData?.email_confirmed ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              <p className={`text-xs mt-2 ${textPrimaryClass}`}>{profileData?.email}</p>
            </div>

            {/* Phone Status */}
            <div className={`p-4 rounded-lg ${elevatedBgClass}`}>
              <p className={`text-sm font-medium mb-2 ${textSecondaryClass}`}>Phone Status</p>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profileData?.phone_confirmed ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                }`}>
                  {profileData?.phone_confirmed ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              {profileData?.phone_number && (
                <p className={`text-xs mt-2 ${textPrimaryClass}`}>{profileData.phone_number}</p>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className={`rounded-lg shadow-sm border p-6 ${cardBgClass} ${borderClass}`}>
          <h2 className={`text-xl font-semibold mb-4 ${textPrimaryClass}`}>Change Password</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textSecondaryClass}`}>Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.current_password}
                  onChange={e => setFormData({ ...formData, current_password: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                  placeholder="Enter current password"
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                  className={`absolute inset-y-0 right-2 flex items-center ${textMutedClass}`}
                >
                  {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textSecondaryClass}`}>New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.new_password}
                  onChange={e => setFormData({ ...formData, new_password: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                  placeholder="Enter new password"
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                  className={`absolute inset-y-0 right-2 flex items-center ${textMutedClass}`}
                >
                  {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {/* Password strength meter */}
              {formData.new_password && (
                <div className="mt-2">
                  <PasswordStrengthMeter
                    score={newPasswordScore}
                    failedRequirements={failedRequirements}
                    tip={tip}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}
              {/* Policy checklist */}
              {policy && formData.new_password && (
                <div className="mt-3">
                  <PasswordPolicyChecklist policy={policy} password={formData.new_password} isDarkMode={isDarkMode} />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${textSecondaryClass}`}>Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirm_password}
                  onChange={e => setFormData({ ...formData, confirm_password: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md shadow-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${inputBgClass} ${inputBorderClass} ${inputTextClass}`}
                  placeholder="Confirm new password"
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                  className={`absolute inset-y-0 right-2 flex items-center ${textMutedClass}`}
                >
                  {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {formData.confirm_password && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
              )}
              {formData.confirm_password && passwordsMatch && (
                <p className="mt-1 text-xs text-green-400">Passwords match</p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-900/30 border border-red-600 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="bg-green-900/30 border border-green-600 rounded-lg p-3">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12 a 8 8 0 0 1 8 -8 v 4 a 4 4 0 0 0 -4 4 H4 z" />
                    </svg>
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Coming Soon Features */}
        <div className={`rounded-lg shadow-sm border p-6 ${cardBgClass} ${borderClass}`}>
          <h2 className={`text-xl font-semibold mb-4 ${textPrimaryClass}`}>Additional Security Features</h2>

          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-lg opacity-60 ${elevatedBgClass}`}>
              <div>
                <p className={`text-sm font-medium ${textPrimaryClass}`}>Active Sessions</p>
                <p className={`text-sm ${textMutedClass}`}>View and manage your active login sessions</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>
                Coming Soon
              </span>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-lg opacity-60 ${elevatedBgClass}`}>
              <div>
                <p className={`text-sm font-medium ${textPrimaryClass}`}>2FA Management</p>
                <p className={`text-sm ${textMutedClass}`}>Enable or configure two-factor authentication</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>
                Coming Soon
              </span>
            </div>
          </div>
        </div>

        {/* Back to Profile link */}
        <div className="text-center">
          <a
            href="/account/profile"
            className={`text-sm hover:underline ${textMutedClass}`}
          >
            ← Back to Profile
          </a>
        </div>
      </div>
    </div>
  );
}
