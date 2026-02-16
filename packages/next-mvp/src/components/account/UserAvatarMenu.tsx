'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Settings, Shield, LogOut } from 'lucide-react';

export interface UserAvatarMenuProps {
  /** Base path for navigation (e.g., '/dashboard', '/account') */
  basePath?: string;

  /** Show Profile menu item (default: true) */
  showProfile?: boolean;

  /** Show Settings menu item (default: true) */
  showSettings?: boolean;

  /** Show Security menu item (default: true) */
  showSecurity?: boolean;

  /** Custom menu items to add before the sign out divider */
  customItems?: Array<{
    label: string;
    icon?: React.ReactNode;
    href?: string;
    onClick?: () => void;
  }>;

  /** Override default signOut behavior */
  onSignOut?: () => void;
}

export function UserAvatarMenu({
  basePath = '',
  showProfile = true,
  showSettings = true,
  showSecurity = true,
  customItems,
  onSignOut,
}: UserAvatarMenuProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
    );
  }

  // Not authenticated
  if (!session?.user) {
    return null;
  }

  // Derive display initial from name or email — ignore anon/internal IDs
  const userName = (session.user as any)?.name;
  const userEmail = session.user.email;
  const displaySource = userName || userEmail;
  const userInitial = displaySource?.charAt(0).toUpperCase() || '?';

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const handleSignOut = async () => {
    setIsOpen(false);
    if (onSignOut) {
      onSignOut();
    } else {
      // Use NEXT_PUBLIC env var or default to root
      const logoutUrl = process.env.NEXT_PUBLIC_LOGOUT_REDIRECT_URL || '/';
      await signOut({ callbackUrl: logoutUrl });
    }
  };

  const handleItemClick = (item: NonNullable<typeof customItems>[number]) => {
    setIsOpen(false);
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Avatar trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-10 w-10 rounded-full bg-[#349AD5] text-white font-semibold text-lg hover:bg-[#2980b9] transition-colors focus:outline-none focus:ring-2 focus:ring-[#349AD5] focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {userInitial}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-md shadow-lg z-50
            bg-white dark:bg-slate-900
            border border-gray-200 dark:border-slate-700"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User identity label */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            {userName && (
              <p className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate">
                {userName}
              </p>
            )}
            {userEmail && (
              <p className="text-sm text-gray-500 dark:text-slate-400 truncate">
                {userEmail}
              </p>
            )}
            {!userName && !userEmail && (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Signed in
              </p>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            {showProfile && (
              <MenuItem
                icon={<User className="h-4 w-4" />}
                label="Profile"
                onClick={() => handleNavigation(`${basePath}/profile`)}
              />
            )}

            {showSettings && (
              <MenuItem
                icon={<Settings className="h-4 w-4" />}
                label="Settings"
                onClick={() => handleNavigation(`${basePath}/settings`)}
              />
            )}

            {showSecurity && (
              <MenuItem
                icon={<Shield className="h-4 w-4" />}
                label="Security"
                onClick={() => handleNavigation(`${basePath}/security`)}
              />
            )}

            {/* Custom items */}
            {customItems?.map((item, index) => (
              <MenuItem
                key={index}
                icon={item.icon}
                label={item.label}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>

          {/* Sign out section */}
          <div className="border-t border-gray-200 dark:border-slate-700 py-1">
            <MenuItem
              icon={<LogOut className="h-4 w-4" />}
              label="Sign Out"
              onClick={handleSignOut}
              variant="danger"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

function MenuItem({ icon, label, onClick, variant = 'default' }: MenuItemProps) {
  const baseClasses = "flex items-center w-full px-4 py-2 text-sm cursor-pointer transition-colors";
  const variantClasses = variant === 'danger'
    ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800"
    : "text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses}`}
      role="menuitem"
    >
      {icon && <span className="mr-3">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
