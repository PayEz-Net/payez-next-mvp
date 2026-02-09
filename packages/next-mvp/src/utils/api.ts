import { ENV_CONFIG, API_ENDPOINTS } from '../config/env';
import { TwoFactorMethod } from '../types/security';
import { standardizedApi, isApiSuccess, isApiError, extractApiData } from '../lib/standardized-client-api';

export class ApiError extends Error {
    type: string;
    title: string;
    status: number;
    detail?: string;
    traceId?: string;
    errors?: Record<string, string[]>;

    constructor(message: string, details: any) {
        super(message);
        this.name = 'ApiError';
        this.type = details.type || 'UnknownError';
        this.title = details.title || message;
        this.status = details.status || 500;
        this.detail = details.detail;
        this.traceId = details.traceId;
        this.errors = details.errors;
    }
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

export async function apiFetch<T>(url: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {} } = options;
  let finalBody = body;
    const fetchOptions: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        credentials: 'include',
        ...(finalBody ? { body: JSON.stringify(finalBody) } : {}),
    };

    let res = await fetch(url, fetchOptions);
    // If we get a 401, it may be a transient during server-side token refresh. Retry once after a short delay.
    if (res.status === 401) {
        await new Promise(resolve => setTimeout(resolve, 250));
        res = await fetch(url, fetchOptions);
    }
    const raw = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new ApiError((raw as any)?.message || 'API Error', raw);
    }

    // --- Universal normalization here ---
    let normalized: ApiResponse<T>;
    if (raw && typeof raw === 'object') {
        if ('data' in raw && typeof raw.data === 'object' && raw.data !== null) {
            // Already wrapped
            normalized = { ...raw };
        } else {
            // Not wrapped: move all fields except known meta to data
            const { success, error, errors, message, type, title, status, traceId, ...data } = raw;
            normalized = {
                success: typeof success === 'boolean' ? success : true,
                data: data as T,
                error,
                errors,
                message,
                type,
                title,
                status,
                traceId,
            };
        }
    } else {
        normalized = { success: true, data: raw as T };
    }

    return normalized;
}

// DELETED: apiFetchAuth - Use clientApi from @/lib/client-api instead for proper token refresh handling

// Account API for masked info and 2FA
export class AccountApi {
    /**
     * Get masked user info (email, phone, authenticator status)
     * User identification comes from JWT token in Authorization header, not from request body
     */
    async getMaskedInfo(accessToken?: string): Promise<{
        maskedEmail: string;
        maskedPhoneNumber: string;
        hasAuthenticator: boolean;
        method?: TwoFactorMethod;
    }> {
        // Require authentication for masked info retrieval; do not infer from session or token locally
        if (!accessToken) {
            throw new ApiError('Not authenticated', { status: 401, title: 'Unauthorized' });
        }

        // Authenticated request - proxy through Next API to IDP
        // Empty body: user info comes from JWT token
        const result = await standardizedApi.post<any>('/api/account/masked-info', {}, accessToken);

        console.log('[DEBUG] getMaskedInfo result:', {
            success: isApiSuccess(result),
            hasData: isApiSuccess(result) && !!result.data,
            rawData: isApiSuccess(result) ? result.data : null,
            dataFields: isApiSuccess(result) && result.data ? Object.keys(result.data) : []
        });

        console.log('[DEBUG] getMaskedInfo raw data structure:', JSON.stringify(isApiSuccess(result) ? result.data : result, null, 2));

        if (!isApiSuccess(result)) {
            const errorMessage = isApiError(result) ? result.message : 'Failed to get masked info';
            console.error('[DEBUG] getMaskedInfo failed:', result);
            throw new ApiError(errorMessage, result);
        }
        // Use only snake_case fields from backend response
        const d = result.data.data || result.data; // Access the nested data object
        const maskedInfoResult = {
            maskedEmail: d.masked_email ?? '',
            maskedPhoneNumber: d.masked_phone_number ?? '',
            hasAuthenticator: d.has_authenticator ?? false,
            method: d.method as TwoFactorMethod
        };

        console.log('[DEBUG] getMaskedInfo result:', maskedInfoResult);
        return maskedInfoResult;
    }

    async initiateRecovery(email: string) {
        const res = await fetch('/api/account/recovery/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error('Failed to initiate recovery');
        return res.json();
    }

    async sendRecoveryCode(recoveryToken: string, method: 'email' | 'sms' | 'authenticator') {
        const res = await fetch('/api/account/recovery/send-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${recoveryToken}`
            },
            body: JSON.stringify({ method }),
        });
        if (!res.ok) throw new Error('Failed to send recovery code');
        return res.json();
    }

    async verifyRecoveryCode(recoveryToken: string, code: string, method: string) {
        const res = await fetch('/api/account/recovery/verify-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${recoveryToken}`
            },
            body: JSON.stringify({ code, method }),
        });
        if (!res.ok) {
            const e = await res.json().catch(() => null);
            throw new Error(e?.error?.message || 'Invalid verification code');
        }
        return res.json();
    }

    async resetPasswordWithToken(
        email: string,
        resetToken: string,
        newPassword: string,
        confirmPassword: string
    ) {
        const res = await fetch('/api/account/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password_reset_token: resetToken,
                new_password: newPassword,
                confirm_password: confirmPassword,
            }),
        });
        if (!res.ok) throw new Error('Failed to reset password');
        return res.json();
    }

    async resetPassword(data: { email: string; token: string; password: string; password_confirmation: string }) {
        // Proxy to server API which in turn proxies to IDP
        const res = await fetch('/api/account/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: data.email,
                token: data.token,
                password: data.password,
                password_confirmation: data.password_confirmation
            })
        })
        const result = await res.json().catch(() => ({}))
        if (!res.ok || (result && result.success === false)) {
            const msg = result?.message || 'Failed to reset password'
            throw new ApiError(msg, result)
        }
        return result
    }

    // Onboarding flow methods
    async verifyWelcomeEmail(onboardToken: string, clientKey?: string): Promise<{
        maskedEmail: string;
        maskedPhoneNumber?: string;
        hasAuthenticator?: boolean;
        expiryMinutes: number;
        clientKey: string;
    }> {
        const qs = clientKey ? `?client_id=${encodeURIComponent(clientKey)}` : '';
        console.log('[accountApi.verifyWelcomeEmail] POST /api/onboarding/verify-welcome-email', { qs, onboardTokenLen: onboardToken?.length });
        const res = await fetch(`/api/onboarding/verify-welcome-email${qs}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ onboard_token: onboardToken })
        });
        const result = await res.json().catch(() => ({}));
        console.log('[accountApi.verifyWelcomeEmail] Response status:', res.status, 'body keys:', result && typeof result === 'object' ? Object.keys(result) : typeof result);
        if (!res.ok || (result && result.success === false)) {
            const msg = result?.message || 'Failed to verify welcome email';
            throw new ApiError(msg, result);
        }
        // Extract from nested data structure
        const data = result.data?.data || result.data || {} as any;
        const masked = data.masked_user_info || {};
        return {
            maskedEmail: masked.masked_email || '',
            maskedPhoneNumber: masked.masked_phone_number || '',
            hasAuthenticator: masked.has_authenticator ?? undefined,
            expiryMinutes: data.expiry_minutes || 10,
            clientKey: data.client_key || ''
        };
    }

    // Back-compat alias
    async sendOnboardingCode(onboardToken: string, clientKey?: string) {
        return this.verifyWelcomeEmail(onboardToken, clientKey);
    }

    async verifyOnboardingCode(onboardToken: string, code: string, clientKey?: string): Promise<{
        success: boolean;
        resetToken: string;
        email: string;
        clientKey: string;
    }> {
        const qs = clientKey ? `?clientId=${encodeURIComponent(clientKey)}` : '';
        const res = await fetch(`/api/onboarding/verify-code${qs}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                onboard_token: onboardToken,
                code: code
            })
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || (result && result.success === false)) {
            const msg = result?.message || 'Invalid verification code';
            throw new ApiError(msg, result);
        }
        // Extract from nested data structure
        const data = result.data?.data || result.data || {};
        return {
            success: data.success !== false,
            resetToken: data.reset_token || '',
            email: data.email || '',
            clientKey: data.client_key || ''
        };
    }

    async verifyOnboardingSmsCode(onboardToken: string, code: string, clientKey?: string): Promise<{
        success: boolean;
        resetToken: string;
        email: string;
        clientKey: string;
    }> {
        const qs = clientKey ? `?clientId=${encodeURIComponent(clientKey)}` : '';
        const res = await fetch(`/api/onboarding/verify-sms-code${qs}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                onboard_token: onboardToken,
                code: code
            })
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || (result && result.success === false)) {
            const msg = result?.message || 'Invalid verification code';
            throw new ApiError(msg, result);
        }
        // Extract from nested data structure
        const data = result.data?.data || result.data || {};
        return {
            success: data.success !== false,
            resetToken: data.reset_token || '',
            email: data.email || '',
            clientKey: data.client_key || ''
        };
    }

    async setOnboardingPassword(data: {
        onboardToken: string;
        email: string;
        resetToken: string;
        newPassword: string;
    }, clientKey?: string): Promise<{ success: boolean; message?: string }> {
        const qs = clientKey ? `?clientId=${encodeURIComponent(clientKey)}` : '';
        const res = await fetch(`/api/onboarding/set-password${qs}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                onboard_token: data.onboardToken,
                email: data.email,
                reset_token: data.resetToken,
                new_password: data.newPassword
            })
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || (result && result.success === false)) {
            const msg = result?.message || 'Failed to set password';
            throw new ApiError(msg, result);
        }
        return {
            success: result.success !== false,
            message: result.message || result.data?.message
        };
    }
}

export const accountApi = new AccountApi();

