'use client';

import React, { useState } from 'react';

interface Props {
  onSubmit: (password: string, confirmPassword: string) => void;
  loading: boolean;
}

export function SetPasswordStep({ onSubmit, loading }: Props) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = password === confirmPassword && password !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordsMatch) {
      onSubmit(password, confirmPassword);
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Set New Password</h2>
      <p className="text-sm text-gray-600 mb-6">
        Choose a strong password for your account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:outline-none disabled:opacity-50 disabled:bg-gray-50 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:outline-none disabled:opacity-50 disabled:bg-gray-50 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {!passwordsMatch && confirmPassword && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-red-700 text-sm">Passwords do not match</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!passwordsMatch || loading}
          className="w-full py-2 px-4 border border-gray-300 rounded text-gray-900 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}
