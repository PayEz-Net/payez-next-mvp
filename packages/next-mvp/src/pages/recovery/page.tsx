'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RecoveryStep, RecoverySession, PasswordResetToken } from '../../types/recovery';
import { accountApi } from '../../utils/api';
import { InitiateRecoveryStep } from '../../components/recovery/InitiateRecoveryStep';
import { SelectMethodStep } from '../../components/recovery/SelectMethodStep';
import { VerifyCodeStep } from '../../components/recovery/VerifyCodeStep';
import { SetPasswordStep } from '../../components/recovery/SetPasswordStep';
import { CompleteStep } from '../../components/recovery/CompleteStep';
import { useColors } from '../../theme/useTheme';

function RecoveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams?.get('email') || '';
  const colors = useColors();

  const [currentStep, setCurrentStep] = useState<RecoveryStep>('initiate');
  const [email, setEmail] = useState(prefilledEmail);
  const [recoverySession, setRecoverySession] = useState<RecoverySession | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'sms' | 'authenticator' | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [passwordResetToken, setPasswordResetToken] = useState<PasswordResetToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setError(err instanceof Error ? err.message : 'Failed to initiate recovery. Please try again.');
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
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code.');
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
        setError(response.error?.message || 'Invalid verification code');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (password: string, confirmPassword: string) => {
    if (!passwordResetToken || !recoverySession) return;

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
        setError('Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (currentStep === 'select-method') setCurrentStep('initiate');
    else if (currentStep === 'verify-code') setCurrentStep('select-method');
    else if (currentStep === 'set-password') setCurrentStep('verify-code');
  };

  return (
    <div className="w-full flex items-center justify-center p-6" style={{ background: 'var(--bg-default)' }}>
      <div className="max-w-md w-full">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="mb-4 rounded-2xl p-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Processing...</p>
          </div>
        )}

        {currentStep === 'initiate' && (
          <InitiateRecoveryStep
            email={email}
            setEmail={setEmail}
            onSubmit={handleInitiateRecovery}
            loading={loading}
          />
        )}

        {currentStep === 'select-method' && recoverySession && (
          <SelectMethodStep
            session={recoverySession}
            onSelectMethod={handleSendCode}
            loading={loading}
          />
        )}

        {currentStep === 'verify-code' && (
          <VerifyCodeStep
            code={verificationCode}
            setCode={setVerificationCode}
            onSubmit={handleVerifyCode}
            onResend={() => selectedMethod && handleSendCode(selectedMethod)}
            loading={loading}
            maskedDestination={
              selectedMethod === 'sms'
                ? recoverySession?.maskedPhone
                : recoverySession?.maskedEmail
            }
          />
        )}

        {currentStep === 'set-password' && (
          <SetPasswordStep
            onSubmit={handleResetPassword}
            loading={loading}
          />
        )}

        {currentStep === 'complete' && (
          <CompleteStep
            onGoToLogin={() => router.push('/account-auth/login')}
          />
        )}

        {currentStep !== 'complete' && currentStep !== 'initiate' && !loading && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleGoBack}
              className="text-sm hover:underline font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              ← Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  const colors = useColors();
  return (
    <div className="w-full flex items-center justify-center" style={{ background: 'var(--bg-default)' }}>
      <div className="border rounded-2xl p-8" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    </div>
  );
}

export default function RecoveryPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RecoveryContent />
    </Suspense>
  );
}
