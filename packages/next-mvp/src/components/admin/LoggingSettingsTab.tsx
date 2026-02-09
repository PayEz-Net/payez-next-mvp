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

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Zap,
  Server,
  Bug,
  Trash2,
  HardDrive,
  Clock,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  Check,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

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
    debug?: { rows: number; size_mb: number };
    info?: { rows: number; size_mb: number };
    warn?: { rows: number; size_mb: number };
    error?: { rows: number; size_mb: number };
    critical?: { rows: number; size_mb: number };
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

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

const LOG_LEVELS: { value: LogLevel; label: string; color: string }[] = [
  { value: 'debug', label: 'Debug', color: 'text-gray-400' },
  { value: 'info', label: 'Info', color: 'text-blue-400' },
  { value: 'warn', label: 'Warning', color: 'text-amber-400' },
  { value: 'error', label: 'Error', color: 'text-red-400' },
  { value: 'critical', label: 'Critical', color: 'text-red-500' },
];

const PRESETS: {
  id: string;
  label: string;
  description: string;
  levels: LogLevels;
}[] = [
  {
    id: 'development',
    label: 'Development',
    description: 'Verbose logging for debugging',
    levels: { api: 'debug', auth: 'debug', database: 'info', agent: 'debug', system: 'info' },
  },
  {
    id: 'production',
    label: 'Production',
    description: 'Minimal logging for performance',
    levels: { api: 'warn', auth: 'info', database: 'error', agent: 'info', system: 'warn' },
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting',
    description: 'Maximum verbosity for issue diagnosis',
    levels: { api: 'debug', auth: 'debug', database: 'debug', agent: 'debug', system: 'debug' },
  },
];

const CATEGORIES: { id: keyof LogLevels; label: string; description: string }[] = [
  { id: 'api', label: 'API', description: 'Request/response logging' },
  { id: 'auth', label: 'Authentication', description: 'Login, logout, token events' },
  { id: 'database', label: 'Database', description: 'Query and connection logging' },
  { id: 'agent', label: 'Agent', description: 'AI agent execution logs' },
  { id: 'system', label: 'System', description: 'Infrastructure and health events' },
];

const RETENTION_DEFAULTS: RetentionSettings = {
  debug_days: 7,
  info_days: 30,
  warn_days: 60,
  error_days: 90,
  critical_days: 180,
};

const PRUNE_OPTIONS = [
  { value: 'debug_all', label: 'Clear all Debug logs' },
  { value: 'older_7', label: 'Clear logs older than 7 days' },
  { value: 'older_30', label: 'Clear logs older than 30 days' },
  { value: 'all_keep_100', label: 'Clear all (keep last 100)' },
];

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

export function LoggingSettingsTab({
  isDark = true,
  apiBasePath = '/api/admin/logging',
  onSave,
}: LoggingSettingsTabProps) {
  const [settings, setSettings] = useState<LoggingSettings | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Edited state (local changes before save)
  const [editedLevels, setEditedLevels] = useState<LogLevels | null>(null);
  const [editedRetention, setEditedRetention] = useState<RetentionSettings | null>(null);
  const [editedLimits, setEditedLimits] = useState<StorageLimits | null>(null);

  const themeClasses = {
    bg: isDark ? 'bg-slate-950' : 'bg-gray-50',
    cardBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm',
    textPrimary: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-500' : 'text-gray-500',
    inputBg: isDark ? 'bg-slate-900 border-slate-600' : 'bg-white border-gray-300',
    hoverBg: isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100',
  };

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiBasePath}/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setEditedLevels(data.levels);
        setEditedRetention(data.retention);
        setEditedLimits(data.limits);
        if (data.current_usage) {
          setUsage(data.current_usage);
        }
      } else if (res.status === 404) {
        // Endpoint not ready - use defaults
        const defaults: LoggingSettings = {
          levels: PRESETS[1].levels, // Production defaults
          retention: RETENTION_DEFAULTS,
          limits: { max_size_mb: 10, max_rows: 20000 },
        };
        setSettings(defaults);
        setEditedLevels(defaults.levels);
        setEditedRetention(defaults.retention);
        setEditedLimits(defaults.limits);
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiBasePath]);

  // Fetch usage separately (can be more frequent)
  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch(`${apiBasePath}/usage`);
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  }, [apiBasePath]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Check for changes
  useEffect(() => {
    if (!settings || !editedLevels || !editedRetention || !editedLimits) {
      setHasChanges(false);
      return;
    }

    const levelsChanged = JSON.stringify(settings.levels) !== JSON.stringify(editedLevels);
    const retentionChanged = JSON.stringify(settings.retention) !== JSON.stringify(editedRetention);
    const limitsChanged = JSON.stringify(settings.limits) !== JSON.stringify(editedLimits);

    setHasChanges(levelsChanged || retentionChanged || limitsChanged);
  }, [settings, editedLevels, editedRetention, editedLimits]);

  // Apply preset
  const applyPreset = async (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setEditedLevels(preset.levels);

    try {
      const res = await fetch(`${apiBasePath}/preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: presetId }),
      });

      if (res.ok) {
        setSuccessMessage(`Applied ${preset.label} preset`);
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchSettings();
      }
    } catch (err) {
      // Preset applied locally even if API fails
      console.error('Failed to apply preset:', err);
    }
  };

  // Save settings
  const saveSettings = async () => {
    if (!hasChanges || !editedLevels || !editedRetention || !editedLimits) return;

    setSaving(true);
    setError(null);

    try {
      const payload: Partial<LoggingSettings> = {
        levels: editedLevels,
        retention: editedRetention,
        limits: editedLimits,
      };

      const res = await fetch(`${apiBasePath}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMessage('Settings saved successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        onSave?.(payload);
        fetchSettings();
      } else if (res.status === 404) {
        // Endpoint not ready - simulate success
        setSettings({
          levels: editedLevels,
          retention: editedRetention,
          limits: editedLimits,
        });
        setSuccessMessage('Settings saved (demo mode)');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Manual prune
  const handlePrune = async (option: string) => {
    setPruning(true);
    setError(null);

    try {
      let body: { older_than_days?: number; level?: string } = {};

      switch (option) {
        case 'debug_all':
          body = { level: 'debug' };
          break;
        case 'older_7':
          body = { older_than_days: 7 };
          break;
        case 'older_30':
          body = { older_than_days: 30 };
          break;
        case 'all_keep_100':
          body = { older_than_days: 0 }; // Server interprets as "all"
          break;
      }

      const res = await fetch(`${apiBasePath}/prune`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(`Pruned ${data.deleted_rows?.toLocaleString() || 'some'} rows`);
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchUsage();
      } else if (res.status === 404) {
        setSuccessMessage('Prune completed (demo mode)');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error('Failed to prune logs');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPruning(false);
    }
  };

  // Get active preset
  const getActivePreset = () => {
    if (!editedLevels) return null;
    return PRESETS.find(p => JSON.stringify(p.levels) === JSON.stringify(editedLevels))?.id || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-300'} border`}>
          <AlertCircle className={isDark ? 'text-red-400' : 'text-red-500'} size={20} />
          <span className={isDark ? 'text-red-300' : 'text-red-700'}>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${isDark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-300'} border`}>
          <Check className={isDark ? 'text-green-400' : 'text-green-500'} size={20} />
          <span className={isDark ? 'text-green-300' : 'text-green-700'}>{successMessage}</span>
        </div>
      )}

      {/* Section 1: Environment Presets */}
      <div className={`${themeClasses.cardBg} border rounded-xl overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Zap className={isDark ? 'text-amber-400' : 'text-amber-500'} size={20} />
            <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Quick Setup</h3>
          </div>
          <p className={`text-sm ${themeClasses.textMuted} mt-1`}>
            Choose a preset to quickly configure log levels
          </p>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-3">
            {PRESETS.map((preset) => {
              const isActive = getActivePreset() === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`
                    px-4 py-2.5 rounded-lg font-medium text-sm transition-all
                    ${isActive
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-500 ring-offset-2 ' + (isDark ? 'ring-offset-slate-800' : 'ring-offset-white')
                      : (isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                    }
                  `}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Category Log Levels */}
      <div className={`${themeClasses.cardBg} border rounded-xl overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Bug className={isDark ? 'text-violet-400' : 'text-violet-500'} size={20} />
            <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Log Levels</h3>
          </div>
          <p className={`text-sm ${themeClasses.textMuted} mt-1`}>
            Set verbosity per category
          </p>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {CATEGORIES.map((category) => (
              <div key={category.id} className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${themeClasses.textPrimary}`}>{category.label}</p>
                  <p className={`text-xs ${themeClasses.textMuted}`}>{category.description}</p>
                </div>
                <select
                  value={editedLevels?.[category.id] || 'info'}
                  onChange={(e) => {
                    setEditedLevels(prev => prev ? { ...prev, [category.id]: e.target.value as LogLevel } : null);
                  }}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium cursor-pointer
                    ${themeClasses.inputBg} ${themeClasses.textPrimary} border
                    focus:outline-none focus:ring-2 focus:ring-indigo-500
                  `}
                >
                  {LOG_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Retention Settings */}
      <div className={`${themeClasses.cardBg} border rounded-xl overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Clock className={isDark ? 'text-cyan-400' : 'text-cyan-500'} size={20} />
            <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Retention Settings</h3>
          </div>
          <p className={`text-sm ${themeClasses.textMuted} mt-1`}>
            How long to keep logs by severity level
          </p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { key: 'debug_days', label: 'Debug' },
              { key: 'info_days', label: 'Info' },
              { key: 'warn_days', label: 'Warnings' },
              { key: 'error_days', label: 'Errors' },
              { key: 'critical_days', label: 'Critical' },
            ].map((item) => (
              <div key={item.key}>
                <label className={`block text-sm ${themeClasses.textSecondary} mb-1`}>
                  {item.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={editedRetention?.[item.key as keyof RetentionSettings] || 7}
                    onChange={(e) => {
                      setEditedRetention(prev => prev ? { ...prev, [item.key]: parseInt(e.target.value) || 7 } : null);
                    }}
                    className={`
                      w-20 px-3 py-2 rounded-lg text-sm
                      ${themeClasses.inputBg} ${themeClasses.textPrimary} border
                      focus:outline-none focus:ring-2 focus:ring-indigo-500
                    `}
                  />
                  <span className={`text-sm ${themeClasses.textMuted}`}>days</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Storage & Pruning */}
      <div className={`${themeClasses.cardBg} border rounded-xl overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <HardDrive className={isDark ? 'text-emerald-400' : 'text-emerald-500'} size={20} />
            <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Storage Limits</h3>
          </div>
        </div>
        <div className="p-5 space-y-6">
          {/* Limit Inputs */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <label className={`text-sm ${themeClasses.textSecondary}`}>Max size:</label>
              <input
                type="number"
                min="1"
                max="1000"
                value={editedLimits?.max_size_mb || 10}
                onChange={(e) => {
                  setEditedLimits(prev => prev ? { ...prev, max_size_mb: parseInt(e.target.value) || 10 } : null);
                }}
                className={`
                  w-20 px-3 py-2 rounded-lg text-sm
                  ${themeClasses.inputBg} ${themeClasses.textPrimary} border
                  focus:outline-none focus:ring-2 focus:ring-indigo-500
                `}
              />
              <span className={`text-sm ${themeClasses.textMuted}`}>MB</span>
            </div>
            <span className={themeClasses.textMuted}>or</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="100"
                max="1000000"
                step="1000"
                value={editedLimits?.max_rows || 20000}
                onChange={(e) => {
                  setEditedLimits(prev => prev ? { ...prev, max_rows: parseInt(e.target.value) || 20000 } : null);
                }}
                className={`
                  w-28 px-3 py-2 rounded-lg text-sm
                  ${themeClasses.inputBg} ${themeClasses.textPrimary} border
                  focus:outline-none focus:ring-2 focus:ring-indigo-500
                `}
              />
              <span className={`text-sm ${themeClasses.textMuted}`}>rows</span>
            </div>
          </div>

          {/* Usage Bar */}
          {usage && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${themeClasses.textSecondary}`}>Current usage</span>
                <span className={`text-sm font-medium ${themeClasses.textPrimary}`}>
                  {usage.total_size_mb?.toFixed(1) || 0} MB of {usage.limits.max_size_mb} MB ({usage.percent_used || 0}%)
                </span>
              </div>
              <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                <div
                  className={`h-full rounded-full transition-all ${
                    (usage.percent_used || 0) > 90 ? 'bg-red-500' :
                    (usage.percent_used || 0) > 70 ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(usage.percent_used || 0, 100)}%` }}
                />
              </div>
              <div className={`flex items-center justify-between mt-2 text-xs ${themeClasses.textMuted}`}>
                <span>{(usage.total_rows || 0).toLocaleString()} rows</span>
                {usage.oldest_entry && (
                  <span>Oldest: {new Date(usage.oldest_entry).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          )}

          {/* Prune Button */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                disabled={pruning}
                onChange={(e) => {
                  if (e.target.value) {
                    handlePrune(e.target.value);
                    e.target.value = '';
                  }
                }}
                className={`
                  px-4 py-2.5 pr-10 rounded-lg text-sm font-medium cursor-pointer appearance-none
                  ${isDark ? 'bg-red-900/30 text-red-300 border-red-700 hover:bg-red-900/50' : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'}
                  border focus:outline-none focus:ring-2 focus:ring-red-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <option value="">Prune Now...</option>
                {PRUNE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-red-400' : 'text-red-500'}`} />
            </div>
            {pruning && (
              <span className={`flex items-center gap-2 text-sm ${themeClasses.textMuted}`}>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Pruning...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {hasChanges && (
          <span className={`text-sm ${themeClasses.textMuted}`}>
            You have unsaved changes
          </span>
        )}
        <button
          onClick={saveSettings}
          disabled={!hasChanges || saving}
          className={`
            px-6 py-2.5 rounded-lg font-medium text-sm transition-all
            ${hasChanges
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : (isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-400')
            }
            disabled:cursor-not-allowed
          `}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Saving...
            </span>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </div>
  );
}

export default LoggingSettingsTab;
