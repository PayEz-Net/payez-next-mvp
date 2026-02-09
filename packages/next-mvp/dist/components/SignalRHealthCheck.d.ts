interface SignalRHealthCheckProps {
    className?: string;
    idpBaseUrl: string;
}
/**
 * Simple health check component using SignalR connection state
 * Following Occam's Razor: Connection alive = Service healthy, Connection dead = Service unhealthy
 */
export default function SignalRHealthCheck({ className, idpBaseUrl }: SignalRHealthCheckProps): import("react/jsx-runtime").JSX.Element | null;
export {};
