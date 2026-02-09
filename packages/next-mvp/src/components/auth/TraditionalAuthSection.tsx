'use client';

import React from 'react';

interface Props {
  email: string;
  password: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  buttonText?: string;
  showForgotPassword?: boolean;
  onForgotPassword?: () => void;
}

export function TraditionalAuthSection({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  isLoading,
  buttonText = 'Sign In',
  showForgotPassword = true,
  onForgotPassword,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="you@example.com"
          disabled={isLoading}
          required
          className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50"
          style={{
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            background: 'var(--bg-default)',
          }}
        />
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Password
          </label>
          {showForgotPassword && onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs hover:underline"
              style={{ color: 'var(--text-primary)' }}
            >
              Forgot?
            </button>
          )}
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          required
          className="w-full px-4 py-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 disabled:opacity-50"
          style={{
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            background: 'var(--bg-default)',
          }}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-lg font-semibold focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
        style={{
          border: '1px solid var(--border-default)',
          color: 'white',
          background: 'var(--color-primary, #10b981)',
        }}
      >
        {isLoading ? 'Signing in...' : buttonText}
      </button>
    </form>
  );
}
