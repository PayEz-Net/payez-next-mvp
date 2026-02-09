/**
 * =============================================================================
 * VIBE ADMIN LOGGING SETTINGS TAB
 * =============================================================================
 *
 * Admin UI for managing log levels, retention, and storage limits.
 * Provides environment presets, per-category levels, and manual pruning.
 *
 * =============================================================================
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export interface LogLevels {
    api: LogLevel;
    auth: LogLevel;
    database: LogLevel;
    agent: LogLevel;
    system: LogLevel;
}
export interface RetentionSettings {
    debug_days: number;
    info_days: number;
    warn_days: number;
    error_days: number;
    critical_days: number;
}
export interface StorageLimits {
    max_size_mb: number;
    max_rows: number;
}
export interface UsageStats {
    total_rows: number;
    total_size_mb: number;
    by_level?: {
        debug?: {
            rows: number;
            size_mb: number;
        };
        info?: {
            rows: number;
            size_mb: number;
        };
        warn?: {
            rows: number;
            size_mb: number;
        };
        error?: {
            rows: number;
            size_mb: number;
        };
        critical?: {
            rows: number;
            size_mb: number;
        };
    };
    limits: StorageLimits;
    percent_used: number;
    oldest_entry?: string;
}
export interface LoggingSettings {
    levels: LogLevels;
    retention: RetentionSettings;
    limits: StorageLimits;
    current_usage?: UsageStats;
}
export interface LoggingSettingsTabProps {
    isDark?: boolean;
    /** API base path (default: /api/admin/logging) */
    apiBasePath?: string;
    /** Callback when settings are saved */
    onSave?: (settings: Partial<LoggingSettings>) => void;
}
export declare function LoggingSettingsTab({ isDark, apiBasePath, onSave, }: LoggingSettingsTabProps): import("react/jsx-runtime").JSX.Element;
export default LoggingSettingsTab;
