'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface VibeAdminConfig {
  /** Collection name for this tenant (e.g., "ideal_resume", "idealvibe_app") */
  collectionName: string;
  /** Display name for the app (e.g., "IdealResume", "IdealVibe") */
  appName: string;
  /** Optional logo URL */
  logoUrl?: string;
  /** Base path for admin routes (default: /vibe-admin) */
  basePath?: string;
  /** Custom tabs to add to the admin panel */
  customTabs?: AdminTab[];
  /** Theme mode override */
  isDarkMode?: boolean;
}

export interface AdminTab {
  id: string;
  label: string;
  icon?: React.ElementType;
  component: React.ComponentType;
}

export interface VibeAdminContextValue extends VibeAdminConfig {
  /** All tabs including defaults and custom */
  allTabs: AdminTab[];
}

// -----------------------------------------------------------------------------
// CONTEXT
// -----------------------------------------------------------------------------

const VibeAdminContext = createContext<VibeAdminContextValue | null>(null);

// -----------------------------------------------------------------------------
// HOOK
// -----------------------------------------------------------------------------

export function useVibeAdmin(): VibeAdminContextValue {
  const context = useContext(VibeAdminContext);
  if (!context) {
    throw new Error('useVibeAdmin must be used within a VibeAdminProvider');
  }
  return context;
}

// -----------------------------------------------------------------------------
// PROVIDER
// -----------------------------------------------------------------------------

interface VibeAdminProviderProps {
  config: VibeAdminConfig;
  children: ReactNode;
}

export function VibeAdminProvider({ config, children }: VibeAdminProviderProps) {
  // Default tabs - will be populated with actual components
  const defaultTabs: AdminTab[] = [
    { id: 'stats', label: 'Stats', component: () => null },
    { id: 'users', label: 'Users', component: () => null },
    { id: 'sessions', label: 'Sessions', component: () => null },
    { id: 'analytics', label: 'Analytics', component: () => null },
  ];

  const allTabs = [...defaultTabs, ...(config.customTabs || [])];

  const value: VibeAdminContextValue = {
    ...config,
    basePath: config.basePath || '/vibe-admin',
    allTabs,
  };

  return (
    <VibeAdminContext.Provider value={value}>
      {children}
    </VibeAdminContext.Provider>
  );
}

export default VibeAdminProvider;
