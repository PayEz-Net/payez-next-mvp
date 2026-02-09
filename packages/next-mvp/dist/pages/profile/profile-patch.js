"use strict";
// Patch script to add password confirmation to profile page phone/email change
const fs = require('fs');
const path = 'E:/Repos/PayEz-Next-MVP/packages/next-mvp/src/pages/profile/EnhancedProfilePage.tsx';
let content = fs.readFileSync(path, 'utf8');
// 1. Add PasswordConfirmModal after FieldRow component
const fieldRowEnd = `function FieldRow({ label, value, verified, action, isDarkMode }: FieldRowProps) {
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0 border-slate-700/30">
      <div className="flex-1">
        <span className={\`text-sm \${textSecondary}\`}>{label}</span>
        <div className="flex items-center gap-2 mt-0.5">
          {value ? (
            <span className={textPrimary}>{value}</span>
          ) : (
            <span className={textSecondary}>Not set</span>
          )}
          {verified !== undefined && (
            <span className={\`text-xs px-2 py-0.5 rounded-full \${
              verified
                ? 'bg-green-900/30 text-green-400'
                : 'bg-yellow-900/30 text-yellow-400'
            }\`}>
              {verified ? 'Verified' : 'Unverified'}
            </span>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}`;
const passwordConfirmModal = `function FieldRow({ label, value, verified, action, isDarkMode }: FieldRowProps) {
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0 border-slate-700/30">
      <div className="flex-1">
        <span className={\`text-sm \${textSecondary}\`}>{label}</span>
        <div className="flex items-center gap-2 mt-0.5">
          {value ? (
            <span className={textPrimary}>{value}</span>
          ) : (
            <span className={textSecondary}>Not set</span>
          )}
          {verified !== undefined && (
            <span className={\`text-xs px-2 py-0.5 rounded-full \${
              verified
                ? 'bg-green-900/30 text-green-400'
                : 'bg-yellow-900/30 text-yellow-400'
            }\`}>
              {verified ? 'Verified' : 'Unverified'}
            </span>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Password Confirmation Modal for sensitive changes (Security Addendum)
type ChangeAction = 'change_email' | 'change_phone' | null;

function PasswordConfirmModal({
  isOpen,
  action,
  onConfirm,
  onCancel,
  isDarkMode,
}: {
  isOpen: boolean;
  action: ChangeAction;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}) {
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setShowPassword(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const title = action === 'change_email' ? 'Change Email Address' : 'Change Phone Number';
  const description = action === 'change_email'
    ? 'Enter your password to verify your identity before changing your email.'
    : 'Enter your password to verify your identity before changing your phone number.';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Password is required');
      return;
    }
    onConfirm(password);
  };

  const bgOverlay = 'bg-black/50';
  const modalBg = isDarkMode ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDarkMode ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textMuted = isDarkMode ? 'text-slate-400' : 'text-gray-500';
  const inputBg = isDarkMode ? 'bg-slate-700' : 'bg-white';
  const inputBorder = isDarkMode ? 'border-slate-600' : 'border-gray-300';

  return (
    <div className={\`fixed inset-0 z-50 flex items-center justify-center \${bgOverlay}\`}>
      <div className={\`w-full max-w-md mx-4 rounded-lg shadow-xl \${modalBg} border \${borderColor}\`}>
        <div className={\`px-6 py-4 border-b \${borderColor}\`}>
          <h3 className={\`text-lg font-semibold \${textPrimary}\`}>{title}</h3>
          <p className={\`text-sm mt-1 \${textMuted}\`}>{description}</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className={\`block text-sm font-medium mb-1 \${textMuted}\`}>Current Password</label>
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
              className="flex-1 px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}`;
content = content.replace(fieldRowEnd, passwordConfirmModal);
// 2. Add state for password modal after isDarkMode declaration
const isDarkModeDecl = `const isDarkMode = colors?.background?.includes('slate-9') ||
                       colors?.background?.includes('gray-9') ||
                       colors?.card?.includes('slate-8');`;
const withModalState = `const isDarkMode = colors?.background?.includes('slate-9') ||
                       colors?.background?.includes('gray-9') ||
                       colors?.card?.includes('slate-8');

  // Password confirmation modal state (Security Addendum)
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    action: ChangeAction;
  }>({ isOpen: false, action: null });

  // Handler for password confirmation
  const handlePasswordConfirm = async (password: string) => {
    const action = passwordModal.action;
    setPasswordModal({ isOpen: false, action: null });

    // In production, verify password then redirect to change flow
    if (action === 'change_email') {
      console.log('Starting email change flow after password verification');
      // POST /api/account/verify-password then redirect to email change page
      // window.location.href = '/account/change-email';
    } else if (action === 'change_phone') {
      console.log('Starting phone change flow after password verification');
      // POST /api/account/verify-password then redirect to phone change page
      // window.location.href = '/account/change-phone';
    }
  };`;
content = content.replace(isDarkModeDecl, withModalState);
// 3. Update email Change button to use modal
const oldEmailChange = `<button className={\`text-sm \${isDarkMode ? 'text-blue-400' : 'text-blue-600'}\`}>
                  Change
                </button>
              }
              isDarkMode={isDarkMode}
            />
            <FieldRow
              label="Primary Phone"`;
const newEmailChange = `<button
                    onClick={() => setPasswordModal({ isOpen: true, action: 'change_email' })}
                    className={\`text-sm \${isDarkMode ? 'text-blue-400' : 'text-blue-600'}\`}
                  >
                  Change
                </button>
              }
              isDarkMode={isDarkMode}
            />
            <FieldRow
              label="Primary Phone"`;
content = content.replace(oldEmailChange, newEmailChange);
// 4. Update phone Change button to use modal
const oldPhoneChange = `<button className={\`text-sm \${isDarkMode ? 'text-blue-400' : 'text-blue-600'}\`}>
                  Change
                </button>
              }
              isDarkMode={isDarkMode}
            />
            <FieldRow
              label="Secondary Email"`;
const newPhoneChange = `<button
                    onClick={() => setPasswordModal({ isOpen: true, action: 'change_phone' })}
                    className={\`text-sm \${isDarkMode ? 'text-blue-400' : 'text-blue-600'}\`}
                  >
                  Change
                </button>
              }
              isDarkMode={isDarkMode}
            />
            <FieldRow
              label="Secondary Email"`;
content = content.replace(oldPhoneChange, newPhoneChange);
// 5. Add modal component before closing div
const closingPart = `{/* Back to App link */}
        <div className="text-center">
          <a href="/" className={\`text-sm hover:underline \${textSecondary}\`}>
            Back to App
          </a>
        </div>
      </div>
    </div>
  );
}`;
const withModalJSX = `{/* Password Confirmation Modal */}
        <PasswordConfirmModal
          isOpen={passwordModal.isOpen}
          action={passwordModal.action}
          onConfirm={handlePasswordConfirm}
          onCancel={() => setPasswordModal({ isOpen: false, action: null })}
          isDarkMode={isDarkMode}
        />

        {/* Back to App link */}
        <div className="text-center">
          <a href="/" className={\`text-sm hover:underline \${textSecondary}\`}>
            Back to App
          </a>
        </div>
      </div>
    </div>
  );
}`;
content = content.replace(closingPart, withModalJSX);
fs.writeFileSync(path, content);
console.log('Profile page patched with password confirmation for email/phone changes');
