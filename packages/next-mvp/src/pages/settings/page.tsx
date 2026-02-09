/**
 * Basic Settings Page
 *
 * A simpler settings page that can be customized.
 * For the full-featured version, use EnhancedSettingsPage.
 */

'use client';

import React from 'react';
import { useLayout, useColors } from '../../theme/useTheme';

export default function SettingsPage() {
  const layout = useLayout();
  const colors = useColors();

  // Determine dark mode from theme colors
  const isDark = colors?.background?.includes('slate-9') ||
                 colors?.background?.includes('gray-9') ||
                 colors?.card?.includes('slate-8');

  const bgColor = isDark ? 'bg-slate-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-slate-800' : 'bg-white';
  const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <div className={`max-w-2xl mx-auto ${layout?.padding || 'p-6'}`}>
        <h1 className={`text-3xl font-bold ${textPrimary} mb-6`}>Settings</h1>

        <div className={`${cardBg} rounded-lg shadow-lg border ${borderColor} p-6`}>
          <p className={textMuted}>
            Settings page content goes here. Use EnhancedSettingsPage for a full-featured implementation.
          </p>
        </div>

        <div className="mt-6 text-center">
          <a href="/account/profile" className={`text-sm hover:underline ${textMuted}`}>
            Back to Profile
          </a>
        </div>
      </div>
    </div>
  );
}
