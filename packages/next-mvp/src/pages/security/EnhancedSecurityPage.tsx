/**
 * Enhanced Security Page for @payez/next-mvp
 *
 * Implements BAPert's Member Self-Service spec with:
 * - Password section with change form
 * - Two-factor authentication management
 * - Connected OAuth accounts
 * - Active sessions list
 * - Recent activity log
 * - Danger zone (data export, account deletion)
 *
 * @see docs/specs/MEMBER_SELF_SERVICE_SPEC.md
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { usePasswordValidation } from '../../hooks/usePasswordValidation';
import { useLayout, useColors } from '../../theme/useTheme';

// Types matching BAPert's spec
interface SecurityData {
  password?: {
    last_changed?: string;
    expires_at?: string;
    days_until_expiry?: number;
    requires_change?: boolean;
  };
  two_factor?: {
    enabled: boolean;
    method?: 'sms' | 'email' | 'authenticator';
    method_display?: string;
    last_updated?: string;
    requires_reenrollment?: boolean;
    backup_codes_remaining?: number;
  };
  connected_accounts?: Array<{
    provider: string;
    provider_key: string;
    email?: string;
    connected_at?: string;
    can_disconnect?: boolean;
  }>;
  active_sessions?: Array<{
    session_id: string;
    device_type?: 'desktop' | 'mobile' | 'tablet';
    device_name?: string;
    ip_address?: string;
    location?: string;
    created_at?: string;
    last_active_at?: string;
    is_current?: boolean;
  }>;
  recent_activity?: Array<{
    event_type: string;
    description: string;
    device?: string;
    timestamp: string;
    success: boolean;
  }>;
}

interface PasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Password Strength Meter Component
function PasswordStrengthMeter({ score, failedRequirements, tip, isDark }: {
  score: number;
  failedRequirements: string[];
  tip?: string;
  isDark: boolean;
}) {
  const getColor = (s: number) => {
    if (s >= 4) return 'bg-green-500';
    if (s >= 3) return 'bg-yellow-500';
    if (s >= 2) return 'bg-orange-500';
    return 'bg-red-500';
  };
  const getLabel = (s: number) => {
    if (s >= 4) return 'Strong';
    if (s >= 3) return 'Good';
    if (s >= 2) return 'Fair';
    if (s >= 1) return 'Weak';
    return 'Very Weak';
  };
  const mutedText = isDark ? 'text-slate-400' : 'text-gray-500';
  const barBg = isDark ? 'bg-slate-600' : 'bg-gray-200';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`flex-1 h-2 rounded-full overflow-hidden ${barBg}`}>
          <div className={`h-full transition-all duration-300 ${getColor(score)}`} style={{ width: `${Math.min(score * 20, 100)}%` }} />
        </div>
        <span className={`text-xs w-16 ${mutedText}`}>{getLabel(score)}</span>
      </div>
      {failedRequirements.length > 0 && (
        <ul className={`text-xs space-y-1 ${mutedText}`}>
          {failedRequirements.map((req, i) => (
            <li key={i} className="flex items-center gap-1"><span className="text-red-400">x</span> {req}</li>
          ))}
        </ul>
      )}
      {tip && <p className="text-xs text-blue-400">{tip}</p>}
    </div>
  );
}

// Policy Checklist Component
function PolicyChecklist({ policy, password, isDark }: { policy: any; password: string; isDark: boolean }) {
  const checks = React.useMemo(() => {
    const list: { label: string; ok: boolean }[] = [];
    const minLen = policy?.min_length || 8;
    list.push({ label: `At least ${minLen} characters`, ok: (password?.length || 0) >= minLen });
    if (policy?.require_uppercase) list.push({ label: 'One uppercase letter', ok: /[A-Z]/.test(password || '') });
    if (policy?.require_lowercase) list.push({ label: 'One lowercase letter', ok: /[a-z]/.test(password || '') });
    if (policy?.require_digit) list.push({ label: 'One digit', ok: /\d/.test(password || '') });
    if (policy?.require_special) list.push({ label: 'One special character', ok: /[^A-Za-z0-9]/.test(password || '') });
    return list;
  }, [policy, password]);

  const mutedText = isDark ? 'text-slate-400' : 'text-gray-500';
  return (
    <div className="space-y-1 text-xs">
      {checks.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          {c.ok ? <span className="text-green-400">v</span> : <span className={mutedText}>o</span>}
          <span className={c.ok ? 'text-green-400' : mutedText}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

// Section Card Component
function SecuritySection({ title, description, children, isDark }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  isDark: boolean;
}) {
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className={`rounded-lg border ${cardBg} ${borderColor}`}>
      <div className={`px-6 py-4 border-b ${borderColor}`}>
        <h2 className={`text-lg font-semibold ${textPrimary}`}>{title}</h2>
        {description && <p className={`text-sm mt-1 ${textMuted}`}>{description}</p>}
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ enabled, label, isDark }: { enabled: boolean; label?: string; isDark: boolean }) {
  const bgClass = enabled
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgClass}`}>
      {label || (enabled ? 'Enabled' : 'Not Active')}
    </span>
  );
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateString; }
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  } catch { return dateString; }
}

export default function EnhancedSecurityPage() {
  const { data: profileData, isLoading: isProfileLoading } = useProfile();
  const layout = useLayout();
  const colors = useColors();

  // Re-auth action types (moved for scope)
type ReAuthAction = 'enable_2fa' | 'disable_2fa' | 'export_data' | 'delete_account' | null;

  // Security data state (would come from API in production)
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [loadingSecurityData, setLoadingSecurityData] = useState(true);

  // Determine dark mode
  const isDark = colors?.background?.includes('slate-9') ||
                 colors?.background?.includes('gray-9') ||
                 colors?.card?.includes('slate-8');

  // Password form state
  const [formData, setFormData] = useState<PasswordData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  // Re-authentication modal state (Security Addendum)
  const [reAuthModal, setReAuthModal] = useState<{
    isOpen: boolean;
    action: ReAuthAction;
  }>({ isOpen: false, action: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password validation
  const { setPassword: validateNewPassword, isValid: newPasswordIsValid, score: newPasswordScore, failedRequirements, tip, policy } = usePasswordValidation({ debounceMs: 250 });

  useEffect(() => { validateNewPassword(formData.new_password); }, [formData.new_password, validateNewPassword]);

  // Fetch security data
  const fetchSecurityData = useCallback(async () => {
    try {
      setLoadingSecurityData(true);
      const res = await fetch('/api/account/security');
      if (res.ok) {
        const data = await res.json();
        setSecurityData(data);
      }
    } catch (err) {
      // Security data fetch is optional - page still works without it
    } finally {
      setLoadingSecurityData(false);
    }
  }, []);

  useEffect(() => {
    if (profileData) fetchSecurityData();
  }, [profileData, fetchSecurityData]);

  const passwordsMatch = formData.confirm_password.length > 0 && formData.new_password === formData.confirm_password;
  const canSubmit = !submitting && newPasswordIsValid && passwordsMatch && formData.current_password.length > 0;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!canSubmit) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        let errorMsg = result.message || 'Failed to change password';
        if (result.details?.value?.[0]?.message) errorMsg = result.details.value[0].message;
        setError(errorMsg);
        return;
      }

      setSuccess(result.message || 'Password changed successfully');
      setFormData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  // Theme classes
  const bgClass = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-slate-300' : 'text-gray-600';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
  const elevatedBg = isDark ? 'bg-slate-700' : 'bg-gray-100';
  const inputBg = isDark ? 'bg-slate-800' : 'bg-white';
  const inputBorder = isDark ? 'border-slate-600' : 'border-gray-300';
  const inputText = isDark ? 'text-white placeholder-slate-400' : 'text-gray-900 placeholder-gray-400';

  // Loading state
  if (isProfileLoading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <p className={textMuted}>Loading security settings...</p>
        </div>
      </div>
    );
  }

  const twoFactorEnabled = profileData?.two_factor_enabled || securityData?.two_factor?.enabled || false;
  const twoFactorMethod = securityData?.two_factor?.method_display || (twoFactorEnabled ? 'SMS' : undefined);

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className={`${layout?.maxWidth || 'max-w-3xl'} mx-auto ${layout?.padding || 'p-6'} space-y-6`}>
        {/* Page Header */}
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>Security</h1>
          <p className={`mt-1 ${textMuted}`}>Manage your account security settings</p>
        </div>

        {/* Security Summary */}
        <div className={`rounded-lg border ${cardBg} ${borderColor} p-6`}>
          <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Security Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${elevatedBg}`}>
              <p className={`text-sm font-medium mb-2 ${textSecondary}`}>2FA Status</p>
              <StatusBadge enabled={twoFactorEnabled} isDark={isDark} />
              {twoFactorMethod && <p className={`text-xs mt-2 ${textMuted}`}>Method: {twoFactorMethod}</p>}
            </div>
            <div className={`p-4 rounded-lg ${elevatedBg}`}>
              <p className={`text-sm font-medium mb-2 ${textSecondary}`}>Email Status</p>
              <StatusBadge enabled={profileData?.email_confirmed || false} label={profileData?.email_confirmed ? 'Verified' : 'Not Verified'} isDark={isDark} />
              <p className={`text-xs mt-2 ${textMuted} truncate`}>{profileData?.email}</p>
            </div>
            <div className={`p-4 rounded-lg ${elevatedBg}`}>
              <p className={`text-sm font-medium mb-2 ${textSecondary}`}>Phone Status</p>
              <StatusBadge enabled={profileData?.phone_confirmed || false} label={profileData?.phone_confirmed ? 'Verified' : 'Not Verified'} isDark={isDark} />
              {profileData?.phone_number && <p className={`text-xs mt-2 ${textMuted}`}>{profileData.phone_number}</p>}
            </div>
          </div>
        </div>

        {/* Password Section */}
        <SecuritySection title="Password" description={securityData?.password?.last_changed ? `Last changed ${formatDate(securityData.password.last_changed)}` : undefined} isDark={isDark}>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.current_password}
                  onChange={e => setFormData({ ...formData, current_password: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputBorder} ${inputText}`}
                  placeholder="Enter current password"
                  disabled={submitting}
                />
                <button type="button" onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))} className={`absolute inset-y-0 right-2 flex items-center ${textMuted}`}>
                  {showPasswords.current ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.new_password}
                  onChange={e => setFormData({ ...formData, new_password: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputBorder} ${inputText}`}
                  placeholder="Enter new password"
                  disabled={submitting}
                />
                <button type="button" onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))} className={`absolute inset-y-0 right-2 flex items-center ${textMuted}`}>
                  {showPasswords.new ? 'Hide' : 'Show'}
                </button>
              </div>
              {formData.new_password && (
                <div className="mt-2">
                  <PasswordStrengthMeter score={newPasswordScore} failedRequirements={failedRequirements} tip={tip} isDark={isDark} />
                </div>
              )}
              {policy && formData.new_password && (
                <div className="mt-3">
                  <PolicyChecklist policy={policy} password={formData.new_password} isDark={isDark} />
                </div>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirm_password}
                  onChange={e => setFormData({ ...formData, confirm_password: e.target.value })}
                  className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputBg} ${inputBorder} ${inputText}`}
                  placeholder="Confirm new password"
                  disabled={submitting}
                />
                <button type="button" onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))} className={`absolute inset-y-0 right-2 flex items-center ${textMuted}`}>
                  {showPasswords.confirm ? 'Hide' : 'Show'}
                </button>
              </div>
              {formData.confirm_password && !passwordsMatch && <p className="mt-1 text-xs text-red-400">Passwords do not match</p>}
              {formData.confirm_password && passwordsMatch && <p className="mt-1 text-xs text-green-400">Passwords match</p>}
            </div>

            {error && <div className="bg-red-900/30 border border-red-600 rounded-lg p-3"><p className="text-red-400 text-sm">{error}</p></div>}
            {success && <div className="bg-green-900/30 border border-green-600 rounded-lg p-3"><p className="text-green-400 text-sm">{success}</p></div>}

            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </SecuritySection>

        {/* Two-Factor Authentication */}
        <SecuritySection title="Two-Factor Authentication" description="Add an extra layer of security to your account" isDark={isDark}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${textPrimary}`}>Status</p>
                <p className={`text-sm ${textMuted}`}>{twoFactorEnabled ? `Enabled via ${twoFactorMethod || 'SMS'}` : 'Not enabled'}</p>
              </div>
              <StatusBadge enabled={twoFactorEnabled} isDark={isDark} />
            </div>
            {twoFactorEnabled ? (
              <div className="flex gap-2">
                <button className={`px-3 py-1.5 text-sm rounded border ${isDark ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'} ${textSecondary}`}>
                  Change Method
                </button>
                <button className="px-3 py-1.5 text-sm rounded border border-red-500 text-red-500 hover:bg-red-500/10">
                  Disable 2FA
                </button>
              </div>
            ) : (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Enable 2FA
              </button>
            )}
            {securityData?.two_factor?.backup_codes_remaining !== undefined && (
              <div className={`mt-4 p-3 rounded-lg ${elevatedBg}`}>
                <p className={`text-sm ${textSecondary}`}>Backup Codes</p>
                <p className={textMuted}>You have {securityData.two_factor.backup_codes_remaining} of 10 backup codes remaining</p>
                <button className={`mt-2 text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>View Codes</button>
              </div>
            )}
          </div>
        </SecuritySection>

        {/* Connected Accounts */}
        <SecuritySection title="Connected Accounts" description="OAuth providers linked to your account" isDark={isDark}>
          {securityData?.connected_accounts && securityData.connected_accounts.length > 0 ? (
            <div className="space-y-3">
              {securityData.connected_accounts.map((account, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${elevatedBg}`}>
                  <div>
                    <p className={`font-medium ${textPrimary}`}>{account.provider}</p>
                    {account.email && <p className={`text-sm ${textMuted}`}>{account.email}</p>}
                    {account.connected_at && <p className={`text-xs ${textMuted}`}>Connected {formatDate(account.connected_at)}</p>}
                  </div>
                  {account.can_disconnect && (
                    <button className="text-sm text-red-500 hover:text-red-400">Disconnect</button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={textMuted}>No connected accounts</p>
          )}
          <button className={`mt-4 text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            Connect Another Account
          </button>
        </SecuritySection>

        {/* Active Sessions */}
        <SecuritySection title="Active Sessions" description="Devices currently logged into your account" isDark={isDark}>
          {securityData?.active_sessions && securityData.active_sessions.length > 0 ? (
            <div className="space-y-3">
              {securityData.active_sessions.map((session, idx) => (
                <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${elevatedBg}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${textPrimary}`}>{session.device_name || 'Unknown Device'}</p>
                      {session.is_current && <span className="px-2 py-0.5 rounded text-xs bg-blue-500 text-white">This Device</span>}
                    </div>
                    <p className={`text-sm ${textMuted}`}>{session.location || session.ip_address}</p>
                    <p className={`text-xs ${textMuted}`}>{session.is_current ? 'Active now' : `Last active ${formatRelativeTime(session.last_active_at)}`}</p>
                  </div>
                  {!session.is_current && (
                    <button className="text-sm text-red-500 hover:text-red-400">Revoke</button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={textMuted}>Session information not available</p>
          )}
          <button className="mt-4 text-sm text-red-500 hover:text-red-400">
            Sign Out All Other Devices
          </button>
        </SecuritySection>

        {/* Recent Activity */}
        <SecuritySection title="Recent Activity" description="Security events on your account" isDark={isDark}>
          {securityData?.recent_activity && securityData.recent_activity.length > 0 ? (
            <div className="space-y-2">
              {securityData.recent_activity.slice(0, 5).map((activity, idx) => (
                <div key={idx} className={`flex items-center justify-between py-2 border-b last:border-b-0 ${borderColor}`}>
                  <div className="flex items-center gap-2">
                    <span className={activity.success ? 'text-green-400' : 'text-red-400'}>{activity.success ? 'v' : 'x'}</span>
                    <div>
                      <p className={`text-sm ${textPrimary}`}>{activity.description}</p>
                      {activity.device && <p className={`text-xs ${textMuted}`}>{activity.device}</p>}
                    </div>
                  </div>
                  <p className={`text-xs ${textMuted}`}>{formatRelativeTime(activity.timestamp)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className={textMuted}>No recent activity</p>
          )}
          <button className={`mt-4 text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            View Full History
          </button>
        </SecuritySection>

        {/* Danger Zone */}
        <SecuritySection title="Danger Zone" description="Irreversible actions" isDark={isDark}>
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-lg border border-yellow-500/50`}>
              <div>
                <p className={`font-medium ${textPrimary}`}>Download My Data</p>
                <p className={`text-sm ${textMuted}`}>Get a copy of all your personal data</p>
              </div>
              <button className="px-4 py-2 text-sm rounded border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10">
                Request Export
              </button>
            </div>
            <div className={`flex items-center justify-between p-4 rounded-lg border border-red-500/50`}>
              <div>
                <p className={`font-medium ${textPrimary}`}>Delete Account</p>
                <p className={`text-sm ${textMuted}`}>Permanently delete your account and all data</p>
              </div>
              <button className="px-4 py-2 text-sm rounded border border-red-500 text-red-500 hover:bg-red-500/10">
                Delete Account
              </button>
            </div>
          </div>
        </SecuritySection>

        {/* Back to Profile link */}
        <div className="text-center">
          <a href="/account/profile" className={`text-sm hover:underline ${textMuted}`}>
            Back to Profile
          </a>
        </div>
      </div>
    </div>
  );
}
