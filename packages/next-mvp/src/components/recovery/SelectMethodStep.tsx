'use client';

import React from 'react';
import { RecoverySession } from '../../types/recovery';

interface Props {
  session: RecoverySession;
  onSelectMethod: (method: 'email' | 'sms' | 'authenticator') => void;
  loading: boolean;
}

export function SelectMethodStep({ session, onSelectMethod, loading }: Props) {
  return (
    <div className="bg-white border border-gray-300 rounded p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Verification Method</h2>
      <p className="text-sm text-gray-600 mb-6">
        Choose how you would like to receive your verification code.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-6 text-sm">
        {session.maskedEmail && (
          <div className="mb-1">
            <span className="text-gray-600">Email: </span>
            <span className="text-gray-900 font-medium">{session.maskedEmail}</span>
          </div>
        )}
        {session.maskedPhone && (
          <div className="mb-1">
            <span className="text-gray-600">Phone: </span>
            <span className="text-gray-900 font-medium">{session.maskedPhone}</span>
          </div>
        )}
        {session.hasAuthenticator && (
          <div className="text-gray-600">
            * This account has 2FA enabled
          </div>
        )}
      </div>

      <div className="space-y-2">
        {session.availableMethods.includes('email') && (
          <button
            onClick={() => onSelectMethod('email')}
            disabled={loading}
            className="w-full py-2 px-4 border border-gray-300 rounded text-gray-900 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Code via Email
          </button>
        )}

        {session.availableMethods.includes('sms') && session.maskedPhone && (
          <button
            onClick={() => onSelectMethod('sms')}
            disabled={loading}
            className="w-full py-2 px-4 border border-gray-300 rounded text-gray-900 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Code via SMS
          </button>
        )}

        {session.availableMethods.includes('authenticator') && session.hasAuthenticator && (
          <button
            onClick={() => onSelectMethod('authenticator')}
            disabled={loading}
            className="w-full py-2 px-4 border border-gray-300 rounded text-gray-900 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use Authenticator App
          </button>
        )}
      </div>
    </div>
  );
}
