'use client';

import React from 'react';

export interface FooterProps {
  /** Company or product name (default: 'PayEz') */
  companyName?: string;
  /** Start year for copyright range (shows "2024-2025" format if provided) */
  startYear?: number;
  /** Additional links to display */
  links?: Array<{ label: string; href: string }>;
  /** Additional CSS classes */
  className?: string;
  /** Variant style */
  variant?: 'minimal' | 'standard';
}

/**
 * A themeable footer component with dynamic copyright year.
 *
 * @example
 * ```tsx
 * // Minimal footer
 * <Footer />
 *
 * // With company name and start year
 * <Footer companyName="Acme Inc" startYear={2020} />
 *
 * // With links
 * <Footer
 *   links={[
 *     { label: 'Privacy', href: '/privacy' },
 *     { label: 'Terms', href: '/terms' }
 *   ]}
 * />
 * ```
 */
export function Footer({
  companyName = 'PayEz',
  startYear,
  links = [],
  className = '',
  variant = 'minimal'
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const yearDisplay = startYear && startYear < currentYear
    ? `${startYear}-${currentYear}`
    : `${currentYear}`;

  const baseStyles = 'w-full py-4 text-sm';

  const variantStyles = {
    minimal: 'text-center text-gray-500 dark:text-gray-400',
    standard: 'border-t border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
  };

  if (variant === 'minimal') {
    return (
      <footer className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
        <p>
          &copy; {yearDisplay} {companyName}. All rights reserved.
        </p>
      </footer>
    );
  }

  return (
    <footer className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>
            &copy; {yearDisplay} {companyName}. All rights reserved.
          </p>
          {links.length > 0 && (
            <nav className="flex gap-4" aria-label="Footer links">
              {links.map((link, index) => (
                <a
                  key={`${index}-${link.label}`}
                  href={link.href}
                  className="hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
