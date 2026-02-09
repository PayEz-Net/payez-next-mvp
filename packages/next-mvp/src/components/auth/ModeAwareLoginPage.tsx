'use client';

import React, { useState } from 'react';
import { useAuthConfig } from '../../client/AuthContext';
import { FederatedProvider } from '@/types/auth';
import { FederatedAuthSection } from './FederatedAuthSection';
import { TraditionalAuthSection } from './TraditionalAuthSection';

interface Props {
  onFederatedSignIn?: (provider: FederatedProvider) => void;
  onTraditionalSignIn?: (email: string, password: string) => Promise<void>;
  onForgotPassword?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ModeAwareLoginPage({
  onFederatedSignIn,
  onTraditionalSignIn,
  onForgotPassword,
  isLoading = false,
  error = null,
}: Props) {
  const config = useAuthConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const handleFederatedClick = (provider: FederatedProvider) => {
    onFederatedSignIn?.(provider);
  };

  const handleTraditionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onTraditionalSignIn) return;

    setLocalLoading(true);
    try {
      await onTraditionalSignIn(email, password);
    } finally {
      setLocalLoading(false);
    }
  };

  const isFederated = config.mode === 'federated';
  const isTraditional = config.mode === 'traditional';
  const totalLoading = isLoading || localLoading;

  return (
    <>
      {error && (
        <div
          className="mb-6 px-4 py-3 rounded-lg"
          style={{
            background: 'var(--color-error, #ef4444)',
            color: 'white',
          }}
        >
          {error}
        </div>
      )}

      {/* Federated Only Mode */}
      {isFederated && (
        <FederatedAuthSection
          providers={config.providers}
          onProviderClick={handleFederatedClick}
          isLoading={totalLoading}
        />
      )}

      {/* Traditional Only Mode */}
      {isTraditional && (
        <TraditionalAuthSection
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleTraditionalSubmit}
          isLoading={totalLoading}
          buttonText="Sign In"
          showForgotPassword={config.enableRecovery}
          onForgotPassword={onForgotPassword}
        />
      )}

      {/* Hybrid Mode - Show both */}
      {isFederated === false && isTraditional === false && (
        <>
          <FederatedAuthSection
            providers={config.providers}
            onProviderClick={handleFederatedClick}
            isLoading={totalLoading}
          />

          {config.providers.length > 0 && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div
                  className="w-full"
                  style={{
                    borderTop: '1px solid var(--border-default)',
                  }}
                ></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span
                  className="px-2"
                  style={{
                    background: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Or sign in with email
                </span>
              </div>
            </div>
          )}

          <TraditionalAuthSection
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleTraditionalSubmit}
            isLoading={totalLoading}
            buttonText="Sign In"
            showForgotPassword={config.enableRecovery}
            onForgotPassword={onForgotPassword}
          />
        </>
      )}
    </>
  );
}
