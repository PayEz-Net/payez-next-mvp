'use client';

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

import React, { useEffect, useState, useCallback } from 'react';
import { authClient } from '../../client/better-auth-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Icons - using basic SVGs to avoid lucide dependency issues
const IconRefresh = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconArrowLeft = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const IconShield = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconChart = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

export interface ClientAdminTab {
  id: string;
  label: string;
  icon: string;
  table?: string; // If set, will auto-fetch from this table
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

export function ClientSiteAdminPage({
  title,
  subtitle = 'Manage your app data',
  collectionName,
  tabs,
  allowedRoles = ['vibe_app_admin'],
  renderOverview,
  renderTabContent,
  isDark: isDarkProp,
  backUrl = '/',
  backLabel = 'Back to Site',
}: ClientSiteAdminProps) {
  const { data: sessionData, isPending } = authClient.useSession();
  const session = sessionData;
  const status = isPending ? 'loading' : session ? 'authenticated' : 'unauthenticated';
  const router = useRouter();

  // Theme detection
  const [isDarkState, setIsDarkState] = useState(false);
  useEffect(() => {
    if (isDarkProp === undefined) {
      const checkDark = () => {
        const isDark = document.documentElement.classList.contains('dark') ||
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkState(isDark);
      };
      checkDark();
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', checkDark);
      return () => mq.removeEventListener('change', checkDark);
    }
  }, [isDarkProp]);
  const isDark = isDarkProp ?? isDarkState;

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'overview');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TableStats[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const userRoles = (session?.user as any)?.roles || [];
  const hasAccess = allowedRoles.some(role => userRoles.includes(role));

  const themeClasses = {
    bg: isDark ? 'bg-slate-950' : 'bg-gray-50',
    cardBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200',
    headerBg: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200',
    text: isDark ? 'text-white' : 'text-gray-900',
    textMuted: isDark ? 'text-slate-400' : 'text-gray-600',
    tabBg: isDark ? 'bg-slate-800' : 'bg-gray-100',
    tabActive: 'bg-amber-600 text-white shadow-lg',
    tabInactive: isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-200',
  };

  // Fetch collection stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/vibe/collections/${collectionName}/tables`);
      if (res.ok) {
        const data = await res.json();
        const tables = data.tables || data || [];
        setStats(tables.map((tbl: any) => ({
          table: typeof tbl === 'string' ? tbl : tbl.name,
          count: typeof tbl === 'object' ? (tbl.document_count || tbl.count || 0) : 0,
          label: (typeof tbl === 'string' ? tbl : tbl.name)
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase()),
        })));
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [collectionName]);

  // Fetch table data
  const fetchTableData = useCallback(async (tableName: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vibe/data/${collectionName}/${tableName}?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setTableData(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch table:', err);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  // Handle tab change
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.table) {
      fetchTableData(tab.table);
    }
  }, [tabs, fetchTableData]);

  // Initial load
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/account-auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    } else if (status === 'authenticated' && !hasAccess) {
      router.push('/?error=unauthorized');
    } else if (status === 'authenticated' && hasAccess) {
      fetchStats();
    }
  }, [status, hasAccess, router, fetchStats]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.bg}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  // Access denied
  if (status === 'authenticated' && !hasAccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeClasses.bg}`}>
        <div className="text-center">
          <div className={isDark ? 'text-red-400' : 'text-red-500'}><IconShield /></div>
          <h1 className={`text-2xl font-bold mb-2 ${themeClasses.text}`}>Access Denied</h1>
          <p className={`mb-6 ${themeClasses.textMuted}`}>You need admin access for this area.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
            <IconArrowLeft /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  const currentTab = tabs.find(t => t.id === activeTab);

  return (
    <div className={`min-h-screen ${themeClasses.bg}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 border-b ${themeClasses.headerBg}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
                <IconChart className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${themeClasses.text}`}>{title}</h1>
                <p className={`text-sm ${themeClasses.textMuted}`}>{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => { fetchStats(); if (currentTab?.table) fetchTableData(currentTab.table); }}
                disabled={loading || statsLoading}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${themeClasses.textMuted} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'} ${(loading || statsLoading) ? 'opacity-50' : ''}`}
              >
                <span className={(loading || statsLoading) ? 'animate-spin' : ''}><IconRefresh /></span>
                Refresh
              </button>
              <Link href={backUrl} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${themeClasses.textMuted} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
                <IconArrowLeft /> {backLabel}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Tab Navigation */}
        <div className={`flex flex-wrap gap-1 p-1 rounded-xl ${themeClasses.tabBg}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? themeClasses.tabActive : themeClasses.tabInactive
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {renderTabContent ? (
          renderTabContent(currentTab!, tableData, loading)
        ) : activeTab === 'overview' || !currentTab?.table ? (
          // Default Overview
          <div className="space-y-6">
            <div>
              <h2 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>Data Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                  <Link
                    key={stat.table}
                    href={`/admin/data?collection=${collectionName}&table=${stat.table}`}
                    className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${themeClasses.cardBg}`}
                  >
                    <p className={`text-xs font-medium ${themeClasses.textMuted}`}>{stat.label}</p>
                    <p className={`text-2xl font-bold ${themeClasses.text}`}>
                      {statsLoading ? '...' : stat.count.toLocaleString()}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
            {renderOverview && renderOverview(stats)}
          </div>
        ) : (
          // Default Table View
          <div>
            <h2 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>
              {currentTab.label} ({tableData.length})
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
              </div>
            ) : (
              <div className={`rounded-lg border overflow-hidden ${themeClasses.cardBg}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className={isDark ? 'bg-slate-800' : 'bg-gray-50'}>
                      <tr>
                        <th className={`px-4 py-3 text-left font-medium ${themeClasses.textMuted}`}>ID</th>
                        <th className={`px-4 py-3 text-left font-medium ${themeClasses.textMuted}`}>User</th>
                        <th className={`px-4 py-3 text-left font-medium ${themeClasses.textMuted}`}>Data</th>
                        <th className={`px-4 py-3 text-left font-medium ${themeClasses.textMuted}`}>Created</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>
                      {tableData.length === 0 ? (
                        <tr>
                          <td colSpan={4} className={`px-4 py-8 text-center ${themeClasses.textMuted}`}>No data found</td>
                        </tr>
                      ) : tableData.map((row: any) => (
                        <tr key={row.document_id} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}>
                          <td className={`px-4 py-3 ${themeClasses.text}`}>{row.document_id}</td>
                          <td className={`px-4 py-3 ${themeClasses.text}`}>{row.user_id}</td>
                          <td className={`px-4 py-3 ${themeClasses.textMuted} max-w-xs truncate`}>
                            {JSON.stringify(row.data).substring(0, 50)}...
                          </td>
                          <td className={`px-4 py-3 ${themeClasses.textMuted}`}>
                            {new Date(row.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientSiteAdminPage;
