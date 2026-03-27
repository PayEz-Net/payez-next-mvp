import React, { ReactNode } from 'react';
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
export declare function useVibeAdmin(): VibeAdminContextValue;
interface VibeAdminProviderProps {
    config: VibeAdminConfig;
    children: ReactNode;
}
export declare function VibeAdminProvider({ config, children }: VibeAdminProviderProps): import("react/jsx-runtime").JSX.Element;
export default VibeAdminProvider;
