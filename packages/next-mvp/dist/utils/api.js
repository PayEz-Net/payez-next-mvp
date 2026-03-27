"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountApi = exports.AccountApi = exports.ApiError = void 0;
exports.apiFetch = apiFetch;
const standardized_client_api_1 = require("../lib/standardized-client-api");
class ApiError extends Error {
    type;
    title;
    status;
    detail;
    traceId;
    errors;
    constructor(message, details) {
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
exports.ApiError = ApiError;
async function apiFetch(url, options = {}) {
    const { method = 'GET', body, headers = {} } = options;
    let finalBody = body;
    const fetchOptions = {
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
        throw new ApiError(raw?.message || 'API Error', raw);
    }
    // --- Universal normalization here ---
    let normalized;
    if (raw && typeof raw === 'object') {
        if ('data' in raw && typeof raw.data === 'object' && raw.data !== null) {
            // Already wrapped
            normalized = { ...raw };
        }
        else {
            // Not wrapped: move all fields except known meta to data
            const { success, error, errors, message, type, title, status, traceId, ...data } = raw;
            normalized = {
                success: typeof success === 'boolean' ? success : true,
                data: data,
                error,
                errors,
                message,
                type,
                title,
                status,
                traceId,
            };
        }
    }
    else {
        normalized = { success: true, data: raw };
    }
    return normalized;
}
// DELETED: apiFetchAuth - Use clientApi from @/lib/client-api instead for proper token refresh handling
// Account API for masked info and 2FA
class AccountApi {
    /**
     * Get masked user info (email, phone, authenticator status)
     * User identification comes from JWT token in Authorization header, not from request body
     */
    async getMaskedInfo(accessToken) {
        // Require authentication for masked info retrieval; do not infer from session or token locally
        if (!accessToken) {
            throw new ApiError('Not authenticated', { status: 401, title: 'Unauthorized' });
        }
        // Authenticated request - proxy through Next API to IDP
        // Empty body: user info comes from JWT token
        const result = await standardized_client_api_1.standardizedApi.post('/api/account/masked-info', {}, accessToken);
        console.log('[DEBUG] getMaskedInfo result:', {
            success: (0, standardized_client_api_1.isApiSuccess)(result),
            hasData: (0, standardized_client_api_1.isApiSuccess)(result) && !!result.data,
            rawData: (0, standardized_client_api_1.isApiSuccess)(result) ? result.data : null,
            dataFields: (0, standardized_client_api_1.isApiSuccess)(result) && result.data ? Object.keys(result.data) : []
        });
        console.log('[DEBUG] getMaskedInfo raw data structure:', JSON.stringify((0, standardized_client_api_1.isApiSuccess)(result) ? result.data : result, null, 2));
        if (!(0, standardized_client_api_1.isApiSuccess)(result)) {
            const errorMessage = (0, standardized_client_api_1.isApiError)(result) ? result.message : 'Failed to get masked info';
            console.error('[DEBUG] getMaskedInfo failed:', result);
            throw new ApiError(errorMessage, result);
        }
        // Use only snake_case fields from backend response
        const d = result.data.data || result.data; // Access the nested data object
        const maskedInfoResult = {
            maskedEmail: d.masked_email ?? '',
            maskedPhoneNumber: d.masked_phone_number ?? '',
            hasAuthenticator: d.has_authenticator ?? false,
            method: d.method
        };
        console.log('[DEBUG] getMaskedInfo result:', maskedInfoResult);
        return maskedInfoResult;
    }
    async initiateRecovery(email) {
        const res = await fetch('/api/account/recovery/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!res.ok)
            throw new Error('Failed to initiate recovery');
        return res.json();
    }
    async sendRecoveryCode(recoveryToken, method) {
        const res = await fetch('/api/account/recovery/send-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${recoveryToken}`
            },
            body: JSON.stringify({ method }),
        });
        if (!res.ok)
            throw new Error('Failed to send recovery code');
        return res.json();
    }
    async verifyRecoveryCode(recoveryToken, code, method) {
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
    async resetPasswordWithToken(email, resetToken, newPassword, confirmPassword) {
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
        if (!res.ok)
            throw new Error('Failed to reset password');
        return res.json();
    }
    async resetPassword(data) {
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
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || (result && result.success === false)) {
            const msg = result?.message || 'Failed to reset password';
            throw new ApiError(msg, result);
        }
        return result;
    }
    // Onboarding flow methods
    async verifyWelcomeEmail(onboardToken, clientKey) {
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
        const data = result.data?.data || result.data || {};
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
    async sendOnboardingCode(onboardToken, clientKey) {
        return this.verifyWelcomeEmail(onboardToken, clientKey);
    }
    async verifyOnboardingCode(onboardToken, code, clientKey) {
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
    async verifyOnboardingSmsCode(onboardToken, code, clientKey) {
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
    async setOnboardingPassword(data, clientKey) {
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
exports.AccountApi = AccountApi;
exports.accountApi = new AccountApi();
