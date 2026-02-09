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

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Mail,
  Plus,
  X,
  Clock,
  Zap,
  AlertTriangle,
  HardDrive,
  Bot,
  Send,
  History,
  RefreshCw,
  AlertCircle,
  Check,
  ChevronDown,
  Info,
} from 'lucide-react';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

const DELIVERY_MODES: { value: DeliveryMode; label: string; description: string }[] = [
  { value: 'smart', label: 'Smart', description: 'Critical alerts immediate, others batched (Recommended)' },
  { value: 'immediate', label: 'Immediate', description: 'All alerts sent as they occur' },
  { value: 'hourly', label: 'Hourly', description: 'Batched into hourly digest' },
  { value: 'daily', label: 'Daily', description: 'Batched into daily digest (8 AM)' },
];

const ALERT_TYPES: {
  id: keyof AlertsConfig;
  label: string;
  description: string;
  icon: React.ElementType;
  hasThreshold: boolean;
  thresholdLabel?: string;
  thresholdUnit?: string;
  alwaysSent?: boolean;
}[] = [
  {
    id: 'error_spike',
    label: 'Error Spike',
    description: 'Alert when errors exceed threshold',
    icon: AlertTriangle,
    hasThreshold: true,
    thresholdLabel: 'Threshold',
    thresholdUnit: 'errors/hour',
  },
  {
    id: 'storage_warning',
    label: 'Storage Warning',
    description: 'Alert when log storage approaches capacity',
    icon: HardDrive,
    hasThreshold: true,
    thresholdLabel: 'Threshold',
    thresholdUnit: '% capacity',
  },
  {
    id: 'storage_critical',
    label: 'Storage Critical',
    description: 'Alert when storage is nearly full',
    icon: HardDrive,
    hasThreshold: true,
    thresholdLabel: 'Threshold',
    thresholdUnit: '% capacity',
    alwaysSent: true,
  },
  {
    id: 'agent_expiring',
    label: 'Agent Access Expiring',
    description: 'Alert 24 hours before agent access expires',
    icon: Bot,
    hasThreshold: false,
  },
  {
    id: 'agent_expired',
    label: 'Agent Access Expired',
    description: 'Alert when agent access has expired',
    icon: Bot,
    hasThreshold: false,
    alwaysSent: true,
  },
];

const TEST_ALERT_OPTIONS = [
  { value: 'error_spike', label: 'Error Spike Alert' },
  { value: 'storage_warning', label: 'Storage Warning Alert' },
  { value: 'agent_expiring', label: 'Agent Expiring Alert' },
];

const DEFAULT_SETTINGS: AlertSettings = {
  recipients: [],
  digest_mode: 'smart',
  alerts: {
    error_spike: { enabled: true, threshold: 10 },
    storage_warning: { enabled: true, threshold_pct: 80 },
    storage_critical: { enabled: true, threshold_pct: 95 },
    agent_expiring: { enabled: true },
    agent_expired: { enabled: true },
  },
  rate_limit: { max_per_hour: 10 },
};

// -----------------------------------------------------------------------------
// COMPONENT
// -----------------------------------------------------------------------------

export function AlertSettingsTab({
  isDark = true,
  apiBasePath = '/api/admin/alerts',
  onSave,
}: AlertSettingsTabProps) {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Edited state
  const [editedRecipients, setEditedRecipients] = useState<string[]>([]);
  const [editedMode, setEditedMode] = useState<DeliveryMode>('smart');
  const [editedAlerts, setEditedAlerts] = useState<AlertsConfig>(DEFAULT_SETTINGS.alerts);
  const [editedRateLimit, setEditedRateLimit] = useState<number>(10);

  // New recipient input
  const [newRecipient, setNewRecipient] = useState('');
  const [recipientError, setRecipientError] = useState<string | null>(null);

  const themeClasses = {
    bg: isDark ? 'bg-slate-950' : 'bg-gray-50',
    cardBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm',
    textPrimary: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-500' : 'text-gray-500',
    inputBg: isDark ? 'bg-slate-900 border-slate-600' : 'bg-white border-gray-300',
    hoverBg: isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100',
    tagBg: isDark ? 'bg-slate-700' : 'bg-gray-100',
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
        setEditedRecipients(data.recipients || []);
        setEditedMode(data.digest_mode || 'smart');
        setEditedAlerts(data.alerts || DEFAULT_SETTINGS.alerts);
        setEditedRateLimit(data.rate_limit?.max_per_hour || 10);
      } else if (res.status === 404) {
        // Endpoint not ready - use defaults
        setSettings(DEFAULT_SETTINGS);
        setEditedRecipients([]);
        setEditedMode('smart');
        setEditedAlerts(DEFAULT_SETTINGS.alerts);
        setEditedRateLimit(10);
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiBasePath]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Check for changes
  useEffect(() => {
    if (!settings) {
      setHasChanges(false);
      return;
    }

    const recipientsChanged = JSON.stringify(settings.recipients) !== JSON.stringify(editedRecipients);
    const modeChanged = settings.digest_mode !== editedMode;
    const alertsChanged = JSON.stringify(settings.alerts) !== JSON.stringify(editedAlerts);
    const rateLimitChanged = settings.rate_limit.max_per_hour !== editedRateLimit;

    setHasChanges(recipientsChanged || modeChanged || alertsChanged || rateLimitChanged);
  }, [settings, editedRecipients, editedMode, editedAlerts, editedRateLimit]);

  // Add recipient
  const addRecipient = () => {
    const email = newRecipient.trim().toLowerCase();
    setRecipientError(null);

    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setRecipientError('Please enter a valid email address');
      return;
    }

    if (editedRecipients.includes(email)) {
      setRecipientError('This email is already in the list');
      return;
    }

    setEditedRecipients([...editedRecipients, email]);
    setNewRecipient('');
  };

  // Remove recipient
  const removeRecipient = (email: string) => {
    setEditedRecipients(editedRecipients.filter(r => r !== email));
  };

  // Update alert config
  const updateAlertConfig = (alertId: keyof AlertsConfig, updates: Partial<AlertConfig>) => {
    setEditedAlerts(prev => ({
      ...prev,
      [alertId]: { ...prev[alertId], ...updates },
    }));
  };

  // Save settings
  const saveSettings = async () => {
    if (!hasChanges) return;

    setSaving(true);
    setError(null);

    try {
      const payload: AlertSettings = {
        recipients: editedRecipients,
        digest_mode: editedMode,
        alerts: editedAlerts,
        rate_limit: { max_per_hour: editedRateLimit },
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
        setSettings(payload);
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

  // Send test alert
  const sendTestAlert = async (alertType: string) => {
    setSendingTest(true);
    setError(null);

    try {
      const res = await fetch(`${apiBasePath}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: alertType,
          recipient: editedRecipients[0] || 'test@example.com',
        }),
      });

      if (res.ok) {
        setSuccessMessage(`Test ${alertType.replace('_', ' ')} alert sent!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (res.status === 404) {
        setSuccessMessage('Test alert sent (demo mode)');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error('Failed to send test alert');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSendingTest(false);
    }
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

      {/* Section 1: Recipients */}
      <div className={`${themeClasses.cardBg} border rounded-xl overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Mail className={isDark ? 'text-violet-400' : 'text-violet-500'} size={20} />
            <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Alert Recipients</h3>
          </div>
          <p className={`text-sm ${themeClasses.textMuted} mt-1`}>
            Email addresses that receive alert notifications
          </p>
        </div>
        <div className="p-5 space-y-4">
          {/* Recipient list */}
          <div className="flex flex-wrap gap-2">
            {editedRecipients.map((email) => (
              <div
                key={email}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${themeClasses.tagBg}`}
              >
                <span className={`text-sm ${themeClasses.textPrimary}`}>{email}</span>
                <button
                  onClick={() => removeRecipient(email)}
                  className={`p-0.5 rounded ${isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-300'} transition-colors`}
                >
                  <X size={14} className={themeClasses.textMuted} />
                </button>
              </div>
            ))}
            {editedRecipients.length === 0 && (
              <span className={`text-sm ${themeClasses.textMuted}`}>No recipients configured</span>
            )}
          </div>

          {/* Add recipient input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="email"
                value={newRecipient}
                onChange={(e) => {
                  setNewRecipient(e.target.value);
                  setRecipientError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRecipient();
                  }
                }}
                placeholder="Enter email address"
                className={`
                  w-full px-3 py-2 rounded-lg text-sm
                  ${themeClasses.inputBg} ${themeClasses.textPrimary} border
                  focus:outline-none focus:ring-2 focus:ring-indigo-500
                  ${recipientError ? (isDark ? 'border-red-500' : 'border-red-400') : ''}
                `}
              />
              {recipientError && (
                <p className={`text-xs mt-1 ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                  {recipientError}
                </p>
              )}
            </div>
            <button
              onClick={addRecipient}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${isDark ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'}
                text-white flex items-center gap-2
              `}
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Delivery Mode */}
      <div className={`${themeClasses.cardBg} border rounded-xl overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Clock className={isDark ? 'text-cyan-400' : 'text-cyan-500'} size={20} />
            <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Delivery Mode</h3>
          </div>
          <p className={`text-sm ${themeClasses.textMuted} mt-1`}>
            How alerts are delivered to recipients
          </p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DELIVERY_MODES.map((mode) => {
              const isSelected = editedMode === mode.value;
              return (
                <button
                  key={mode.value}
                  onClick={() => setEditedMode(mode.value)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${isSelected
                      ? 'border-indigo-500 ' + (isDark ? 'bg-indigo-500/10' : 'bg-indigo-50')
                      : (isDark ? 'border-slate-700 hover:border-slate-600' : 'border-gray-200 hover:border-gray-300')
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-indigo-500' : (isDark ? 'border-slate-500' : 'border-gray-400')
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </div>
                    <span className={`font-medium ${themeClasses.textPrimary}`}>{mode.label}</span>
                  </div>
                  <p className={`text-xs ${themeClasses.textMuted} ml-5`}>{mode.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 3: Alert Configuration */}
      <div className={`${themeClasses.cardBg} border rounded-xl overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Bell className={isDark ? 'text-amber-400' : 'text-amber-500'} size={20} />
            <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Alert Types</h3>
          </div>
          <p className={`text-sm ${themeClasses.textMuted} mt-1`}>
            Configure which alerts to receive and their thresholds
          </p>
        </div>
        <div className="divide-y divide-slate-700/50">
          {ALERT_TYPES.map((alertType) => {
            const config = editedAlerts[alertType.id];
            const Icon = alertType.icon;

            return (
              <div key={alertType.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      <Icon size={18} className={themeClasses.textSecondary} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${themeClasses.textPrimary}`}>{alertType.label}</span>
                        {alertType.alwaysSent && (
                          <span className={`px-2 py-0.5 text-xs rounded ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                            Always sent
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${themeClasses.textMuted}`}>{alertType.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Threshold input */}
                    {alertType.hasThreshold && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={config.threshold ?? config.threshold_pct ?? 10}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 10;
                            if (alertType.thresholdUnit?.includes('%')) {
                              updateAlertConfig(alertType.id, { threshold_pct: val });
                            } else {
                              updateAlertConfig(alertType.id, { threshold: val });
                            }
                          }}
                          disabled={!config.enabled && !alertType.alwaysSent}
                          className={`
                            w-16 px-2 py-1.5 rounded text-sm text-center
                            ${themeClasses.inputBg} ${themeClasses.textPrimary} border
                            focus:outline-none focus:ring-2 focus:ring-indigo-500
                            disabled:opacity-50
                          `}
                        />
                        <span className={`text-xs ${themeClasses.textMuted} whitespace-nowrap`}>
                          {alertType.thresholdUnit}
                        </span>
                      </div>
                    )}

                    {/* Toggle */}
                    {!alertType.alwaysSent && (
                      <button
                        onClick={() => updateAlertConfig(alertType.id, { enabled: !config.enabled })}
                        className={`
                          relative w-11 h-6 rounded-full transition-colors
                          ${config.enabled
                            ? (isDark ? 'bg-indigo-600' : 'bg-indigo-500')
                            : (isDark ? 'bg-slate-600' : 'bg-gray-300')
                          }
                        `}
                      >
                        <span
                          className={`
                            absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform
                            ${config.enabled ? 'translate-x-5' : ''}
                          `}
                        />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Rate Limiting */}
      <div className={`${themeClasses.cardBg} border rounded-xl overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Zap className={isDark ? 'text-emerald-400' : 'text-emerald-500'} size={20} />
            <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Rate Limiting</h3>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-4">
            <label className={`text-sm ${themeClasses.textSecondary}`}>Maximum alerts:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={editedRateLimit}
              onChange={(e) => setEditedRateLimit(parseInt(e.target.value) || 10)}
              className={`
                w-20 px-3 py-2 rounded-lg text-sm
                ${themeClasses.inputBg} ${themeClasses.textPrimary} border
                focus:outline-none focus:ring-2 focus:ring-indigo-500
              `}
            />
            <span className={`text-sm ${themeClasses.textMuted}`}>per hour</span>
          </div>
          <div className={`flex items-start gap-2 mt-3 text-xs ${themeClasses.textMuted}`}>
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <span>Critical alerts (Storage Critical, Agent Expired) are always sent regardless of this limit.</span>
          </div>
        </div>
      </div>

      {/* Section 5: Test & History */}
      <div className={`${themeClasses.cardBg} border rounded-xl overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Send className={isDark ? 'text-blue-400' : 'text-blue-500'} size={20} />
            <h3 className={`font-semibold ${themeClasses.textPrimary}`}>Test & History</h3>
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-3">
            {/* Send Test Alert dropdown */}
            <div className="relative">
              <select
                disabled={sendingTest || editedRecipients.length === 0}
                onChange={(e) => {
                  if (e.target.value) {
                    sendTestAlert(e.target.value);
                    e.target.value = '';
                  }
                }}
                className={`
                  px-4 py-2.5 pr-10 rounded-lg text-sm font-medium cursor-pointer appearance-none
                  ${isDark ? 'bg-blue-900/30 text-blue-300 border-blue-700 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'}
                  border focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <option value="">Send Test Alert...</option>
                {TEST_ALERT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>

            {/* View History button */}
            <button
              onClick={() => {
                // TODO: Open history modal or navigate to history page
                window.open(`${apiBasePath}/history`, '_blank');
              }}
              className={`
                px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2
                ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                border ${isDark ? 'border-slate-600' : 'border-gray-300'}
              `}
            >
              <History size={16} />
              View Alert History
            </button>
          </div>

          {editedRecipients.length === 0 && (
            <p className={`text-xs mt-3 ${themeClasses.textMuted}`}>
              Add at least one recipient to send test alerts.
            </p>
          )}
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

export default AlertSettingsTab;
