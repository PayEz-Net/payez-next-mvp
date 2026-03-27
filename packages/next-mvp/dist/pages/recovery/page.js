"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RecoveryPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const api_1 = require("../../utils/api");
const InitiateRecoveryStep_1 = require("../../components/recovery/InitiateRecoveryStep");
const SelectMethodStep_1 = require("../../components/recovery/SelectMethodStep");
const VerifyCodeStep_1 = require("../../components/recovery/VerifyCodeStep");
const SetPasswordStep_1 = require("../../components/recovery/SetPasswordStep");
const CompleteStep_1 = require("../../components/recovery/CompleteStep");
const useTheme_1 = require("../../theme/useTheme");
function RecoveryContent() {
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const prefilledEmail = searchParams?.get('email') || '';
    const colors = (0, useTheme_1.useColors)();
    const [currentStep, setCurrentStep] = (0, react_1.useState)('initiate');
    const [email, setEmail] = (0, react_1.useState)(prefilledEmail);
    const [recoverySession, setRecoverySession] = (0, react_1.useState)(null);
    const [selectedMethod, setSelectedMethod] = (0, react_1.useState)(null);
    const [verificationCode, setVerificationCode] = (0, react_1.useState)('');
    const [passwordResetToken, setPasswordResetToken] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const handleInitiateRecovery = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api_1.accountApi.initiateRecovery(email);
            if (response.success && response.data.recovery_session_token) {
                setRecoverySession({
                    recoveryToken: response.data.recovery_session_token,
                    email: email,
                    maskedEmail: response.data.masked_email,
                    maskedPhone: response.data.masked_phone,
                    hasAuthenticator: response.data.has_authenticator,
                    availableMethods: response.data.available_methods || [],
                    expiresAt: response.data.expires_at || ''
                });
                setCurrentStep('select-method');
            }
            else {
                setCurrentStep('complete');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to initiate recovery. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSendCode = async (method) => {
        if (!recoverySession)
            return;
        setLoading(true);
        setError(null);
        setSelectedMethod(method);
        try {
            const response = await api_1.accountApi.sendRecoveryCode(recoverySession.recoveryToken, method);
            if (response.success) {
                setCurrentStep('verify-code');
            }
            else {
                setError('Failed to send verification code. Please try again.');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send verification code.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleVerifyCode = async () => {
        if (!recoverySession || !selectedMethod)
            return;
        setLoading(true);
        setError(null);
        try {
            const response = await api_1.accountApi.verifyRecoveryCode(recoverySession.recoveryToken, verificationCode, selectedMethod);
            if (response.success && response.data) {
                setPasswordResetToken({
                    token: response.data.password_reset_token,
                    expiresAt: response.data.expires_at
                });
                setCurrentStep('set-password');
            }
            else {
                setError(response.error?.message || 'Invalid verification code');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify code.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleResetPassword = async (password, confirmPassword) => {
        if (!passwordResetToken || !recoverySession)
            return;
        setLoading(true);
        setError(null);
        try {
            const response = await api_1.accountApi.resetPasswordWithToken(recoverySession.email, passwordResetToken.token, password, confirmPassword);
            if (response.success) {
                setCurrentStep('complete');
            }
            else {
                setError('Failed to reset password. Please try again.');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset password.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleGoBack = () => {
        if (currentStep === 'select-method')
            setCurrentStep('initiate');
        else if (currentStep === 'verify-code')
            setCurrentStep('select-method');
        else if (currentStep === 'set-password')
            setCurrentStep('verify-code');
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "w-full flex items-center justify-center p-6", style: { background: 'var(--bg-default)' }, children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-md w-full", children: [error && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 bg-red-50 border border-red-200 rounded-2xl p-3", children: (0, jsx_runtime_1.jsx)("p", { className: "text-red-700 text-sm", children: error }) })), loading && ((0, jsx_runtime_1.jsx)("div", { className: "mb-4 rounded-2xl p-3", style: { background: 'var(--bg-card)', borderColor: 'var(--border-default)' }, children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm", style: { color: 'var(--text-secondary)' }, children: "Processing..." }) })), currentStep === 'initiate' && ((0, jsx_runtime_1.jsx)(InitiateRecoveryStep_1.InitiateRecoveryStep, { email: email, setEmail: setEmail, onSubmit: handleInitiateRecovery, loading: loading })), currentStep === 'select-method' && recoverySession && ((0, jsx_runtime_1.jsx)(SelectMethodStep_1.SelectMethodStep, { session: recoverySession, onSelectMethod: handleSendCode, loading: loading })), currentStep === 'verify-code' && ((0, jsx_runtime_1.jsx)(VerifyCodeStep_1.VerifyCodeStep, { code: verificationCode, setCode: setVerificationCode, onSubmit: handleVerifyCode, onResend: () => selectedMethod && handleSendCode(selectedMethod), loading: loading, maskedDestination: selectedMethod === 'sms'
                        ? recoverySession?.maskedPhone
                        : recoverySession?.maskedEmail })), currentStep === 'set-password' && ((0, jsx_runtime_1.jsx)(SetPasswordStep_1.SetPasswordStep, { onSubmit: handleResetPassword, loading: loading })), currentStep === 'complete' && ((0, jsx_runtime_1.jsx)(CompleteStep_1.CompleteStep, { onGoToLogin: () => router.push('/account-auth/login') })), currentStep !== 'complete' && currentStep !== 'initiate' && !loading && ((0, jsx_runtime_1.jsx)("div", { className: "mt-6 text-center", children: (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleGoBack, className: "text-sm hover:underline font-medium", style: { color: 'var(--text-primary)' }, children: "\u2190 Go Back" }) }))] }) }));
}
function LoadingFallback() {
    const colors = (0, useTheme_1.useColors)();
    return ((0, jsx_runtime_1.jsx)("div", { className: "w-full flex items-center justify-center", style: { background: 'var(--bg-default)' }, children: (0, jsx_runtime_1.jsx)("div", { className: "border rounded-2xl p-8", style: { background: 'var(--bg-card)', borderColor: 'var(--border-default)' }, children: (0, jsx_runtime_1.jsx)("p", { style: { color: 'var(--text-muted)' }, children: "Loading..." }) }) }));
}
function RecoveryPage() {
    return ((0, jsx_runtime_1.jsx)(react_1.Suspense, { fallback: (0, jsx_runtime_1.jsx)(LoadingFallback, {}), children: (0, jsx_runtime_1.jsx)(RecoveryContent, {}) }));
}
