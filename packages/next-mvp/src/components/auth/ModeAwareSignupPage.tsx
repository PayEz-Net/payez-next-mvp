'use client';

import React, { useState } from 'react';
import { useAuthConfig } from '../../client/AuthContext';
import { FederatedProvider } from '@/types/auth';
import { FederatedAuthSection } from './FederatedAuthSection';
import { TraditionalAuthSection } from './TraditionalAuthSection';

interface Props {
  onFederatedSignUp?: (provider: FederatedProvider) => void;
  onTraditionalSignUp?: (email: string, password: string, confirmPassword: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function ModeAwareSignupPage({
  onFederatedSignUp,
  onTraditionalSignUp,
  isLoading = false,
  error = null,
}: Props) {
  const config = useAuthConfig();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const handleFederatedClick = (provider: FederatedProvider) => {
    onFederatedSignUp?.(provider);
  };

  const handleTraditionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onTraditionalSignUp) return;

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLocalLoading(true);
    try {
      await onTraditionalSignUp(email, password, confirmPassword);
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
      {isTraditional && config.enableEmailSignup && (
        <form onSubmit={handleTraditionalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={totalLoading}
              required
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50"
              style={{
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                background: 'var(--bg-default)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={totalLoading}
              required
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50"
              style={{
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                background: 'var(--bg-default)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={totalLoading}
              required
              className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50"
              style={{
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                background: 'var(--bg-default)',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={totalLoading}
            className="w-full py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
            style={{
              border: '1px solid var(--border-default)',
              color: 'white',
              background: 'var(--color-primary, #10b981)',
            }}
          >
            {totalLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      )}

      {/* Hybrid Mode - Show both */}
      {isFederated === false && isTraditional === false && (
        <>
          <FederatedAuthSection
            providers={config.providers}
            onProviderClick={handleFederatedClick}
            isLoading={totalLoading}
          />

          {config.providers.length > 0 && config.enableEmailSignup && (
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
                  Or sign up with email
                </span>
              </div>
            </div>
          )}

          {config.enableEmailSignup && (
            <form onSubmit={handleTraditionalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={totalLoading}
                  required
                  className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50"
                  style={{
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-default)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={totalLoading}
                  required
                  className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50"
                  style={{
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-default)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={totalLoading}
                  required
                  className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50"
                  style={{
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-default)',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={totalLoading}
                className="w-full py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
                style={{
                  border: '1px solid var(--border-default)',
                  color: 'white',
                  background: 'var(--color-primary, #10b981)',
                }}
              >
                {totalLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
        </>
      )}
    </>
  );
}
