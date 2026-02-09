'use client';

import React from 'react';

interface Props {
  onGoToLogin: () => void;
}

export function CompleteStep({ onGoToLogin }: Props) {
  return (
    <div className="bg-white border border-gray-300 rounded p-8 text-center">
      <div className="bg-green-50 border border-green-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Password Reset Complete</h2>

      <p className="text-gray-600 mb-2">
        Your password has been successfully reset and your account lockout has been cleared.
      </p>

      <p className="text-gray-600 mb-6">
        You can now log in with your new password.
      </p>

      <button
        onClick={onGoToLogin}
        className="w-full py-2 px-4 border border-gray-300 rounded text-gray-900 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900"
      >
        Go to Login
      </button>
    </div>
  );
}
