export interface LoginSession {
    id: number;
    idp_user_id: number;
    email: string;
    name?: string;
    status: 'active' | 'revoked' | 'expired';
    ip_address?: string;
    city?: string;
    region?: string;
    country_code?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    created_at: string;
    last_activity?: string;
    revoked_at?: string;
    revoked_by?: string;
    country_flag?: string;
}
export interface SessionStats {
    totalActive: number;
    totalRevoked: number;
    uniqueUsers: number;
    recentLogins: number;
    byCountryWithFlags: Record<string, {
        count: number;
        flag: string;
    }>;
    byDevice: Record<string, number>;
}
export interface SessionsTabProps {
    isDark?: boolean;
    /** Base API path for sessions (default: /api/admin/sessions) */
    apiBasePath?: string;
}
export declare function SessionsTab({ isDark, apiBasePath }: SessionsTabProps): import("react/jsx-runtime").JSX.Element;
export default SessionsTab;
