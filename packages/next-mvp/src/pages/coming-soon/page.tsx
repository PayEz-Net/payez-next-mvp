'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useBranding, useColors } from '../../theme/useTheme';

interface ComingSoonPageProps {
  homeUrl?: string;
  /** Override logo — pass a React node (e.g. inline SVG or themed <img>) */
  logo?: React.ReactNode;
}

function ComingSoonContent({ homeUrl = '/', logo }: ComingSoonPageProps) {
  const branding = useBranding();
  const colors = useColors();

  const fallbackLogo = branding.logo?.dark || branding.logo?.light;
  const logoAlt = branding.logo?.alt || branding.appName || 'App Logo';
  const logoHeight = branding.logo?.height || 48;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="max-w-md w-full text-center rounded-xl p-8 shadow-lg border"
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          borderColor: 'var(--border-default, #e5e7eb)',
        }}
      >
        <div className="mb-6 flex justify-center">
          {logo || (fallbackLogo && (
            <img
              src={fallbackLogo}
              alt={logoAlt}
              style={{ height: logoHeight }}
            />
          ))}
        </div>

        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--text-primary, #111827)' }}
        >
          {branding.appName || 'Our App'}
        </h1>

        <span
          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full lowercase tracking-wide border mb-4"
          style={{
            borderColor: colors.primary || '#3b82f6',
            color: colors.primary || '#3b82f6',
          }}
        >
          coming soon
        </span>

        <p
          className="mb-6"
          style={{ color: 'var(--text-secondary, #6b7280)' }}
        >
          We&apos;re currently in beta and access is limited to approved users.
          Check back soon &mdash; we&apos;re working hard to open the doors!
        </p>

        <Link
          href={homeUrl}
          className="inline-block w-full font-medium py-3 px-4 rounded-lg transition-colors text-white"
          style={{ backgroundColor: colors.primary || '#3b82f6' }}
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}

export default function ComingSoonPage(props: ComingSoonPageProps) {
  return (
    <Suspense>
      <ComingSoonContent {...props} />
    </Suspense>
  );
}
