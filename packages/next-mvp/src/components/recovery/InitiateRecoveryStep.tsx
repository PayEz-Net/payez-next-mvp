'use client';

import React from 'react';

interface Props {
  email: string;
  setEmail: (email: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function InitiateRecoveryStep({ email, setEmail, onSubmit, loading }: Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
      <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Account Recovery</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Enter your email address to begin the account recovery process.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            placeholder="Enter your email address"
            className="w-full px-3 py-2 rounded focus:ring-2 focus:outline-none disabled:opacity-50"
            style={{
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              background: 'var(--bg-default)'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full py-2 px-4 rounded font-medium focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            background: 'var(--bg-default)'
          }}
        >
          {loading ? 'Processing...' : 'Continue'}
        </button>

        <div className="text-center">
          <a href="/account-auth/login" className="text-sm hover:underline font-medium" style={{ color: 'var(--text-primary)' }}>
            Back to Login
          </a>
        </div>
      </form>
    </div>
  );
}
