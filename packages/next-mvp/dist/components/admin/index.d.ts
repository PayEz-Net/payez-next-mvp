/**
 * =============================================================================
 * VIBE ADMIN COMPONENTS
 * =============================================================================
 *
 * Generic admin panel components for Vibe-powered applications.
 * These components are designed to be multi-tenant and can be configured
 * per-collection via the VibeAdminProvider.
 *
 * Usage:
 * ------
 * import {
 *   VibeAdminProvider,
 *   VibeAdminLayout,
 *   SessionsTab,
 *   AnalyticsTab,
 *   StatsTab,
 * } from '@payez/next-mvp/components/admin';
 *
 * =============================================================================
 */
export { VibeAdminProvider, useVibeAdmin, type VibeAdminConfig, type AdminTab, type VibeAdminContextValue, } from './VibeAdminContext';
export { VibeAdminLayout } from './VibeAdminLayout';
export { SessionsTab, type SessionsTabProps, type LoginSession, type SessionStats } from './SessionsTab';
export { AnalyticsTab, type AnalyticsTabProps } from './AnalyticsTab';
export { StatsTab, type StatsTabProps, type StatCard, type QuickAction, type RecentActivity, type SystemStatus } from './StatsTab';
export { DataBrowserTab, type DataBrowserTabProps, type CollectionInfo, type TableInfo } from './DataBrowserTab';
export { LoggingSettingsTab, type LoggingSettingsTabProps, type LogLevel, type LogLevels, type RetentionSettings, type StorageLimits, type UsageStats, type LoggingSettings, } from './LoggingSettingsTab';
export { AlertSettingsTab, type AlertSettingsTabProps, type DeliveryMode, type AlertConfig, type AlertsConfig, type RateLimit, type AlertSettings, type AlertHistoryItem, } from './AlertSettingsTab';
