import { ApiResult } from '../lib/standardized-client-api';
export interface CustomSession {
    user: {
        id: string;
        email: string;
        roles?: string[];
        twoFactorMethod?: string;
        twoFactorSessionVerified?: boolean;
        requiresTwoFactor?: boolean;
    };
    accessToken?: string;
    refreshToken?: string;
    expires: string;
    error?: string;
}
export interface UseAuthResult {
    session: CustomSession | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    isLoading: boolean;
    isAuthenticated: boolean;
    apiCall: <T>(url: string, method?: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any) => Promise<ApiResult<T>>;
}
export declare function useAuth(): UseAuthResult;
