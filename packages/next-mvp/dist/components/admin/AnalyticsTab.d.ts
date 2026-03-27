/**
 * =============================================================================
 * VIBE ADMIN ANALYTICS TAB
 * =============================================================================
 *
 * Generic dashboard tab showing login statistics and analytics.
 * Can be extended by consumer apps with custom components.
 *
 * =============================================================================
 */
import { ReactNode } from 'react';
export interface AnalyticsTabProps {
    isDark?: boolean;
    /** Base API path for analytics (default: /api/admin/analytics) */
    apiBasePath?: string;
    /** Optional custom component to render in the geo section (e.g., WorldMap) */
    geoMapComponent?: ReactNode;
    /** Show business metrics section (default: true) */
    showBusinessMetrics?: boolean;
}
export declare function AnalyticsTab({ isDark, apiBasePath, geoMapComponent, showBusinessMetrics, }: AnalyticsTabProps): import("react/jsx-runtime").JSX.Element | null;
export default AnalyticsTab;
