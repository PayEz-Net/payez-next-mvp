"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeAwareLoginPage = ModeAwareLoginPage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const AuthContext_1 = require("../../client/AuthContext");
const FederatedAuthSection_1 = require("./FederatedAuthSection");
const TraditionalAuthSection_1 = require("./TraditionalAuthSection");
function ModeAwareLoginPage({ onFederatedSignIn, onTraditionalSignIn, onForgotPassword, isLoading = false, error = null, }) {
    const config = (0, AuthContext_1.useAuthConfig)();
    const [email, setEmail] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [localLoading, setLocalLoading] = (0, react_1.useState)(false);
    const handleFederatedClick = (provider) => {
        onFederatedSignIn?.(provider);
    };
    const handleTraditionalSubmit = async (e) => {
        e.preventDefault();
        if (!onTraditionalSignIn)
            return;
        setLocalLoading(true);
        try {
            await onTraditionalSignIn(email, password);
        }
        finally {
            setLocalLoading(false);
        }
    };
    const isFederated = config.mode === 'federated';
    const isTraditional = config.mode === 'traditional';
    const totalLoading = isLoading || localLoading;
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [error && ((0, jsx_runtime_1.jsx)("div", { className: "mb-6 px-4 py-3 rounded-lg", style: {
                    background: 'var(--color-error, #ef4444)',
                    color: 'white',
                }, children: error })), isFederated && ((0, jsx_runtime_1.jsx)(FederatedAuthSection_1.FederatedAuthSection, { providers: config.providers, onProviderClick: handleFederatedClick, isLoading: totalLoading })), isTraditional && ((0, jsx_runtime_1.jsx)(TraditionalAuthSection_1.TraditionalAuthSection, { email: email, password: password, onEmailChange: setEmail, onPasswordChange: setPassword, onSubmit: handleTraditionalSubmit, isLoading: totalLoading, buttonText: "Sign In", showForgotPassword: config.enableRecovery, onForgotPassword: onForgotPassword })), isFederated === false && isTraditional === false && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(FederatedAuthSection_1.FederatedAuthSection, { providers: config.providers, onProviderClick: handleFederatedClick, isLoading: totalLoading }), config.providers.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "relative my-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "absolute inset-0 flex items-center", children: (0, jsx_runtime_1.jsx)("div", { className: "w-full", style: {
                                        borderTop: '1px solid var(--border-default)',
                                    } }) }), (0, jsx_runtime_1.jsx)("div", { className: "relative flex justify-center text-sm", children: (0, jsx_runtime_1.jsx)("span", { className: "px-2", style: {
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-secondary)',
                                    }, children: "Or sign in with email" }) })] })), (0, jsx_runtime_1.jsx)(TraditionalAuthSection_1.TraditionalAuthSection, { email: email, password: password, onEmailChange: setEmail, onPasswordChange: setPassword, onSubmit: handleTraditionalSubmit, isLoading: totalLoading, buttonText: "Sign In", showForgotPassword: config.enableRecovery, onForgotPassword: onForgotPassword })] }))] }));
}
