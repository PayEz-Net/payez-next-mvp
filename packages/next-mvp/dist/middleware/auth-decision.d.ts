export interface AuthContext {
    pathname: string;
    isPublicRoute: boolean;
    isLoginPage: boolean;
    searchParams: URLSearchParams;
    sessionPointer: {
        exists: boolean;
        sessionToken?: string;
        expired?: boolean;
        hasRefreshToken?: boolean;
    };
    sessionStatus: {
        exists: boolean | null;
        forceInvalid: boolean | null;
        requires2FA: boolean;
        twoFactorComplete: boolean;
    };
    circuitBreakerOpen: boolean;
}
export type AuthAction = {
    type: 'allow';
} | {
    type: 'redirect';
    location: string;
    reason: string;
    clearCookies?: boolean;
} | {
    type: 'service_error';
    reason: string;
};
export declare function makeAuthDecision(context: AuthContext): AuthAction;
export declare function isLoginPage(pathname: string): boolean;
export declare function getCallbackUrl(pathname: string, searchParams: URLSearchParams): string;
