'use client';

import { useEffect, useState } from 'react';
import { signalRActivityService, type HealthStatus } from '../services/signalrActivityService';

interface SignalRHealthCheckProps {
  className?: string;
  idpBaseUrl: string;
}

/**
 * Simple health check component using SignalR connection state
 * Following Occam's Razor: Connection alive = Service healthy, Connection dead = Service unhealthy
 */
export default function SignalRHealthCheck({ className = '', idpBaseUrl }: SignalRHealthCheckProps) {
  // Allow disabling via env for noisy environments (e.g., production demos)
  if (process.env.NEXT_PUBLIC_DISABLE_HEALTH_MONITOR === 'true') {
    return null;
  }

  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    isHealthy: false,
    message: 'Initializing...',
    lastHeartbeat: null,
    connectionId: null
  });
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeHealthService = async () => {
      try {
        // Subscribe to health status changes
        unsubscribe = signalRActivityService.subscribe((status) => {
          setHealthStatus(status);
          setIsInitializing(false);
        });

        // Start the health monitoring
        await signalRActivityService.start(idpBaseUrl);
      } catch (error) {
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
        } else {
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
    if (isInitializing) return 'text-yellow-600';
    return healthStatus.isHealthy ? 'text-green-600' : 'text-orange-600'; // Orange instead of alarming red
  };

  const getStatusIcon = () => {
    if (isInitializing) return '🔄';
    return healthStatus.isHealthy ? '✅' : '🔶'; // Orange diamond instead of scary red X
  };

  const getStatusMessage = () => {
    if (isInitializing) return 'Connecting to service...';
    return healthStatus.message;
  };

  const formatLastHeartbeat = () => {
    if (!healthStatus.lastHeartbeat) return null;
    const now = new Date();
    const diff = Math.floor((now.getTime() - healthStatus.lastHeartbeat.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-lg" role="img" aria-label="status">
        {getStatusIcon()}
      </span>

      <div className="flex flex-col">
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusMessage()}
        </span>

        {healthStatus.lastHeartbeat && (
          <span className="text-xs text-gray-500">
            Last heartbeat: {formatLastHeartbeat()}
          </span>
        )}

        {/* Uncomment for SignalR debugging:
        {process.env.NODE_ENV === 'development' && healthStatus.connectionId && (
          <span className="text-xs text-gray-400 font-mono">
            Connection: {healthStatus.connectionId.substring(0, 8)}...
          </span>
        )}
        */}
      </div>
    </div>
  );
}
