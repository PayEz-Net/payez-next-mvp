"use strict";
// Patch script to add re-authentication to security page
const fs = require('fs');
const path = 'E:/Repos/PayEz-Next-MVP/packages/next-mvp/src/pages/security/EnhancedSecurityPage.tsx';
let content = fs.readFileSync(path, 'utf8');
// 1. Add ReAuthModal component after StatusBadge
const statusBadgeEnd = `// Status Badge Component
function StatusBadge({ enabled, label, isDark }: { enabled: boolean; label?: string; isDark: boolean }) {
  const bgClass = enabled
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  return (
    <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${bgClass}\`}>
      {label || (enabled ? 'Enabled' : 'Not Active')}
    </span>
  );
}`;
const reAuthModal = `// Status Badge Component
function StatusBadge({ enabled, label, isDark }: { enabled: boolean; label?: string; isDark: boolean }) {
  const bgClass = enabled
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  return (
    <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${bgClass}\`}>
      {label || (enabled ? 'Enabled' : 'Not Active')}
    </span>
  );
}

// Re-Authentication Modal Component (Security Addendum)
type ReAuthAction = 'enable_2fa' | 'disable_2fa' | 'export_data' | 'delete_account' | null;

function ReAuthModal({
  isOpen,
  action,
  require2FA,
  onConfirm,
  onCancel,
  isDark,
}: {
  isOpen: boolean;
  action: ReAuthAction;
  require2FA: boolean;
  onConfirm: (password: string, twoFactorCode?: string) => void;
  onCancel: () => void;
  isDark: boolean;
}) {
  const [password, setPassword] = React.useState('');
  const [twoFactorCode, setTwoFactorCode] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');

  if (!isOpen) return null;

  const getTitle = () => {
    switch (action) {
      case 'enable_2fa': return 'Enable Two-Factor Authentication';
      case 'disable_2fa': return 'Disable Two-Factor Authentication';
      case 'export_data': return 'Export Your Data';
      case 'delete_account': return 'Delete Account';
      default: return 'Confirm Action';
    }
  };

  const getDescription = () => {
    switch (action) {
      case 'enable_2fa': return 'Enter your password to enable 2FA.';
      case 'disable_2fa': return 'Enter your password to disable 2FA. This will make your account less secure.';
      case 'export_data': return require2FA
        ? 'Enter your password or 2FA code to request a data export.'
        : 'Enter your password to request a data export.';
      case 'delete_account': return require2FA
        ? 'Enter your password AND 2FA code to permanently delete your account.'
        : 'Enter your password to permanently delete your account.';
      default: return 'Please re-authenticate to continue.';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password && !(action === 'export_data' && twoFactorCode)) {
      setError('Password is required');
      return;
    }
    if (action === 'delete_account' && require2FA && !twoFactorCode) {
      setError('2FA code is required for account deletion');
      return;
    }
    onConfirm(password, twoFactorCode || undefined);
  };

  const bgOverlay = 'bg-black/50';
  const modalBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-slate-700' : 'bg-white';
  const inputBorder = isDark ? 'border-slate-600' : 'border-gray-300';

  const isDestructive = action === 'disable_2fa' || action === 'delete_account';

  return (
    <div className={\`fixed inset-0 z-50 flex items-center justify-center \${bgOverlay}\`}>
      <div className={\`w-full max-w-md mx-4 rounded-lg shadow-xl \${modalBg} border \${borderColor}\`}>
        <div className={\`px-6 py-4 border-b \${borderColor}\`}>
          <h3 className={\`text-lg font-semibold \${textPrimary}\`}>{getTitle()}</h3>
          <p className={\`text-sm mt-1 \${textMuted}\`}>{getDescription()}</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className={\`block text-sm font-medium mb-1 \${textMuted}\`}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={\`w-full px-3 py-2 rounded-md border \${inputBorder} \${inputBg} \${textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent\`}
                placeholder="Enter your password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={\`absolute right-2 top-1/2 -translate-y-1/2 text-xs \${textMuted}\`}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {(require2FA || action === 'export_data') && (
            <div>
              <label className={\`block text-sm font-medium mb-1 \${textMuted}\`}>
                {action === 'export_data' ? '2FA Code (optional if password provided)' : '2FA Code'}
              </label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\\D/g, '').slice(0, 6))}
                className={\`w-full px-3 py-2 rounded-md border \${inputBorder} \${inputBg} \${textPrimary} focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center tracking-widest\`}
                placeholder="000000"
                maxLength={6}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-2">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className={\`flex-1 px-4 py-2 rounded-md border \${borderColor} \${textMuted} hover:bg-slate-700/20\`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={\`flex-1 px-4 py-2 rounded-md text-white \${
                isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }\`}
            >
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`;
content = content.replace(statusBadgeEnd, reAuthModal);
// 2. Add state for re-auth modal after the showPasswords state
const stateLocation = `const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });`;
const newState = `const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  // Re-authentication modal state (Security Addendum)
  const [reAuthModal, setReAuthModal] = useState<{
    isOpen: boolean;
    action: ReAuthAction;
  }>({ isOpen: false, action: null });`;
content = content.replace(stateLocation, newState);
// 3. Add handler functions after useEffect for security data fetch
const fetchEffectEnd = `useEffect(() => {
    if (profileData) fetchSecurityData();
  }, [profileData, fetchSecurityData]);`;
const handlersAddition = `useEffect(() => {
    if (profileData) fetchSecurityData();
  }, [profileData, fetchSecurityData]);

  // Re-auth handlers (Security Addendum)
  const handleReAuthConfirm = async (password: string, twoFactorCode?: string) => {
    const action = reAuthModal.action;
    setReAuthModal({ isOpen: false, action: null });

    // In production, these would call the appropriate API endpoints
    switch (action) {
      case 'enable_2fa':
        console.log('Enable 2FA with password confirmation');
        // POST /api/account/2fa/enable with { password }
        break;
      case 'disable_2fa':
        console.log('Disable 2FA with password confirmation');
        // POST /api/account/2fa/disable with { password }
        break;
      case 'export_data':
        console.log('Export data with password/2FA confirmation');
        // POST /api/account/export-data with { password?, two_factor_code? }
        break;
      case 'delete_account':
        console.log('Delete account with password + 2FA confirmation');
        // POST /api/account/delete with { password, two_factor_code }
        break;
    }
  };

  const openReAuthModal = (action: ReAuthAction) => {
    setReAuthModal({ isOpen: true, action });
  };`;
content = content.replace(fetchEffectEnd, handlersAddition);
// 4. Update Enable 2FA button
const oldEnable2FA = `<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Enable 2FA
              </button>`;
const newEnable2FA = `<button
                  onClick={() => openReAuthModal('enable_2fa')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Enable 2FA
                </button>`;
content = content.replace(oldEnable2FA, newEnable2FA);
// 5. Update Disable 2FA button
const oldDisable2FA = `<button className="px-3 py-1.5 text-sm rounded border border-red-500 text-red-500 hover:bg-red-500/10">
                  Disable 2FA
                </button>`;
const newDisable2FA = `<button
                    onClick={() => openReAuthModal('disable_2fa')}
                    className="px-3 py-1.5 text-sm rounded border border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    Disable 2FA
                  </button>`;
content = content.replace(oldDisable2FA, newDisable2FA);
// 6. Update Export Data button
const oldExport = `<button className="px-4 py-2 text-sm rounded border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10">
                Request Export
              </button>`;
const newExport = `<button
                  onClick={() => openReAuthModal('export_data')}
                  className="px-4 py-2 text-sm rounded border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
                >
                  Request Export
                </button>`;
content = content.replace(oldExport, newExport);
// 7. Update Delete Account button
const oldDelete = `<button className="px-4 py-2 text-sm rounded border border-red-500 text-red-500 hover:bg-red-500/10">
                Delete Account
              </button>`;
const newDelete = `<button
                  onClick={() => openReAuthModal('delete_account')}
                  className="px-4 py-2 text-sm rounded border border-red-500 text-red-500 hover:bg-red-500/10"
                >
                  Delete Account
                </button>`;
content = content.replace(oldDelete, newDelete);
// 8. Add ReAuthModal component to JSX before closing div
const closingDiv = `{/* Back to Profile link */}
        <div className="text-center">
          <a href="/account/profile" className={\`text-sm hover:underline \${textMuted}\`}>
            Back to Profile
          </a>
        </div>
      </div>
    </div>
  );
}`;
const withModal = `{/* Re-Authentication Modal */}
        <ReAuthModal
          isOpen={reAuthModal.isOpen}
          action={reAuthModal.action}
          require2FA={twoFactorEnabled}
          onConfirm={handleReAuthConfirm}
          onCancel={() => setReAuthModal({ isOpen: false, action: null })}
          isDark={isDark}
        />

        {/* Back to Profile link */}
        <div className="text-center">
          <a href="/account/profile" className={\`text-sm hover:underline \${textMuted}\`}>
            Back to Profile
          </a>
        </div>
      </div>
    </div>
  );
}`;
content = content.replace(closingDiv, withModal);
fs.writeFileSync(path, content);
console.log('Security page patched with re-authentication modals');
