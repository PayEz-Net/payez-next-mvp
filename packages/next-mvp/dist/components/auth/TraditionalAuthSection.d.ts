import React from 'react';
interface Props {
    email: string;
    password: string;
    onEmailChange: (email: string) => void;
    onPasswordChange: (password: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading?: boolean;
    buttonText?: string;
    showForgotPassword?: boolean;
    onForgotPassword?: () => void;
}
export declare function TraditionalAuthSection({ email, password, onEmailChange, onPasswordChange, onSubmit, isLoading, buttonText, showForgotPassword, onForgotPassword, }: Props): import("react/jsx-runtime").JSX.Element;
export {};
