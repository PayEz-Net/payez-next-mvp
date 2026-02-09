"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ENDPOINTS = exports.ENV_CONFIG = void 0;
exports.ENV_CONFIG = {
    CLIENT_ID: process.env.CLIENT_ID,
    INTERNAL_URL: process.env.IDP_URL,
    IDP_CLIENT_ID: (() => { const raw = process.env.NEXT_PUBLIC_IDP_CLIENT_ID || process.env.IDP_CLIENT_ID; const n = raw ? parseInt(raw, 10) : undefined; return Number.isFinite(n) ? n : undefined; })(),
    IDP_URL: process.env.IDP_URL,
    API_URL: process.env.IDP_URL,
    PAYEZ_CORE_BASE_URL: process.env.NEXT_PUBLIC_PAYEZ_CORE_BASE_URL,
    SUPPORT_EMAIL: 'support@PayEz.net',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_CONSOLE: process.env.LOG_CONSOLE === 'true' || process.env.NODE_ENV === 'development',
    GRAYLOG_HOST: process.env.GRAYLOG_HOST || '10.6.10.5',
    GRAYLOG_PORT: parseInt(process.env.GRAYLOG_PORT || '12201'),
    // Redis key prefix for multi-tenant session isolation
    // Each application should have a unique prefix to prevent session conflicts
    // Example: 'cryptaply:', 'website-membership:', 'myapp:'
    // Leave empty ('') for backward compatibility
    REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX || '',
    // Redirect URLs - configurable per-tenant
    // LOGOUT_REDIRECT_URL: Where to redirect after logout (default: '/')
    // UNAUTHENTICATED_REDIRECT_URL: Where to redirect unauthenticated users from root (default: '/account-auth/login')
    LOGOUT_REDIRECT_URL: process.env.LOGOUT_REDIRECT_URL || '/',
    UNAUTHENTICATED_REDIRECT_URL: process.env.UNAUTHENTICATED_REDIRECT_URL || '/account-auth/login',
};
exports.API_ENDPOINTS = {
    account: {
        profile: '/api/account/profile',
        updateProfile: '/api/account/profile',
        maskedInfo: '/api/account/masked-info',
        sendResetCode: '/api/account/send-reset-code',
        verifyResetCode: '/api/account/verify-reset-code',
        resetPassword: '/api/account/reset-password',
        changePassword: '/api/account/change-password',
        validatePassword: '/api/account/validate-password'
    },
    externalAuth: {
        login: '/api/ExternalAuth/login',
        refresh: '/api/ExternalAuth/refresh',
        validate: '/api/ExternalAuth/validate',
        verifyCode: '/api/ExternalAuth/verify-code',
        revoke: '/api/ExternalAuth/revoke',
        roles: (username) => `/api/ExternalAuth/roles/${username}`,
        jwks: '/api/ExternalAuth/.well-known/jwks.json',
        openidConfig: '/api/ExternalAuth/.well-known/openid-configuration',
        passwordless: {
            sms: { start: '/api/ExternalAuth/passwordless/sms/start', login: '/api/ExternalAuth/passwordless/sms/login', resend: '/api/ExternalAuth/passwordless/sms/resend' },
            email: { start: '/api/ExternalAuth/passwordless/email/start', login: '/api/ExternalAuth/passwordless/email/login', resend: '/api/ExternalAuth/passwordless/email/resend' }
        },
        lead: { registration: '/api/ExternalAuth/lead/registration', verify: '/api/ExternalAuth/lead/verify' }
    },
    progressiveAuth: {
        step1: '/api/ProgressiveAuth/step1', step2: '/api/ProgressiveAuth/step2', step3: '/api/ProgressiveAuth/step3', step4: '/api/ProgressiveAuth/step4', step5: '/api/ProgressiveAuth/step5', verifyEmail: '/api/ProgressiveAuth/verify-email'
    },
    azureAuth: { login: '/auth/azure/login', logout: '/auth/azure/logout' }
};
