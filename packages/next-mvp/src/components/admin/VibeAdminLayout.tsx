'use client';

import React, { ReactNode } from 'react';
import { authClient } from '../../client/better-auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useVibeAdmin } from './VibeAdminContext';
import {
  Shield,
  LayoutDashboard,
  Users,
  Activity,
  BarChart3,
  Database,
  Settings,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';

interface VibeAdminLayoutProps {
  children?: ReactNode;
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  headerContent?: ReactNode;
  isDarkMode?: boolean;
  adminRole?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const defaultNavItems: NavItem[] = [
  { id: 'stats', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'sessions', label: 'Sessions', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'data', label: 'Data Browser', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function VibeAdminLayout({
  children,
  activeTabId = 'stats',
  onTabChange,
  headerContent,
  isDarkMode: isDarkModeProp,
  adminRole = 'vibe_app_admin',
}: VibeAdminLayoutProps) {
  const { data: sessionData, isPending } = authClient.useSession();
  const session = sessionData;
  const status = isPending ? 'loading' : session ? 'authenticated' : 'unauthenticated';
  const router = useRouter();
  const adminConfig = useVibeAdmin();
  
  const isDark = isDarkModeProp ?? adminConfig.isDarkMode ?? false;
  const basePath = adminConfig.basePath || '/vibe-admin';
  
  const navItems = [...defaultNavItems];
  adminConfig.customTabs?.forEach((tab) => {
    navItems.push({
      id: tab.id,
      label: tab.label,
      icon: (tab.icon as LucideIcon) || LayoutDashboard,
    });
  });

  const userRoles = (session?.user as any)?.roles || [];
  const hasAdminRole = userRoles.includes(adminRole) || userRoles.includes('payez_admin');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/account-auth/login?callbackUrl=' + basePath);
      return;
    }
    if (status === 'authenticated' && !hasAdminRole) {
      router.push('/?error=unauthorized');
    }
  }, [status, hasAdminRole, router, basePath]);

  if (status === 'loading') {
    return (
      <div className={'min-h-screen flex items-center justify-center ' + (isDark ? 'bg-slate-950' : 'bg-gray-50')}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && !hasAdminRole) {
    return (
      <div className={'min-h-screen flex items-center justify-center ' + (isDark ? 'bg-slate-950' : 'bg-gray-50')}>
        <div className="text-center">
          <Shield className={'w-16 h-16 mx-auto mb-4 ' + (isDark ? 'text-red-400' : 'text-red-500')} />
          <h1 className={'text-2xl font-bold mb-2 ' + (isDark ? 'text-white' : 'text-gray-900')}>
            Access Denied
          </h1>
          <p className={'mb-6 ' + (isDark ? 'text-slate-400' : 'text-slate-600')}>
            You do not have permission to access the admin panel.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className={'min-h-screen ' + (isDark ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900')}>
      <header className={'sticky top-0 z-40 border-b ' + (isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200')}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {adminConfig.logoUrl && (
                <div className={'p-2 rounded-lg ' + (isDark ? 'bg-indigo-900/30' : 'bg-indigo-100')}>
                  <img src={adminConfig.logoUrl} alt={adminConfig.appName} className="w-6 h-6" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">Platform Admin</h1>
                <p className={'text-sm ' + (isDark ? 'text-slate-400' : 'text-slate-600')}>
                  {adminConfig.appName} - {adminConfig.collectionName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {headerContent}
              <Link
                href="/"
                className={'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ' + (isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-slate-600')}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <nav className={'flex items-center gap-1 mb-6 border-b ' + (isDark ? 'border-slate-800' : 'border-gray-200')}>
          {navItems.map((item) => {
            const isActive = activeTabId === item.id;
            const Icon = item.icon;
            const activeClass = isDark
              ? 'border-indigo-500 text-indigo-400'
              : 'border-indigo-600 text-indigo-700';
            const inactiveClass = isDark
              ? 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
              : 'border-transparent text-slate-600 hover:text-gray-900 hover:border-gray-300';

            return (
              <button
                key={item.id}
                onClick={() => onTabChange?.(item.id)}
                className={'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ' + (isActive ? activeClass : inactiveClass)}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <main className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export default VibeAdminLayout;
