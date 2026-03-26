'use client';

import { useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export interface NavSection {
  title?: string;
  items: Array<{
    label: string;
    icon?: React.ReactNode;
    href?: string;
    onClick?: () => void;
  }>;
}

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  /** Extra sections like Admin, rendered after nav items with optional title */
  customSections?: NavSection[];
  /** Base path for account link (default: '/account') */
  basePath?: string;
  /** Custom sign-in handler (default: next-auth signIn) */
  onSignIn?: () => void;
  /** Callback URL after sign in (default: '/dashboard') */
  signInCallbackUrl?: string;
  /** Custom unauthenticated actions (replaces default Login + Start Free buttons) */
  unauthActions?: React.ReactNode;
  /** Custom authenticated footer (replaces default "Account Settings" link) */
  authFooter?: React.ReactNode;
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  navItems,
  customSections,
  basePath = '/account',
  onSignIn,
  signInCallbackUrl = '/dashboard',
  unauthActions,
  authFooter,
}: MobileNavDrawerProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAuthenticated = !!session?.user;

  const isActiveRoute = useCallback(
    (href: string) => pathname?.startsWith(href) ?? false,
    [pathname],
  );

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleSignIn = () => {
    onClose();
    if (onSignIn) {
      onSignIn();
    } else {
      signIn(undefined, { callbackUrl: signInCallbackUrl });
    }
  };

  const handleSectionItemClick = (item: NavSection['items'][number]) => {
    onClose();
    if (item.onClick) {
      item.onClick();
    }
  };

  // Derive display initial from name or email
  const userName = (session?.user as any)?.name;
  const userEmail = session?.user?.email;
  const displaySource = userName || userEmail;
  const userInitial = displaySource?.charAt(0).toUpperCase() || '?';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-expanded={isOpen}
        className={`
          fixed top-0 right-0 bottom-0 w-80 max-w-[85vw]
          bg-white dark:bg-slate-900
          shadow-[-8px_0_32px_rgba(0,0,0,0.15)]
          dark:shadow-[-8px_0_32px_rgba(0,0,0,0.4)]
          z-50 lg:hidden
          overflow-y-auto
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Menu
          </span>
          <button
            onClick={onClose}
            className="
              p-2 rounded-xl
              text-gray-400 hover:text-gray-900
              dark:hover:text-white
              hover:bg-gray-100 dark:hover:bg-white/10
              transition-colors
            "
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info (if authenticated) */}
        {isAuthenticated && session?.user && (
          <div className="p-4 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt=""
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                  {userInitial}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {userName && (
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {userName}
                  </p>
                )}
                {userEmail && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                    {userEmail}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center gap-3 px-4 py-3.5 rounded-xl
                transition-colors duration-200
                ${isActiveRoute(item.href)
                  ? 'bg-blue-500/10 text-blue-500'
                  : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                }
              `}
            >
              {item.icon && <span className="text-xl">{item.icon}</span>}
              <span className="font-medium">{item.label}</span>
              {isActiveRoute(item.href) && (
                <span className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
              )}
            </Link>
          ))}
        </div>

        {/* Custom Sections */}
        {customSections?.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            className="p-2 border-t border-gray-200 dark:border-white/10"
          >
            {section.title && (
              <p className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            {section.items.map((item, itemIndex) =>
              item.href ? (
                <Link
                  key={itemIndex}
                  href={item.href}
                  onClick={onClose}
                  className="
                    flex items-center gap-3 px-4 py-3 rounded-xl
                    text-gray-900 dark:text-white
                    hover:bg-gray-100 dark:hover:bg-white/10
                    transition-colors
                  "
                >
                  {item.icon && <span className="text-xl">{item.icon}</span>}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ) : (
                <button
                  key={itemIndex}
                  onClick={() => handleSectionItemClick(item)}
                  className="
                    flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left
                    text-gray-900 dark:text-white
                    hover:bg-gray-100 dark:hover:bg-white/10
                    transition-colors
                  "
                >
                  {item.icon && <span className="text-xl">{item.icon}</span>}
                  <span className="font-medium">{item.label}</span>
                </button>
              ),
            )}
          </div>
        ))}

        {/* Auth Actions */}
        <div className="p-4 mt-auto border-t border-gray-200 dark:border-white/10">
          {!isAuthenticated ? (
            unauthActions ?? (
              <div className="space-y-3">
                <button
                  onClick={handleSignIn}
                  className="
                    w-full px-4 py-3 rounded-xl
                    text-blue-500 font-semibold
                    border border-blue-500/30
                    hover:bg-blue-500/10
                    transition-colors
                  "
                >
                  Login
                </button>
              </div>
            )
          ) : (
            authFooter ?? (
              <Link
                href={basePath}
                onClick={onClose}
                className="
                  flex items-center justify-center gap-2
                  w-full px-4 py-3 rounded-xl
                  text-gray-500 dark:text-slate-400 font-medium
                  hover:bg-gray-100 dark:hover:bg-white/10
                  transition-colors
                "
              >
                Account Settings
              </Link>
            )
          )}
        </div>
      </div>
    </>
  );
}
