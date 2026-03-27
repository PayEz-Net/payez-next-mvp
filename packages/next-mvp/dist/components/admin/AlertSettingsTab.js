"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertSettingsTab = AlertSettingsTab;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------
const DELIVERY_MODES = [
    { value: 'smart', label: 'Smart', description: 'Critical alerts immediate, others batched (Recommended)' },
    { value: 'immediate', label: 'Immediate', description: 'All alerts sent as they occur' },
    { value: 'hourly', label: 'Hourly', description: 'Batched into hourly digest' },
    { value: 'daily', label: 'Daily', description: 'Batched into daily digest (8 AM)' },
];
const ALERT_TYPES = [
    {
        id: 'error_spike',
        label: 'Error Spike',
        description: 'Alert when errors exceed threshold',
        icon: lucide_react_1.AlertTriangle,
        hasThreshold: true,
        thresholdLabel: 'Threshold',
        thresholdUnit: 'errors/hour',
    },
    {
        id: 'storage_warning',
        label: 'Storage Warning',
        description: 'Alert when log storage approaches capacity',
        icon: lucide_react_1.HardDrive,
        hasThreshold: true,
        thresholdLabel: 'Threshold',
        thresholdUnit: '% capacity',
    },
    {
        id: 'storage_critical',
        label: 'Storage Critical',
        description: 'Alert when storage is nearly full',
        icon: lucide_react_1.HardDrive,
        hasThreshold: true,
        thresholdLabel: 'Threshold',
        thresholdUnit: '% capacity',
        alwaysSent: true,
    },
    {
        id: 'agent_expiring',
        label: 'Agent Access Expiring',
        description: 'Alert 24 hours before agent access expires',
        icon: lucide_react_1.Bot,
        hasThreshold: false,
    },
    {
        id: 'agent_expired',
        label: 'Agent Access Expired',
        description: 'Alert when agent access has expired',
        icon: lucide_react_1.Bot,
        hasThreshold: false,
        alwaysSent: true,
    },
];
const TEST_ALERT_OPTIONS = [
    { value: 'error_spike', label: 'Error Spike Alert' },
    { value: 'storage_warning', label: 'Storage Warning Alert' },
    { value: 'agent_expiring', label: 'Agent Expiring Alert' },
];
const DEFAULT_SETTINGS = {
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
function AlertSettingsTab({ isDark = true, apiBasePath = '/api/admin/alerts', onSave, }) {
    const [settings, setSettings] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [saving, setSaving] = (0, react_1.useState)(false);
    const [sendingTest, setSendingTest] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    const [successMessage, setSuccessMessage] = (0, react_1.useState)(null);
    const [hasChanges, setHasChanges] = (0, react_1.useState)(false);
    // Edited state
    const [editedRecipients, setEditedRecipients] = (0, react_1.useState)([]);
    const [editedMode, setEditedMode] = (0, react_1.useState)('smart');
    const [editedAlerts, setEditedAlerts] = (0, react_1.useState)(DEFAULT_SETTINGS.alerts);
    const [editedRateLimit, setEditedRateLimit] = (0, react_1.useState)(10);
    // New recipient input
    const [newRecipient, setNewRecipient] = (0, react_1.useState)('');
    const [recipientError, setRecipientError] = (0, react_1.useState)(null);
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
    const fetchSettings = (0, react_1.useCallback)(async () => {
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
            }
            else if (res.status === 404) {
                // Endpoint not ready - use defaults
                setSettings(DEFAULT_SETTINGS);
                setEditedRecipients([]);
                setEditedMode('smart');
                setEditedAlerts(DEFAULT_SETTINGS.alerts);
                setEditedRateLimit(10);
            }
            else {
                throw new Error('Failed to fetch settings');
            }
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    }, [apiBasePath]);
    (0, react_1.useEffect)(() => {
        fetchSettings();
    }, [fetchSettings]);
    // Check for changes
    (0, react_1.useEffect)(() => {
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
        if (!email)
            return;
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
    const removeRecipient = (email) => {
        setEditedRecipients(editedRecipients.filter(r => r !== email));
    };
    // Update alert config
    const updateAlertConfig = (alertId, updates) => {
        setEditedAlerts(prev => ({
            ...prev,
            [alertId]: { ...prev[alertId], ...updates },
        }));
    };
    // Save settings
    const saveSettings = async () => {
        if (!hasChanges)
            return;
        setSaving(true);
        setError(null);
        try {
            const payload = {
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
            }
            else if (res.status === 404) {
                // Endpoint not ready - simulate success
                setSettings(payload);
                setSuccessMessage('Settings saved (demo mode)');
                setTimeout(() => setSuccessMessage(null), 3000);
            }
            else {
                throw new Error('Failed to save settings');
            }
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setSaving(false);
        }
    };
    // Send test alert
    const sendTestAlert = async (alertType) => {
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
            }
            else if (res.status === 404) {
                setSuccessMessage('Test alert sent (demo mode)');
                setTimeout(() => setSuccessMessage(null), 3000);
            }
            else {
                throw new Error('Failed to send test alert');
            }
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setSendingTest(false);
        }
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center py-12", children: (0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "w-8 h-8 animate-spin text-indigo-500" }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [error && ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center gap-3 p-4 rounded-lg ${isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-300'} border`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.AlertCircle, { className: isDark ? 'text-red-400' : 'text-red-500', size: 20 }), (0, jsx_runtime_1.jsx)("span", { className: isDark ? 'text-red-300' : 'text-red-700', children: error })] })), successMessage && ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center gap-3 p-4 rounded-lg ${isDark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-300'} border`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Check, { className: isDark ? 'text-green-400' : 'text-green-500', size: 20 }), (0, jsx_runtime_1.jsx)("span", { className: isDark ? 'text-green-300' : 'text-green-700', children: successMessage })] })), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-xl overflow-hidden`, children: [(0, jsx_runtime_1.jsxs)("div", { className: `px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Mail, { className: isDark ? 'text-violet-400' : 'text-violet-500', size: 20 }), (0, jsx_runtime_1.jsx)("h3", { className: `font-semibold ${themeClasses.textPrimary}`, children: "Alert Recipients" })] }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${themeClasses.textMuted} mt-1`, children: "Email addresses that receive alert notifications" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-5 space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-2", children: [editedRecipients.map((email) => ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center gap-2 px-3 py-1.5 rounded-lg ${themeClasses.tagBg}`, children: [(0, jsx_runtime_1.jsx)("span", { className: `text-sm ${themeClasses.textPrimary}`, children: email }), (0, jsx_runtime_1.jsx)("button", { onClick: () => removeRecipient(email), className: `p-0.5 rounded ${isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-300'} transition-colors`, children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { size: 14, className: themeClasses.textMuted }) })] }, email))), editedRecipients.length === 0 && ((0, jsx_runtime_1.jsx)("span", { className: `text-sm ${themeClasses.textMuted}`, children: "No recipients configured" }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex gap-2", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex-1", children: [(0, jsx_runtime_1.jsx)("input", { type: "email", value: newRecipient, onChange: (e) => {
                                                    setNewRecipient(e.target.value);
                                                    setRecipientError(null);
                                                }, onKeyDown: (e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addRecipient();
                                                    }
                                                }, placeholder: "Enter email address", className: `
                  w-full px-3 py-2 rounded-lg text-sm
                  ${themeClasses.inputBg} ${themeClasses.textPrimary} border
                  focus:outline-none focus:ring-2 focus:ring-indigo-500
                  ${recipientError ? (isDark ? 'border-red-500' : 'border-red-400') : ''}
                ` }), recipientError && ((0, jsx_runtime_1.jsx)("p", { className: `text-xs mt-1 ${isDark ? 'text-red-400' : 'text-red-500'}`, children: recipientError }))] }), (0, jsx_runtime_1.jsxs)("button", { onClick: addRecipient, className: `
                px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${isDark ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'}
                text-white flex items-center gap-2
              `, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { size: 16 }), "Add"] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-xl overflow-hidden`, children: [(0, jsx_runtime_1.jsxs)("div", { className: `px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Clock, { className: isDark ? 'text-cyan-400' : 'text-cyan-500', size: 20 }), (0, jsx_runtime_1.jsx)("h3", { className: `font-semibold ${themeClasses.textPrimary}`, children: "Delivery Mode" })] }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${themeClasses.textMuted} mt-1`, children: "How alerts are delivered to recipients" })] }), (0, jsx_runtime_1.jsx)("div", { className: "p-5", children: (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3", children: DELIVERY_MODES.map((mode) => {
                                const isSelected = editedMode === mode.value;
                                return ((0, jsx_runtime_1.jsxs)("button", { onClick: () => setEditedMode(mode.value), className: `
                    p-4 rounded-lg border-2 text-left transition-all
                    ${isSelected
                                        ? 'border-indigo-500 ' + (isDark ? 'bg-indigo-500/10' : 'bg-indigo-50')
                                        : (isDark ? 'border-slate-700 hover:border-slate-600' : 'border-gray-200 hover:border-gray-300')}
                  `, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2 mb-1", children: [(0, jsx_runtime_1.jsx)("div", { className: `w-3 h-3 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-500' : (isDark ? 'border-slate-500' : 'border-gray-400')}`, children: isSelected && (0, jsx_runtime_1.jsx)("div", { className: "w-1.5 h-1.5 rounded-full bg-indigo-500" }) }), (0, jsx_runtime_1.jsx)("span", { className: `font-medium ${themeClasses.textPrimary}`, children: mode.label })] }), (0, jsx_runtime_1.jsx)("p", { className: `text-xs ${themeClasses.textMuted} ml-5`, children: mode.description })] }, mode.value));
                            }) }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-xl overflow-hidden`, children: [(0, jsx_runtime_1.jsxs)("div", { className: `px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Bell, { className: isDark ? 'text-amber-400' : 'text-amber-500', size: 20 }), (0, jsx_runtime_1.jsx)("h3", { className: `font-semibold ${themeClasses.textPrimary}`, children: "Alert Types" })] }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${themeClasses.textMuted} mt-1`, children: "Configure which alerts to receive and their thresholds" })] }), (0, jsx_runtime_1.jsx)("div", { className: "divide-y divide-slate-700/50", children: ALERT_TYPES.map((alertType) => {
                            const config = editedAlerts[alertType.id];
                            const Icon = alertType.icon;
                            return ((0, jsx_runtime_1.jsx)("div", { className: "p-5", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start gap-3", children: [(0, jsx_runtime_1.jsx)("div", { className: `p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`, children: (0, jsx_runtime_1.jsx)(Icon, { size: 18, className: themeClasses.textSecondary }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("span", { className: `font-medium ${themeClasses.textPrimary}`, children: alertType.label }), alertType.alwaysSent && ((0, jsx_runtime_1.jsx)("span", { className: `px-2 py-0.5 text-xs rounded ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`, children: "Always sent" }))] }), (0, jsx_runtime_1.jsx)("p", { className: `text-sm ${themeClasses.textMuted}`, children: alertType.description })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [alertType.hasThreshold && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)("input", { type: "number", min: "1", max: "100", value: config.threshold ?? config.threshold_pct ?? 10, onChange: (e) => {
                                                                const val = parseInt(e.target.value) || 10;
                                                                if (alertType.thresholdUnit?.includes('%')) {
                                                                    updateAlertConfig(alertType.id, { threshold_pct: val });
                                                                }
                                                                else {
                                                                    updateAlertConfig(alertType.id, { threshold: val });
                                                                }
                                                            }, disabled: !config.enabled && !alertType.alwaysSent, className: `
                            w-16 px-2 py-1.5 rounded text-sm text-center
                            ${themeClasses.inputBg} ${themeClasses.textPrimary} border
                            focus:outline-none focus:ring-2 focus:ring-indigo-500
                            disabled:opacity-50
                          ` }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs ${themeClasses.textMuted} whitespace-nowrap`, children: alertType.thresholdUnit })] })), !alertType.alwaysSent && ((0, jsx_runtime_1.jsx)("button", { onClick: () => updateAlertConfig(alertType.id, { enabled: !config.enabled }), className: `
                          relative w-11 h-6 rounded-full transition-colors
                          ${config.enabled
                                                        ? (isDark ? 'bg-indigo-600' : 'bg-indigo-500')
                                                        : (isDark ? 'bg-slate-600' : 'bg-gray-300')}
                        `, children: (0, jsx_runtime_1.jsx)("span", { className: `
                            absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform
                            ${config.enabled ? 'translate-x-5' : ''}
                          ` }) }))] })] }) }, alertType.id));
                        }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-xl overflow-hidden`, children: [(0, jsx_runtime_1.jsx)("div", { className: `px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Zap, { className: isDark ? 'text-emerald-400' : 'text-emerald-500', size: 20 }), (0, jsx_runtime_1.jsx)("h3", { className: `font-semibold ${themeClasses.textPrimary}`, children: "Rate Limiting" })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "p-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-4", children: [(0, jsx_runtime_1.jsx)("label", { className: `text-sm ${themeClasses.textSecondary}`, children: "Maximum alerts:" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: "1", max: "100", value: editedRateLimit, onChange: (e) => setEditedRateLimit(parseInt(e.target.value) || 10), className: `
                w-20 px-3 py-2 rounded-lg text-sm
                ${themeClasses.inputBg} ${themeClasses.textPrimary} border
                focus:outline-none focus:ring-2 focus:ring-indigo-500
              ` }), (0, jsx_runtime_1.jsx)("span", { className: `text-sm ${themeClasses.textMuted}`, children: "per hour" })] }), (0, jsx_runtime_1.jsxs)("div", { className: `flex items-start gap-2 mt-3 text-xs ${themeClasses.textMuted}`, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Info, { size: 14, className: "flex-shrink-0 mt-0.5" }), (0, jsx_runtime_1.jsx)("span", { children: "Critical alerts (Storage Critical, Agent Expired) are always sent regardless of this limit." })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: `${themeClasses.cardBg} border rounded-xl overflow-hidden`, children: [(0, jsx_runtime_1.jsx)("div", { className: `px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`, children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Send, { className: isDark ? 'text-blue-400' : 'text-blue-500', size: 20 }), (0, jsx_runtime_1.jsx)("h3", { className: `font-semibold ${themeClasses.textPrimary}`, children: "Test & History" })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "p-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap gap-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsxs)("select", { disabled: sendingTest || editedRecipients.length === 0, onChange: (e) => {
                                                    if (e.target.value) {
                                                        sendTestAlert(e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }, className: `
                  px-4 py-2.5 pr-10 rounded-lg text-sm font-medium cursor-pointer appearance-none
                  ${isDark ? 'bg-blue-900/30 text-blue-300 border-blue-700 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'}
                  border focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                `, children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Send Test Alert..." }), TEST_ALERT_OPTIONS.map((opt) => ((0, jsx_runtime_1.jsx)("option", { value: opt.value, children: opt.label }, opt.value)))] }), (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: `absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-blue-400' : 'text-blue-500'}` })] }), (0, jsx_runtime_1.jsxs)("button", { onClick: () => {
                                            // TODO: Open history modal or navigate to history page
                                            window.open(`${apiBasePath}/history`, '_blank');
                                        }, className: `
                px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2
                ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                border ${isDark ? 'border-slate-600' : 'border-gray-300'}
              `, children: [(0, jsx_runtime_1.jsx)(lucide_react_1.History, { size: 16 }), "View Alert History"] })] }), editedRecipients.length === 0 && ((0, jsx_runtime_1.jsx)("p", { className: `text-xs mt-3 ${themeClasses.textMuted}`, children: "Add at least one recipient to send test alerts." }))] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-end gap-4", children: [hasChanges && ((0, jsx_runtime_1.jsx)("span", { className: `text-sm ${themeClasses.textMuted}`, children: "You have unsaved changes" })), (0, jsx_runtime_1.jsx)("button", { onClick: saveSettings, disabled: !hasChanges || saving, className: `
            px-6 py-2.5 rounded-lg font-medium text-sm transition-all
            ${hasChanges
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : (isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-400')}
            disabled:cursor-not-allowed
          `, children: saving ? ((0, jsx_runtime_1.jsxs)("span", { className: "flex items-center gap-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.RefreshCw, { className: "w-4 h-4 animate-spin" }), "Saving..."] })) : ('Save Settings') })] })] }));
}
exports.default = AlertSettingsTab;
