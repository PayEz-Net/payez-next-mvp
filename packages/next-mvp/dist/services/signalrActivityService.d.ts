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
declare class SignalRActivityService {
    private connection;
    private subscribers;
    private currentStatus;
    private heartbeatTimeout;
    private readonly heartbeatTimeoutMs;
    /**
     * Start the health monitoring connection
     * @param idpBaseUrl - The base URL of the IDP server (e.g., 'http://localhost:32785')
     */
    start(idpBaseUrl: string): Promise<void>;
    /**
     * Stop the health monitoring connection
     */
    stop(): Promise<void>;
    /**
     * Subscribe to health status changes
     */
    subscribe(callback: HealthStatusCallback): () => void;
    /**
     * Get current health status
     */
    getCurrentStatus(): HealthStatus;
    private updateStatus;
    private notifySubscribers;
    private resetHeartbeatTimeout;
    private clearHeartbeatTimeout;
}
export declare const signalRActivityService: SignalRActivityService;
export {};
