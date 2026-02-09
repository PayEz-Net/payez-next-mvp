"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SignalRHealthCheck;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const signalrActivityService_1 = require("../services/signalrActivityService");
/**
 * Simple health check component using SignalR connection state
 * Following Occam's Razor: Connection alive = Service healthy, Connection dead = Service unhealthy
 */
function SignalRHealthCheck({ className = '', idpBaseUrl }) {
    // Allow disabling via env for noisy environments (e.g., production demos)
    if (process.env.NEXT_PUBLIC_DISABLE_HEALTH_MONITOR === 'true') {
        return null;
    }
    const [healthStatus, setHealthStatus] = (0, react_1.useState)({
        isHealthy: false,
        message: 'Initializing...',
        lastHeartbeat: null,
        connectionId: null
    });
    const [isInitializing, setIsInitializing] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        let unsubscribe = null;
        const initializeHealthService = async () => {
            try {
                // Subscribe to health status changes
                unsubscribe = signalrActivityService_1.signalRActivityService.subscribe((status) => {
                    setHealthStatus(status);
                    setIsInitializing(false);
                });
                // Start the health monitoring
                await signalrActivityService_1.signalRActivityService.start(idpBaseUrl);
            }
            catch (error) {
                // Handle service unavailable gracefully without console spam
                const errorMessage = error instanceof Error ? error.message : String(error);
                const isServiceDown = errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                    errorMessage.includes('Failed to fetch');
                if (isServiceDown) {
                    console.info('Health monitoring: Backend service unavailable');
                    setHealthStatus({
                        isHealthy: false,
                        message: 'Backend service offline',
                        lastHeartbeat: null,
                        connectionId: null
                    });
                }
                else {
                    console.error('Failed to initialize SignalR health service:', error);
                    setHealthStatus({
                        isHealthy: false,
                        message: 'Failed to initialize health monitoring',
                        lastHeartbeat: null,
                        connectionId: null
                    });
                }
                setIsInitializing(false);
            }
        };
        initializeHealthService();
        // Cleanup on unmount
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [idpBaseUrl]);
    const getStatusColor = () => {
        if (isInitializing)
            return 'text-yellow-600';
        return healthStatus.isHealthy ? 'text-green-600' : 'text-orange-600'; // Orange instead of alarming red
    };
    const getStatusIcon = () => {
        if (isInitializing)
            return '🔄';
        return healthStatus.isHealthy ? '✅' : '🔶'; // Orange diamond instead of scary red X
    };
    const getStatusMessage = () => {
        if (isInitializing)
            return 'Connecting to service...';
        return healthStatus.message;
    };
    const formatLastHeartbeat = () => {
        if (!healthStatus.lastHeartbeat)
            return null;
        const now = new Date();
        const diff = Math.floor((now.getTime() - healthStatus.lastHeartbeat.getTime()) / 1000);
        if (diff < 60)
            return `${diff}s ago`;
        if (diff < 3600)
            return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: `flex items-center space-x-2 ${className}`, children: [(0, jsx_runtime_1.jsx)("span", { className: "text-lg", role: "img", "aria-label": "status", children: getStatusIcon() }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col", children: [(0, jsx_runtime_1.jsx)("span", { className: `text-sm font-medium ${getStatusColor()}`, children: getStatusMessage() }), healthStatus.lastHeartbeat && ((0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-gray-500", children: ["Last heartbeat: ", formatLastHeartbeat()] }))] })] }));
}
