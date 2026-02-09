import * as signalR from '@microsoft/signalr';

export interface HealthStatus {
  isHealthy: boolean;
  message: string;
  lastHeartbeat: Date | null;
  connectionId: string | null | undefined;
  responseTime?: string;
}

export type HealthStatusCallback = (status: HealthStatus) => void;

/**
 * SignalR-based health service following Occam's Razor principle:
 * - If SignalR connection is alive = Service is working
 * - If SignalR connection is dead = Service is not working
 * - No complex orchestration, just connection state monitoring
 */
class SignalRActivityService {
  private connection: signalR.HubConnection | null = null;
  private subscribers: Set<HealthStatusCallback> = new Set();
  private currentStatus: HealthStatus = {
    isHealthy: false,
    message: 'Disconnected',
    lastHeartbeat: null,
    connectionId: null
  };
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private readonly heartbeatTimeoutMs = 45000; // 45 seconds (server sends every 30s)

  /**
   * Start the health monitoring connection
   * @param idpBaseUrl - The base URL of the IDP server (e.g., 'http://localhost:32785')
   */
  async start(idpBaseUrl: string): Promise<void> {
    // If we already have a connected or connecting connection, don't start again
    if (this.connection &&
        (this.connection.state === signalR.HubConnectionState.Connected ||
         this.connection.state === signalR.HubConnectionState.Connecting)) {
      console.info('[SignalRHealth] Connection already active, skipping start');
      return;
    }

    // Stop existing connection if it exists
    if (this.connection) {
      await this.stop();
    }

    try {
      if (!idpBaseUrl) {
        throw new Error('IDP base URL is required for health monitoring');
      }

      // Construct absolute hub URL safely
      const activityHubUrl = new URL('/healthHub', idpBaseUrl).toString();
      console.info('[SignalRHealth] Using hub URL:', activityHubUrl);

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(activityHubUrl, {
          withCredentials: false,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // More conservative backoff: 5s, 15s, 45s, then stop trying
            const delays = [5000, 15000, 45000];
            if (retryContext.previousRetryCount >= delays.length) {
              return null; // Stop automatic reconnection
            }
            return delays[retryContext.previousRetryCount];
          }
        })
        .configureLogging(signalR.LogLevel.Critical) // Only critical errors, hide connection noise
        .build();

      // Handle connection events
      this.connection.onclose(() => {
        this.updateStatus({
          isHealthy: false,
          message: 'Service unavailable',
          lastHeartbeat: null,
          connectionId: null
        });
        this.clearHeartbeatTimeout();
      });

      this.connection.onreconnecting(() => {
        this.updateStatus({
          isHealthy: false,
          message: 'Service unavailable',
          lastHeartbeat: this.currentStatus.lastHeartbeat,
          connectionId: null
        });
      });

      this.connection.onreconnected((connectionId) => {
        this.updateStatus({
          isHealthy: true,
          message: 'Service operational',
          lastHeartbeat: new Date(),
          connectionId
        });
        this.resetHeartbeatTimeout();
      });

      // Handle heartbeat messages - this is the core health indicator
      this.connection.on('Heartbeat', (data) => {
        this.updateStatus({
          isHealthy: true,
          message: 'Service operational',
          lastHeartbeat: new Date(),
          connectionId: this.connection?.connectionId || null
        });
        this.resetHeartbeatTimeout();
      });

      // Handle initial health status
      this.connection.on('HealthStatus', (data) => {
        this.updateStatus({
          isHealthy: data.status === 'healthy',
          message: data.message || 'Service connected',
          lastHeartbeat: new Date(),
          connectionId: this.connection?.connectionId || null
        });
        this.resetHeartbeatTimeout();
      });

      // Start the connection
      await this.connection.start();
      console.info('[SignalRHealth] Connection started, connectionId:', this.connection.connectionId);

      this.updateStatus({
        isHealthy: true,
        message: 'Service connected',
        lastHeartbeat: new Date(),
        connectionId: this.connection.connectionId
      });

      this.resetHeartbeatTimeout();

    } catch (error) {
      // Reduce console noise for expected connection failures
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('[SignalRHealth] Connection start failed:', errorMessage);
      const isConnectionRefused = errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                                 errorMessage.includes('Failed to fetch') ||
                                 errorMessage.includes('Failed to complete negotiation');

      if (isConnectionRefused) {
        // Service is down - this is expected, log at info level
        console.info('SignalR Health Service: Backend service unavailable');
      } else {
        // Unexpected error - log as error
        console.error('SignalR Health Service failed to start:', error);
      }

      this.updateStatus({
        isHealthy: false,
        message: 'Service unavailable',
        lastHeartbeat: null,
        connectionId: null
      });
    }
  }

  /**
   * Stop the health monitoring connection
   */
  async stop(): Promise<void> {
    this.clearHeartbeatTimeout();

    if (this.connection) {
      try {
        // Check if connection is in a state that can be stopped
        if (this.connection.state !== signalR.HubConnectionState.Disconnected) {
          await this.connection.stop();
        }
      } catch (error) {
        // Ignore "connection was stopped before the hub handshake could complete" errors
        // as these are expected during rapid start/stop cycles
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('stopped before the hub handshake could complete')) {
          console.error('Error stopping SignalR health connection:', error);
        }
      }
      this.connection = null;
    }

    this.updateStatus({
      isHealthy: false,
      message: 'Disconnected',
      lastHeartbeat: null,
      connectionId: null
    });
  }

  /**
   * Subscribe to health status changes
   */
  subscribe(callback: HealthStatusCallback): () => void {
    this.subscribers.add(callback);

    // Immediately notify with current status
    callback(this.currentStatus);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get current health status
   */
  getCurrentStatus(): HealthStatus {
    return { ...this.currentStatus };
  }

  private updateStatus(newStatus: HealthStatus): void {
    this.currentStatus = newStatus;
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.currentStatus);
      } catch (error) {
        console.error('Error in health status subscriber:', error);
      }
    });
  }

  private resetHeartbeatTimeout(): void {
    this.clearHeartbeatTimeout();

    // If we don't receive a heartbeat within the timeout period, consider service unhealthy
    this.heartbeatTimeout = setTimeout(() => {
      this.updateStatus({
        isHealthy: false,
        message: 'Service unavailable',
        lastHeartbeat: this.currentStatus.lastHeartbeat,
        connectionId: this.currentStatus.connectionId
      });
    }, this.heartbeatTimeoutMs);
  }

  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

}

// Export singleton instance
export const signalRActivityService = new SignalRActivityService();
