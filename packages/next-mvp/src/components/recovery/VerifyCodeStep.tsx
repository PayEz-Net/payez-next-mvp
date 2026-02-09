'use client';

import React, { useState, useEffect } from 'react';

interface Props {
  code: string;
  setCode: (code: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  loading: boolean;
  maskedDestination?: string;
}

export function VerifyCodeStep({
  code,
  setCode,
  onSubmit,
  onResend,
  loading,
  maskedDestination
}: Props) {
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleResend = () => {
    onResend();
    setResendCooldown(30);
  };

  return (
    <div className="bg-white border border-gray-300 rounded p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Enter Verification Code</h2>
      {maskedDestination && (
        <p className="text-sm text-gray-600 mb-6">
          Enter the 6-digit code sent to <span className="font-medium">{maskedDestination}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-900 mb-1">
            Verification Code
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            disabled={loading}
            placeholder="000000"
            maxLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-900 focus:outline-none disabled:opacity-50 disabled:bg-gray-50 text-center text-2xl tracking-widest font-mono"
          />
          <p className="text-xs text-gray-600 mt-1">Code expires in 5 minutes</p>
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full py-2 px-4 border border-gray-300 rounded text-gray-900 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify Code'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || resendCooldown > 0}
            className="text-sm text-gray-900 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          >
            {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
          </button>
        </div>
      </form>
    </div>
  );
}
