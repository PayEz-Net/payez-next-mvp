import { TwoFactorMethod } from '../types/security';
export declare class ApiError extends Error {
    type: string;
    title: string;
    status: number;
    detail?: string;
    traceId?: string;
    errors?: Record<string, string[]>;
    constructor(message: string, details: any);
}
export interface ApiOptions {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    type?: string;
    title?: string;
    status?: number;
    errors?: Record<string, string[]>;
    traceId?: string;
    message?: string;
}
export declare function apiFetch<T>(url: string, options?: ApiOptions): Promise<ApiResponse<T>>;
export declare class AccountApi {
    /**
     * Get masked user info (email, phone, authenticator status)
     * User identification comes from JWT token in Authorization header, not from request body
     */
    getMaskedInfo(accessToken?: string): Promise<{
        maskedEmail: string;
        maskedPhoneNumber: string;
        hasAuthenticator: boolean;
        method?: TwoFactorMethod;
    }>;
    initiateRecovery(email: string): Promise<any>;
    sendRecoveryCode(recoveryToken: string, method: 'email' | 'sms' | 'authenticator'): Promise<any>;
    verifyRecoveryCode(recoveryToken: string, code: string, method: string): Promise<any>;
    resetPasswordWithToken(email: string, resetToken: string, newPassword: string, confirmPassword: string): Promise<any>;
    resetPassword(data: {
        email: string;
        token: string;
        password: string;
        password_confirmation: string;
    }): Promise<any>;
    verifyWelcomeEmail(onboardToken: string, clientKey?: string): Promise<{
        maskedEmail: string;
        maskedPhoneNumber?: string;
        hasAuthenticator?: boolean;
        expiryMinutes: number;
        clientKey: string;
    }>;
    sendOnboardingCode(onboardToken: string, clientKey?: string): Promise<{
        maskedEmail: string;
        maskedPhoneNumber?: string;
        hasAuthenticator?: boolean;
        expiryMinutes: number;
        clientKey: string;
    }>;
    verifyOnboardingCode(onboardToken: string, code: string, clientKey?: string): Promise<{
        success: boolean;
        resetToken: string;
        email: string;
        clientKey: string;
    }>;
    verifyOnboardingSmsCode(onboardToken: string, code: string, clientKey?: string): Promise<{
        success: boolean;
        resetToken: string;
        email: string;
        clientKey: string;
    }>;
    setOnboardingPassword(data: {
        onboardToken: string;
        email: string;
        resetToken: string;
        newPassword: string;
    }, clientKey?: string): Promise<{
        success: boolean;
        message?: string;
    }>;
}
export declare const accountApi: AccountApi;
