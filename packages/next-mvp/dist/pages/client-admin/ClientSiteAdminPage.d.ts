/**
 * =============================================================================
 * CLIENT SITE ADMIN - Your App's Admin Dashboard
 * =============================================================================
 *
 * This is the foundation for YOUR app-specific admin area.
 * The MVP admin (/admin) handles membership - this handles YOUR data.
 *
 * SEPARATION OF CONCERNS:
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  /admin (MVP Admin)              │  /admin/[your-area] (This)      │
 * │  ─────────────────               │  ────────────────────────       │
 * │  • User authentication           │  • Your app's collections       │
 * │  • Sessions management           │  • Your app's features          │
 * │  • Role assignments              │  • Content moderation           │
 * │  • Tier/subscription mgmt        │  • App-specific analytics       │
 * │  • Site-wide analytics           │  • Custom admin tools           │
 * │  • vibe_app collection           │  • your_app collection          │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * USAGE:
 * ```tsx
 * // app/admin/your-area/page.tsx
 * import { ClientSiteAdminPage } from '@payez/next-mvp/pages/client-admin';
 *
 * export default function YourAdminPage() {
 *   return (
 *     <ClientSiteAdminPage
 *       title="Your Admin"
 *       subtitle="Manage your app data"
 *       collectionName="your_collection"
 *       tabs={[
 *         { id: 'overview', label: 'Overview', icon: '📊' },
 *         { id: 'items', label: 'Items', icon: '📦', table: 'items' },
 *       ]}
 *       renderTabContent={(tab, data) => <YourCustomContent />}
 *     />
 *   );
 * }
 * ```
 *
 * =============================================================================
 */
import React from 'react';
export interface ClientAdminTab {
    id: string;
    label: string;
    icon: string;
    table?: string;
}
export interface TableStats {
    table: string;
    count: number;
    label: string;
}
export interface ClientSiteAdminProps {
    /** Admin area title */
    title: string;
    /** Subtitle shown under title */
    subtitle?: string;
    /** Vibe collection name for this admin area */
    collectionName: string;
    /** Tabs to display */
    tabs: ClientAdminTab[];
    /** Roles that can access (defaults to vibe_app_admin) */
    allowedRoles?: string[];
    /** Custom overview content renderer */
    renderOverview?: (stats: TableStats[]) => React.ReactNode;
    /** Custom tab content renderer */
    renderTabContent?: (tab: ClientAdminTab, data: any[], loading: boolean) => React.ReactNode;
    /** Theme detection function (optional) */
    isDark?: boolean;
    /** Back link URL (defaults to /) */
    backUrl?: string;
    /** Back link label (defaults to "Back to Site") */
    backLabel?: string;
}
export declare function ClientSiteAdminPage({ title, subtitle, collectionName, tabs, allowedRoles, renderOverview, renderTabContent, isDark: isDarkProp, backUrl, backLabel, }: ClientSiteAdminProps): import("react/jsx-runtime").JSX.Element | null;
export default ClientSiteAdminPage;
