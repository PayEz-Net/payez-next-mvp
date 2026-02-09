'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { accountApi } from '@payez/next-mvp/utils/api';

type RecoveryStep = 'initiate' | 'select-method' | 'verify-code' | 'set-password' | 'complete';

interface RecoverySession {
  recoveryToken: string;
  email: string;
  maskedEmail?: string;
  maskedPhone?: string;
  hasAuthenticator?: boolean;
  availableMethods: Array<'email' | 'sms' | 'authenticator'>;
  expiresAt: string;
}

interface PasswordResetToken {
  token: string;
  expiresAt: string;
}

function RecoveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams?.get('email') || '';

  const [currentStep, setCurrentStep] = useState<RecoveryStep>('initiate');
  const [email, setEmail] = useState(prefilledEmail);
  const [recoverySession, setRecoverySession] = useState<RecoverySession | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'sms' | 'authenticator' | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [passwordResetToken, setPasswordResetToken] = useState<PasswordResetToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleInitiateRecovery = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await accountApi.initiateRecovery(email);

      if (response.success && response.data.recovery_session_token) {
        setRecoverySession({
          recoveryToken: response.data.recovery_session_token,
          email: email,
          maskedEmail: response.data.masked_email,
          maskedPhone: response.data.masked_phone,
          hasAuthenticator: response.data.has_authenticator,
          availableMethods: response.data.available_methods || [],
          expiresAt: response.data.expires_at || ''
        });
        setCurrentStep('select-method');
      } else {
        setCurrentStep('complete');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate recovery.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (method: 'email' | 'sms' | 'authenticator') => {
    if (!recoverySession) return;
    setLoading(true);
    setError(null);
    setSelectedMethod(method);

    try {
      const response = await accountApi.sendRecoveryCode(recoverySession.recoveryToken, method);
      if (response.success) {
        setCurrentStep('verify-code');
        setResendCooldown(30);
      } else {
        setError('Failed to send verification code.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!recoverySession || !selectedMethod) return;
    setLoading(true);
    setError(null);

    try {
      const response = await accountApi.verifyRecoveryCode(
        recoverySession.recoveryToken,
        verificationCode,
        selectedMethod
      );

      if (response.success && response.data) {
        setPasswordResetToken({
          token: response.data.password_reset_token,
          expiresAt: response.data.expires_at
        });
        setCurrentStep('set-password');
      } else {
        setError(response.error?.message || 'Invalid code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordResetToken || !recoverySession) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await accountApi.resetPasswordWithToken(
        recoverySession.email,
        passwordResetToken.token,
        password,
        confirmPassword
      );

      if (response.success) {
        setCurrentStep('complete');
      } else {
        setError('Failed to reset password.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white border border-gray-300 rounded p-8">
          {currentStep === 'initiate' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Account Recovery</h2>
              <p className="text-sm text-gray-600 mb-6">
                Enter your email address to begin account recovery.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); handleInitiateRecovery(); }} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 border border-gray-300 rounded text-gray-900 font-medium hover:bg-gray-50"
                >
                  {loading ? 'Processing...' : 'Continue'}
                </button>
              </form>
            </>
          )}

          {currentStep === 'select-method' && recoverySession && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Verification Method</h2>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4 text-sm">
                {recoverySession.maskedEmail && <div>Email: {recoverySession.maskedEmail}</div>}
                {recoverySession.maskedPhone && <div>Phone: {recoverySession.maskedPhone}</div>}
              </div>
              <div className="space-y-2">
                {recoverySession.availableMethods.includes('email') && (
                  <button
                    onClick={() => handleSendCode('email')}
                    disabled={loading}
                    className="w-full py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Send Code via Email
                  </button>
                )}
                {recoverySession.availableMethods.includes('sms') && (
                  <button
                    onClick={() => handleSendCode('sms')}
                    disabled={loading}
                    className="w-full py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Send Code via SMS
                  </button>
                )}
              </div>
            </>
          )}

          {currentStep === 'verify-code' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Enter Verification Code</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleVerifyCode(); }} className="space-y-4">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-center text-2xl tracking-widest"
                />
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
            </>
          )}

          {currentStep === 'set-password' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Set New Password</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }} className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {currentStep === 'complete' && (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Password Reset Complete</h2>
              <p className="text-gray-600 mb-6">You can now log in with your new password.</p>
              <button
                onClick={() => router.push('/account-auth/login')}
                className="w-full py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>

        {currentStep !== 'complete' && currentStep !== 'initiate' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                if (currentStep === 'select-method') setCurrentStep('initiate');
                else if (currentStep === 'verify-code') setCurrentStep('select-method');
                else if (currentStep === 'set-password') setCurrentStep('verify-code');
              }}
              className="text-sm text-gray-900 hover:underline"
            >
              ← Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecoveryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <RecoveryContent />
    </Suspense>
  );
}
