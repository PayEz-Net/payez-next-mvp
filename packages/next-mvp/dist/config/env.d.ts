export declare const ENV_CONFIG: {
    readonly CLIENT_ID: string | undefined;
    readonly INTERNAL_URL: string | undefined;
    readonly IDP_CLIENT_ID: number | undefined;
    readonly IDP_URL: string | undefined;
    readonly API_URL: string | undefined;
    readonly PAYEZ_CORE_BASE_URL: string | undefined;
    readonly SUPPORT_EMAIL: "support@PayEz.net";
    readonly LOG_LEVEL: string;
    readonly LOG_CONSOLE: boolean;
    readonly GRAYLOG_HOST: string;
    readonly GRAYLOG_PORT: number;
    readonly REDIS_KEY_PREFIX: string;
    readonly LOGOUT_REDIRECT_URL: string;
    readonly UNAUTHENTICATED_REDIRECT_URL: string;
};
export declare const API_ENDPOINTS: {
    readonly account: {
        readonly profile: "/api/account/profile";
        readonly updateProfile: "/api/account/profile";
        readonly maskedInfo: "/api/account/masked-info";
        readonly sendResetCode: "/api/account/send-reset-code";
        readonly verifyResetCode: "/api/account/verify-reset-code";
        readonly resetPassword: "/api/account/reset-password";
        readonly changePassword: "/api/account/change-password";
        readonly validatePassword: "/api/account/validate-password";
    };
    readonly externalAuth: {
        readonly login: "/api/ExternalAuth/login";
        readonly refresh: "/api/ExternalAuth/refresh";
        readonly validate: "/api/ExternalAuth/validate";
        readonly verifyCode: "/api/ExternalAuth/verify-code";
        readonly revoke: "/api/ExternalAuth/revoke";
        readonly roles: (username: string) => string;
        readonly jwks: "/api/ExternalAuth/.well-known/jwks.json";
        readonly openidConfig: "/api/ExternalAuth/.well-known/openid-configuration";
        readonly passwordless: {
            readonly sms: {
                readonly start: "/api/ExternalAuth/passwordless/sms/start";
                readonly login: "/api/ExternalAuth/passwordless/sms/login";
                readonly resend: "/api/ExternalAuth/passwordless/sms/resend";
            };
            readonly email: {
                readonly start: "/api/ExternalAuth/passwordless/email/start";
                readonly login: "/api/ExternalAuth/passwordless/email/login";
                readonly resend: "/api/ExternalAuth/passwordless/email/resend";
            };
        };
        readonly lead: {
            readonly registration: "/api/ExternalAuth/lead/registration";
            readonly verify: "/api/ExternalAuth/lead/verify";
        };
    };
    readonly progressiveAuth: {
        readonly step1: "/api/ProgressiveAuth/step1";
        readonly step2: "/api/ProgressiveAuth/step2";
        readonly step3: "/api/ProgressiveAuth/step3";
        readonly step4: "/api/ProgressiveAuth/step4";
        readonly step5: "/api/ProgressiveAuth/step5";
        readonly verifyEmail: "/api/ProgressiveAuth/verify-email";
    };
    readonly azureAuth: {
        readonly login: "/auth/azure/login";
        readonly logout: "/auth/azure/logout";
    };
};
