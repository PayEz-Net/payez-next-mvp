export type RecoveryStep = 'initiate' | 'select-method' | 'verify-code' | 'set-password' | 'complete';
export interface RecoverySession {
    recoveryToken: string;
    email: string;
    maskedEmail?: string;
    maskedPhone?: string;
    hasAuthenticator?: boolean;
    availableMethods: Array<'email' | 'sms' | 'authenticator'>;
    expiresAt: string;
}
export interface PasswordResetToken {
    token: string;
    expiresAt: string;
}
export interface RecoveryError {
    code: string;
    message: string;
    attemptsRemaining?: number;
}
export interface RecoveryInitiateResponse {
    success: boolean;
    data: {
        recovery_session_token?: string;
        masked_email?: string;
        masked_phone?: string;
        has_authenticator?: boolean;
        available_methods?: Array<'email' | 'sms' | 'authenticator'>;
        expires_at?: string;
        message?: string;
    };
}
export interface SendCodeResponse {
    success: boolean;
    data: {
        method: string;
        masked_destination: string;
        code_length: number;
        expires_in: number;
    };
}
export interface VerifyCodeResponse {
    success: boolean;
    data?: {
        password_reset_token: string;
        expires_at: string;
    };
    error?: RecoveryError;
}
