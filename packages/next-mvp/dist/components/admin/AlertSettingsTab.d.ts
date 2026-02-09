/**
 * =============================================================================
 * VIBE ADMIN ALERT SETTINGS TAB
 * =============================================================================
 *
 * Admin UI for managing email alert preferences, recipients, and thresholds.
 * Supports Smart/Immediate/Hourly/Daily delivery modes.
 *
 * =============================================================================
 */
export type DeliveryMode = 'smart' | 'immediate' | 'hourly' | 'daily';
export interface AlertConfig {
    enabled: boolean;
    threshold?: number;
    threshold_pct?: number;
}
export interface AlertsConfig {
    error_spike: AlertConfig;
    storage_warning: AlertConfig;
    storage_critical: AlertConfig;
    agent_expiring: AlertConfig;
    agent_expired: AlertConfig;
}
export interface RateLimit {
    max_per_hour: number;
}
export interface AlertSettings {
    recipients: string[];
    digest_mode: DeliveryMode;
    alerts: AlertsConfig;
    rate_limit: RateLimit;
}
export interface AlertHistoryItem {
    id: number;
    type: string;
    sent_at: string;
    subject: string;
    recipients: string[];
}
export interface AlertSettingsTabProps {
    isDark?: boolean;
    /** API base path (default: /api/admin/alerts) */
    apiBasePath?: string;
    /** Callback when settings are saved */
    onSave?: (settings: Partial<AlertSettings>) => void;
}
export declare function AlertSettingsTab({ isDark, apiBasePath, onSave, }: AlertSettingsTabProps): import("react/jsx-runtime").JSX.Element;
export default AlertSettingsTab;
