/**
 * =============================================================================
 * VIBE ADMIN STATS TAB
 * =============================================================================
 *
 * Generic dashboard stats overview tab.
 * Shows high-level metrics about users, sessions, and system health.
 *
 * =============================================================================
 */
import { ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
export interface StatCard {
    id: string;
    label: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon?: LucideIcon;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
}
export interface QuickAction {
    id: string;
    label: string;
    description: string;
    onClick: () => void;
    icon?: LucideIcon;
}
export interface RecentActivity {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    user?: string;
}
export interface SystemStatus {
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    latency?: number;
}
export interface StatsTabProps {
    isDark?: boolean;
    /** API endpoint to fetch stats (default: /api/admin/stats) */
    apiBasePath?: string;
    /** Custom stat cards to display */
    customStats?: StatCard[];
    /** Quick actions shown in the sidebar */
    quickActions?: QuickAction[];
    /** Additional content to render below stats */
    children?: ReactNode;
}
export declare function StatsTab({ isDark, apiBasePath, customStats, quickActions, children, }: StatsTabProps): import("react/jsx-runtime").JSX.Element;
export default StatsTab;
