'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// Extended session type for MVP
interface ExtendedSession {
  user?: {
    email?: string;
    roles?: string[];
  };
  accessToken?: string;
  refreshToken?: string;
}

// Shared dark mode hook to avoid duplication
function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    checkDarkMode();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  return isDarkMode;
}

interface FeatureCardProps {
  title: string;
  description: string;
  status: 'available' | 'coming-soon';
  link?: string;
  children?: React.ReactNode;
}

function FeatureCard({ title, description, status, link, children }: FeatureCardProps) {
  const isDarkMode = useDarkMode();

  const content = (
    <div className={`p-6 rounded-lg h-full ${
      isDarkMode
        ? 'bg-slate-900 border border-slate-700'
        : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        {status === 'coming-soon' && (
          <span className={`text-xs px-2 py-1 rounded-full ${
            isDarkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700'
          }`}>
            Coming Soon
          </span>
        )}
      </div>
      <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {description}
      </p>
      {children}
    </div>
  );

  if (link && status === 'available') {
    return (
      <Link href={link} className="block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

interface DemoButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
  onClick?: () => void;
}

function DemoButton({ variant, children, onClick }: DemoButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

/**
 * Feature Showcase Page
 *
 * Demonstrates MVP capabilities with interactive examples.
 *
 * Usage in consuming app:
 * ```typescript
 * // app/showcase/page.tsx
 * export { ShowcasePage as default } from '@payez/next-mvp/pages/showcase';
 * ```
 */
export function ShowcasePage() {
  const { data: session, status } = useSession();
  const isDarkMode = useDarkMode();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Type the extended session properly
  const extSession = session as ExtendedSession | null;

  // Toast with proper cleanup to prevent race conditions
  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    setToastVisible(true);
    toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 3000);
  }, []);

  // Cleanup toast timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Modal focus trap and keyboard handling
  useEffect(() => {
    if (!modalVisible) return;

    // Store previous focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the modal
    modalRef.current?.focus();

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalVisible(false);
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when modal closes
      previousFocusRef.current?.focus();
    };
  }, [modalVisible]);

  // Get status text for screen readers
  const getStatusText = () => {
    if (status === 'authenticated') return 'Authenticated';
    if (status === 'loading') return 'Loading';
    return 'Not authenticated';
  };

  return (
    <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">MVP Feature Showcase</h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Interactive demonstrations of @payez/next-mvp capabilities
          </p>
        </div>

        {/* Session Status Bar */}
        <div className={`mb-8 p-4 rounded-lg flex items-center justify-between ${
          isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border'
        }`}>
          <div className="flex items-center gap-4">
            <div
              className={`w-3 h-3 rounded-full ${
                status === 'authenticated' ? 'bg-green-500' :
                status === 'loading' ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              aria-hidden="true"
            />
            <span className="sr-only">{getStatusText()}</span>
            <span className="font-medium">
              {status === 'authenticated' ? `Logged in as ${session?.user?.email}` :
               status === 'loading' ? 'Loading session...' : 'Not authenticated'}
            </span>
          </div>
          {status === 'unauthenticated' && (
            <Link
              href="/account-auth/login"
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Sign in to test authenticated features
            </Link>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

          {/* Authentication */}
          <FeatureCard
            title="Authentication"
            description="Complete auth flow with traditional login, OAuth providers, and password recovery."
            status="available"
            link="/account-auth/login"
          >
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                Email/Password
              </span>
              <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                OAuth
              </span>
              <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                2FA
              </span>
            </div>
          </FeatureCard>

          {/* Role-Based Access */}
          <FeatureCard
            title="Role-Based Access Control"
            description="Fine-grained permissions with roles and access control configuration."
            status="available"
          >
            <div className={`text-xs p-3 rounded font-mono ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
              {extSession?.user?.roles ?
                `Roles: ${extSession.user.roles.join(', ')}` :
                'Sign in to view roles'}
            </div>
          </FeatureCard>

          {/* Toast Notifications */}
          <FeatureCard
            title="Toast Notifications"
            description="Non-blocking notifications for user feedback and status updates."
            status="available"
          >
            <div className="flex gap-2">
              <DemoButton variant="primary" onClick={() => showToast('Success! Action completed.')}>
                Success
              </DemoButton>
              <DemoButton variant="danger" onClick={() => showToast('Error! Something went wrong.')}>
                Error
              </DemoButton>
            </div>
          </FeatureCard>

          {/* Modal Dialogs */}
          <FeatureCard
            title="Modal Dialogs"
            description="Accessible modal dialogs for confirmations and focused interactions."
            status="available"
          >
            <DemoButton variant="secondary" onClick={() => setModalVisible(true)}>
              Open Modal
            </DemoButton>
          </FeatureCard>

          {/* Form Validation */}
          <FeatureCard
            title="Form Validation"
            description="Client and server-side validation with real-time feedback and error handling."
            status="available"
            link="/account-auth/recovery"
          >
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                Real-time
              </span>
              <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                Password Rules
              </span>
            </div>
          </FeatureCard>

          {/* Session Management */}
          <FeatureCard
            title="Session Management"
            description="JWT-based sessions with automatic refresh and secure token handling."
            status="available"
            link="/test-env"
          >
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Access Token:</span>
                <span className={extSession?.accessToken ? 'text-green-500' : 'text-red-500'}>
                  {extSession?.accessToken ? 'Valid' : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Refresh Token:</span>
                <span className={extSession?.refreshToken ? 'text-green-500' : 'text-red-500'}>
                  {extSession?.refreshToken ? 'Valid' : 'None'}
                </span>
              </div>
            </div>
          </FeatureCard>

          {/* User Profile */}
          <FeatureCard
            title="User Profile"
            description="Profile management with avatar, display name, and account settings."
            status="available"
            link="/profile"
          >
            <div className={`flex items-center gap-3 p-2 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {session?.user?.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="text-sm truncate">
                {session?.user?.email || 'Not signed in'}
              </div>
            </div>
          </FeatureCard>

          {/* Security Settings */}
          <FeatureCard
            title="Security Settings"
            description="Password management, 2FA configuration, and active session control."
            status="available"
            link="/security"
          >
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                Change Password
              </span>
              <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                2FA Setup
              </span>
            </div>
          </FeatureCard>

          {/* Theme Support */}
          <FeatureCard
            title="Theme Support"
            description="Light and dark mode with system preference detection and manual toggle."
            status="available"
          >
            <div className="flex items-center gap-3">
              <div className={`px-3 py-2 rounded text-sm ${
                isDarkMode ? 'bg-slate-800' : 'bg-gray-100'
              }`}>
                Current: {isDarkMode ? 'Dark' : 'Light'}
              </div>
            </div>
          </FeatureCard>

          {/* Admin Panel */}
          <FeatureCard
            title="Admin Panel"
            description="Built-in admin interface for user management, roles, and system configuration."
            status="coming-soon"
          >
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                User Management
              </span>
              <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                Schema Browser
              </span>
            </div>
          </FeatureCard>

          {/* Data Tables */}
          <FeatureCard
            title="Data Tables"
            description="Sortable, filterable, paginated tables with column customization."
            status="coming-soon"
          >
            <div className={`text-xs p-3 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
              Sort, filter, paginate, export
            </div>
          </FeatureCard>

          {/* API Client */}
          <FeatureCard
            title="API Client"
            description="Type-safe API client with automatic auth headers and error handling."
            status="available"
          >
            <div className={`text-xs p-3 rounded font-mono ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
              fetchWithSession(url, options)
            </div>
          </FeatureCard>

        </div>

        {/* Quick Links */}
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white border'}`}>
          <h2 className="font-semibold text-lg mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/test-env"
              className={`px-4 py-2 rounded-lg text-sm ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Debug Tools
            </Link>
            <Link
              href="/test-env/jwt-inspect"
              className={`px-4 py-2 rounded-lg text-sm ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              JWT Inspector
            </Link>
            <Link
              href="/account-auth/login"
              className={`px-4 py-2 rounded-lg text-sm ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Login Page
            </Link>
            <Link
              href="/profile"
              className={`px-4 py-2 rounded-lg text-sm ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Profile
            </Link>
            <Link
              href="/security"
              className={`px-4 py-2 rounded-lg text-sm ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Security Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Toast - with proper ARIA for screen readers */}
      {toastVisible && (
        <div
          role="alert"
          aria-live="polite"
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transition-opacity ${
            isDarkMode ? 'bg-slate-800 text-white' : 'bg-gray-900 text-white'
          }`}
        >
          {toastMessage}
        </div>
      )}

      {/* Modal - fully accessible with focus trap and keyboard support */}
      {modalVisible && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalVisible(false);
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabIndex={-1}
            className={`max-w-md w-full p-6 rounded-lg ${
              isDarkMode ? 'bg-slate-900' : 'bg-white'
            }`}
          >
            <h3 id="modal-title" className="text-xl font-semibold mb-4">Example Modal</h3>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              This is a demonstration of an accessible modal dialog. Press Escape to close,
              or use Tab to navigate between buttons.
            </p>
            <div className="flex justify-end gap-3">
              <DemoButton variant="secondary" onClick={() => setModalVisible(false)}>
                Cancel
              </DemoButton>
              <DemoButton variant="primary" onClick={() => {
                setModalVisible(false);
                showToast('Action confirmed!');
              }}>
                Confirm
              </DemoButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShowcasePage;
