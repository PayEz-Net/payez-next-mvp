/**
 * Better Auth Client (Phase 3)
 *
 * Drop-in replacement for next-auth/react hooks and functions.
 * Import from '@payez/next-mvp/client/better-auth-client'.
 *
 * Includes useSessionCompat() — returns NextAuth-shaped { data, status }
 * so existing components don't need destructure pattern changes.
 */
export declare const authClient: {
    signIn: {
        social: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
            provider: (string & {}) | "linear" | "huggingface" | "github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "railway" | "vercel" | "wechat";
            callbackURL?: string | undefined;
            newUserCallbackURL?: string | undefined;
            errorCallbackURL?: string | undefined;
            disableRedirect?: boolean | undefined;
            idToken?: {
                token: string;
                nonce?: string | undefined;
                accessToken?: string | undefined;
                refreshToken?: string | undefined;
                expiresAt?: number | undefined;
                user?: {
                    name?: {
                        firstName?: string | undefined;
                        lastName?: string | undefined;
                    } | undefined;
                    email?: string | undefined;
                } | undefined;
            } | undefined;
            scopes?: string[] | undefined;
            requestSignUp?: boolean | undefined;
            loginHint?: string | undefined;
            additionalData?: Record<string, any> | undefined;
        }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
            provider: (string & {}) | "linear" | "huggingface" | "github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "railway" | "vercel" | "wechat";
            callbackURL?: string | undefined;
            newUserCallbackURL?: string | undefined;
            errorCallbackURL?: string | undefined;
            disableRedirect?: boolean | undefined;
            idToken?: {
                token: string;
                nonce?: string | undefined;
                accessToken?: string | undefined;
                refreshToken?: string | undefined;
                expiresAt?: number | undefined;
                user?: {
                    name?: {
                        firstName?: string | undefined;
                        lastName?: string | undefined;
                    } | undefined;
                    email?: string | undefined;
                } | undefined;
            } | undefined;
            scopes?: string[] | undefined;
            requestSignUp?: boolean | undefined;
            loginHint?: string | undefined;
            additionalData?: Record<string, any> | undefined;
        } & {
            fetchOptions?: FetchOptions | undefined;
        }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
            redirect: boolean;
            url: string;
        } | (Omit<{
            redirect: boolean;
            token: string;
            url: undefined;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            };
        }, "user"> & {
            user: import("better-auth/react").StripEmptyObjects<{
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined;
            }>;
        }), {
            code?: string | undefined;
            message?: string | undefined;
        }, FetchOptions["throw"] extends true ? true : false>>;
    };
} & {
    signOut: <FetchOptions extends import("@better-auth/core").ClientFetchOption<never, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth/react").Prettify<{
        query?: Record<string, any> | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        success: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    signUp: {
        email: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
            name: string;
            email: string;
            password: string;
            image?: string | undefined;
            callbackURL?: string | undefined;
            rememberMe?: boolean | undefined;
        }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
            email: string;
            name: string;
            password: string;
            image?: string | undefined;
            callbackURL?: string | undefined;
            fetchOptions?: FetchOptions | undefined;
        }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<(Omit<{
            token: null;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            };
        }, "user"> & {
            user: import("better-auth/react").StripEmptyObjects<{
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined;
            }>;
        }) | (Omit<{
            token: string;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            };
        }, "user"> & {
            user: import("better-auth/react").StripEmptyObjects<{
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined;
            }>;
        }), {
            code?: string | undefined;
            message?: string | undefined;
        }, FetchOptions["throw"] extends true ? true : false>>;
    };
} & {
    signIn: {
        email: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
            email: string;
            password: string;
            callbackURL?: string | undefined;
            rememberMe?: boolean | undefined;
        }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
            email: string;
            password: string;
            callbackURL?: string | undefined;
            rememberMe?: boolean | undefined;
        } & {
            fetchOptions?: FetchOptions | undefined;
        }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<Omit<{
            redirect: boolean;
            token: string;
            url?: string | undefined;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined | undefined;
            };
        }, "user"> & {
            user: import("better-auth/react").StripEmptyObjects<{
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined;
            }>;
        }, {
            code?: string | undefined;
            message?: string | undefined;
        }, FetchOptions["throw"] extends true ? true : false>>;
    };
} & {
    resetPassword: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        newPassword: string;
        token?: string | undefined;
    }> & Record<string, any>, Partial<{
        token?: string | undefined;
    }> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        newPassword: string;
        token?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    verifyEmail: <FetchOptions extends import("@better-auth/core").ClientFetchOption<never, Partial<{
        token: string;
        callbackURL?: string | undefined;
    }> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        query: {
            token: string;
            callbackURL?: string | undefined;
        };
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<NonNullable<void | {
        status: boolean;
    }>, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    sendVerificationEmail: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        email: string;
        callbackURL?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        email: string;
        callbackURL?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    changeEmail: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        newEmail: string;
        callbackURL?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        newEmail: string;
        callbackURL?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    changePassword: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        newPassword: string;
        currentPassword: string;
        revokeOtherSessions?: boolean | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        newPassword: string;
        currentPassword: string;
        revokeOtherSessions?: boolean | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<Omit<{
        token: string | null;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        } & Record<string, any> & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        };
    }, "user"> & {
        user: import("better-auth/react").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        }>;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    updateSession: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<Partial<{}>> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth/react").Prettify<Partial<{}> & {
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        session: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined;
            userAgent?: string | null | undefined;
        };
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    updateUser: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<Partial<{}> & {
        name?: string | undefined;
        image?: string | undefined | null;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth/react").Prettify<import("better-auth/dist/client/path-to-object.mjs").InferUserUpdateCtx<{}, FetchOptions>> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    deleteUser: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        callbackURL?: string | undefined;
        password?: string | undefined;
        token?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth/react").Prettify<{
        callbackURL?: string | undefined;
        password?: string | undefined;
        token?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        success: boolean;
        message: string;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    requestPasswordReset: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        email: string;
        redirectTo?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        email: string;
        redirectTo?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
        message: string;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    resetPassword: {
        ":token": <FetchOptions extends import("@better-auth/core").ClientFetchOption<never, Partial<{
            callbackURL: string;
        }> & Record<string, any>, {
            token: string;
        }>>(data_0: import("better-auth/react").Prettify<{
            query: {
                callbackURL: string;
            };
            fetchOptions?: FetchOptions | undefined;
        }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<never, {
            code?: string | undefined;
            message?: string | undefined;
        }, FetchOptions["throw"] extends true ? true : false>>;
    };
} & {
    listSessions: <FetchOptions extends import("@better-auth/core").ClientFetchOption<never, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth/react").Prettify<{
        query?: Record<string, any> | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<import("better-auth/react").Prettify<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        expiresAt: Date;
        token: string;
        ipAddress?: string | null | undefined | undefined;
        userAgent?: string | null | undefined | undefined;
    }>[], {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    revokeSession: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        token: string;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        token: string;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    revokeSessions: <FetchOptions extends import("@better-auth/core").ClientFetchOption<never, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth/react").Prettify<{
        query?: Record<string, any> | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    revokeOtherSessions: <FetchOptions extends import("@better-auth/core").ClientFetchOption<never, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth/react").Prettify<{
        query?: Record<string, any> | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    linkSocial: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        provider: unknown;
        callbackURL?: string | undefined;
        idToken?: {
            token: string;
            nonce?: string | undefined;
            accessToken?: string | undefined;
            refreshToken?: string | undefined;
            scopes?: string[] | undefined;
        } | undefined;
        requestSignUp?: boolean | undefined;
        scopes?: string[] | undefined;
        errorCallbackURL?: string | undefined;
        disableRedirect?: boolean | undefined;
        additionalData?: Record<string, any> | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        provider: unknown;
        callbackURL?: string | undefined;
        idToken?: {
            token: string;
            nonce?: string | undefined;
            accessToken?: string | undefined;
            refreshToken?: string | undefined;
            scopes?: string[] | undefined;
        } | undefined;
        requestSignUp?: boolean | undefined;
        scopes?: string[] | undefined;
        errorCallbackURL?: string | undefined;
        disableRedirect?: boolean | undefined;
        additionalData?: Record<string, any> | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        url: string;
        redirect: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    listAccounts: <FetchOptions extends import("@better-auth/core").ClientFetchOption<never, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth/react").Prettify<{
        query?: Record<string, any> | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        scopes: string[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        providerId: string;
        accountId: string;
    }[], {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    deleteUser: {
        callback: <FetchOptions extends import("@better-auth/core").ClientFetchOption<never, Partial<{
            token: string;
            callbackURL?: string | undefined;
        }> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
            query: {
                token: string;
                callbackURL?: string | undefined;
            };
            fetchOptions?: FetchOptions | undefined;
        }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
            success: boolean;
            message: string;
        }, {
            code?: string | undefined;
            message?: string | undefined;
        }, FetchOptions["throw"] extends true ? true : false>>;
    };
} & {
    unlinkAccount: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        providerId: string;
        accountId?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        providerId: string;
        accountId?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        status: boolean;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    refreshToken: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        providerId: string;
        accountId?: string | undefined;
        userId?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        providerId: string;
        accountId?: string | undefined;
        userId?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        accessToken: string | undefined;
        refreshToken: string;
        accessTokenExpiresAt: Date | undefined;
        refreshTokenExpiresAt: Date | null | undefined;
        scope: string | null | undefined;
        idToken: string | null | undefined;
        providerId: string;
        accountId: string;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    getAccessToken: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        providerId: string;
        accountId?: string | undefined;
        userId?: string | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        providerId: string;
        accountId?: string | undefined;
        userId?: string | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        accessToken: string;
        accessTokenExpiresAt: Date | undefined;
        scopes: string[];
        idToken: string | undefined;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    accountInfo: <FetchOptions extends import("@better-auth/core").ClientFetchOption<never, Partial<{
        accountId?: string | undefined;
    }> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth/react").Prettify<{
        query?: {
            accountId?: string | undefined;
        } | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        user: import("better-auth/*").OAuth2UserInfo;
        data: Record<string, any>;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    getSession: <FetchOptions extends import("@better-auth/core").ClientFetchOption<never, Partial<{
        disableCookieCache?: unknown;
        disableRefresh?: unknown;
    }> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth/react").Prettify<{
        query?: {
            disableCookieCache?: unknown;
            disableRefresh?: unknown;
        } | undefined;
        fetchOptions?: FetchOptions | undefined;
    }> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        user: import("better-auth/react").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        }>;
        session: import("better-auth/react").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined;
            userAgent?: string | null | undefined;
        }>;
    } | null, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    useSession: () => {
        data: {
            user: import("better-auth/react").StripEmptyObjects<{
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined;
            }>;
            session: import("better-auth/react").StripEmptyObjects<{
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined;
                userAgent?: string | null | undefined;
            }>;
        } | null;
        isPending: boolean;
        isRefetching: boolean;
        error: import("@better-fetch/fetch").BetterFetchError | null;
        refetch: (queryParams?: {
            query?: import("better-auth/types").SessionQueryParams;
        } | undefined) => Promise<void>;
    };
    $Infer: {
        Session: {
            user: import("better-auth/react").StripEmptyObjects<{
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                emailVerified: boolean;
                name: string;
                image?: string | null | undefined;
            }>;
            session: import("better-auth/react").StripEmptyObjects<{
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                expiresAt: Date;
                token: string;
                ipAddress?: string | null | undefined;
                userAgent?: string | null | undefined;
            }>;
        };
    };
    $fetch: import("@better-fetch/fetch").BetterFetch<{
        plugins: (import("@better-fetch/fetch").BetterFetchPlugin<Record<string, any>> | {
            id: string;
            name: string;
            hooks: {
                onSuccess(context: import("@better-fetch/fetch").SuccessContext<any>): void;
            };
        } | {
            id: string;
            name: string;
            hooks: {
                onSuccess: ((context: import("@better-fetch/fetch").SuccessContext<any>) => Promise<void> | void) | undefined;
                onError: ((context: import("@better-fetch/fetch").ErrorContext) => Promise<void> | void) | undefined;
                onRequest: (<T extends Record<string, any>>(context: import("@better-fetch/fetch").RequestContext<T>) => Promise<import("@better-fetch/fetch").RequestContext | void> | import("@better-fetch/fetch").RequestContext | void) | undefined;
                onResponse: ((context: import("@better-fetch/fetch").ResponseContext) => Promise<Response | void | import("@better-fetch/fetch").ResponseContext> | Response | import("@better-fetch/fetch").ResponseContext | void) | undefined;
            };
        })[];
        cache?: RequestCache | undefined;
        priority?: RequestPriority | undefined;
        credentials?: RequestCredentials;
        headers?: (HeadersInit & (HeadersInit | {
            accept: "application/json" | "text/plain" | "application/octet-stream";
            "content-type": "application/json" | "text/plain" | "application/x-www-form-urlencoded" | "multipart/form-data" | "application/octet-stream";
            authorization: "Bearer" | "Basic";
        })) | undefined;
        integrity?: string | undefined;
        keepalive?: boolean | undefined;
        method: string;
        mode?: RequestMode | undefined;
        redirect?: RequestRedirect | undefined;
        referrer?: string | undefined;
        referrerPolicy?: ReferrerPolicy | undefined;
        signal?: (AbortSignal | null) | undefined;
        window?: null | undefined;
        onRetry?: ((response: import("@better-fetch/fetch").ResponseContext) => Promise<void> | void) | undefined;
        hookOptions?: {
            cloneResponse?: boolean;
        } | undefined;
        timeout?: number | undefined;
        customFetchImpl: import("@better-fetch/fetch").FetchEsque;
        baseURL: string;
        throw?: boolean | undefined;
        auth?: ({
            type: "Bearer";
            token: string | Promise<string | undefined> | (() => string | Promise<string | undefined> | undefined) | undefined;
        } | {
            type: "Basic";
            username: string | (() => string | undefined) | undefined;
            password: string | (() => string | undefined) | undefined;
        } | {
            type: "Custom";
            prefix: string | (() => string | undefined) | undefined;
            value: string | (() => string | undefined) | undefined;
        }) | undefined;
        body?: any;
        query?: any;
        params?: any;
        duplex?: "full" | "half" | undefined;
        jsonParser: (text: string) => Promise<any> | any;
        retry?: import("@better-fetch/fetch").RetryOptions | undefined;
        retryAttempt?: number | undefined;
        output?: (import("@better-fetch/fetch").StandardSchemaV1 | typeof Blob | typeof File) | undefined;
        errorSchema?: import("@better-fetch/fetch").StandardSchemaV1 | undefined;
        disableValidation?: boolean | undefined;
        disableSignal?: boolean | undefined;
    }, unknown, unknown, {}>;
    $store: {
        notify: (signal?: (Omit<string, "$sessionSignal"> | "$sessionSignal") | undefined) => void;
        listen: (signal: Omit<string, "$sessionSignal"> | "$sessionSignal", listener: (value: boolean, oldValue?: boolean | undefined) => void) => void;
        atoms: Record<string, import("nanostores/atom").WritableAtom<any>>;
    };
    $ERROR_CODES: {
        USER_NOT_FOUND: import("better-auth/*").RawError<"USER_NOT_FOUND">;
        FAILED_TO_CREATE_USER: import("better-auth/*").RawError<"FAILED_TO_CREATE_USER">;
        FAILED_TO_CREATE_SESSION: import("better-auth/*").RawError<"FAILED_TO_CREATE_SESSION">;
        FAILED_TO_UPDATE_USER: import("better-auth/*").RawError<"FAILED_TO_UPDATE_USER">;
        FAILED_TO_GET_SESSION: import("better-auth/*").RawError<"FAILED_TO_GET_SESSION">;
        INVALID_PASSWORD: import("better-auth/*").RawError<"INVALID_PASSWORD">;
        INVALID_EMAIL: import("better-auth/*").RawError<"INVALID_EMAIL">;
        INVALID_EMAIL_OR_PASSWORD: import("better-auth/*").RawError<"INVALID_EMAIL_OR_PASSWORD">;
        INVALID_USER: import("better-auth/*").RawError<"INVALID_USER">;
        SOCIAL_ACCOUNT_ALREADY_LINKED: import("better-auth/*").RawError<"SOCIAL_ACCOUNT_ALREADY_LINKED">;
        PROVIDER_NOT_FOUND: import("better-auth/*").RawError<"PROVIDER_NOT_FOUND">;
        INVALID_TOKEN: import("better-auth/*").RawError<"INVALID_TOKEN">;
        TOKEN_EXPIRED: import("better-auth/*").RawError<"TOKEN_EXPIRED">;
        ID_TOKEN_NOT_SUPPORTED: import("better-auth/*").RawError<"ID_TOKEN_NOT_SUPPORTED">;
        FAILED_TO_GET_USER_INFO: import("better-auth/*").RawError<"FAILED_TO_GET_USER_INFO">;
        USER_EMAIL_NOT_FOUND: import("better-auth/*").RawError<"USER_EMAIL_NOT_FOUND">;
        EMAIL_NOT_VERIFIED: import("better-auth/*").RawError<"EMAIL_NOT_VERIFIED">;
        PASSWORD_TOO_SHORT: import("better-auth/*").RawError<"PASSWORD_TOO_SHORT">;
        PASSWORD_TOO_LONG: import("better-auth/*").RawError<"PASSWORD_TOO_LONG">;
        USER_ALREADY_EXISTS: import("better-auth/*").RawError<"USER_ALREADY_EXISTS">;
        USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: import("better-auth/*").RawError<"USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL">;
        EMAIL_CAN_NOT_BE_UPDATED: import("better-auth/*").RawError<"EMAIL_CAN_NOT_BE_UPDATED">;
        CREDENTIAL_ACCOUNT_NOT_FOUND: import("better-auth/*").RawError<"CREDENTIAL_ACCOUNT_NOT_FOUND">;
        ACCOUNT_NOT_FOUND: import("better-auth/*").RawError<"ACCOUNT_NOT_FOUND">;
        SESSION_EXPIRED: import("better-auth/*").RawError<"SESSION_EXPIRED">;
        FAILED_TO_UNLINK_LAST_ACCOUNT: import("better-auth/*").RawError<"FAILED_TO_UNLINK_LAST_ACCOUNT">;
        USER_ALREADY_HAS_PASSWORD: import("better-auth/*").RawError<"USER_ALREADY_HAS_PASSWORD">;
        CROSS_SITE_NAVIGATION_LOGIN_BLOCKED: import("better-auth/*").RawError<"CROSS_SITE_NAVIGATION_LOGIN_BLOCKED">;
        VERIFICATION_EMAIL_NOT_ENABLED: import("better-auth/*").RawError<"VERIFICATION_EMAIL_NOT_ENABLED">;
        EMAIL_ALREADY_VERIFIED: import("better-auth/*").RawError<"EMAIL_ALREADY_VERIFIED">;
        EMAIL_MISMATCH: import("better-auth/*").RawError<"EMAIL_MISMATCH">;
        SESSION_NOT_FRESH: import("better-auth/*").RawError<"SESSION_NOT_FRESH">;
        LINKED_ACCOUNT_ALREADY_EXISTS: import("better-auth/*").RawError<"LINKED_ACCOUNT_ALREADY_EXISTS">;
        INVALID_ORIGIN: import("better-auth/*").RawError<"INVALID_ORIGIN">;
        INVALID_CALLBACK_URL: import("better-auth/*").RawError<"INVALID_CALLBACK_URL">;
        INVALID_REDIRECT_URL: import("better-auth/*").RawError<"INVALID_REDIRECT_URL">;
        INVALID_ERROR_CALLBACK_URL: import("better-auth/*").RawError<"INVALID_ERROR_CALLBACK_URL">;
        INVALID_NEW_USER_CALLBACK_URL: import("better-auth/*").RawError<"INVALID_NEW_USER_CALLBACK_URL">;
        MISSING_OR_NULL_ORIGIN: import("better-auth/*").RawError<"MISSING_OR_NULL_ORIGIN">;
        CALLBACK_URL_REQUIRED: import("better-auth/*").RawError<"CALLBACK_URL_REQUIRED">;
        FAILED_TO_CREATE_VERIFICATION: import("better-auth/*").RawError<"FAILED_TO_CREATE_VERIFICATION">;
        FIELD_NOT_ALLOWED: import("better-auth/*").RawError<"FIELD_NOT_ALLOWED">;
        ASYNC_VALIDATION_NOT_SUPPORTED: import("better-auth/*").RawError<"ASYNC_VALIDATION_NOT_SUPPORTED">;
        VALIDATION_ERROR: import("better-auth/*").RawError<"VALIDATION_ERROR">;
        MISSING_FIELD: import("better-auth/*").RawError<"MISSING_FIELD">;
        METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED: import("better-auth/*").RawError<"METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED">;
        BODY_MUST_BE_AN_OBJECT: import("better-auth/*").RawError<"BODY_MUST_BE_AN_OBJECT">;
        PASSWORD_ALREADY_SET: import("better-auth/*").RawError<"PASSWORD_ALREADY_SET">;
    };
};
export declare const useSession: () => {
    data: {
        user: import("better-auth/react").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        }>;
        session: import("better-auth/react").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined;
            userAgent?: string | null | undefined;
        }>;
    } | null;
    isPending: boolean;
    isRefetching: boolean;
    error: import("@better-fetch/fetch").BetterFetchError | null;
    refetch: (queryParams?: {
        query?: import("better-auth/types").SessionQueryParams;
    } | undefined) => Promise<void>;
}, signIn: {
    social: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        provider: (string & {}) | "linear" | "huggingface" | "github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "railway" | "vercel" | "wechat";
        callbackURL?: string | undefined;
        newUserCallbackURL?: string | undefined;
        errorCallbackURL?: string | undefined;
        disableRedirect?: boolean | undefined;
        idToken?: {
            token: string;
            nonce?: string | undefined;
            accessToken?: string | undefined;
            refreshToken?: string | undefined;
            expiresAt?: number | undefined;
            user?: {
                name?: {
                    firstName?: string | undefined;
                    lastName?: string | undefined;
                } | undefined;
                email?: string | undefined;
            } | undefined;
        } | undefined;
        scopes?: string[] | undefined;
        requestSignUp?: boolean | undefined;
        loginHint?: string | undefined;
        additionalData?: Record<string, any> | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        provider: (string & {}) | "linear" | "huggingface" | "github" | "apple" | "atlassian" | "cognito" | "discord" | "facebook" | "figma" | "microsoft" | "google" | "slack" | "spotify" | "twitch" | "twitter" | "dropbox" | "kick" | "linkedin" | "gitlab" | "tiktok" | "reddit" | "roblox" | "salesforce" | "vk" | "zoom" | "notion" | "kakao" | "naver" | "line" | "paybin" | "paypal" | "polar" | "railway" | "vercel" | "wechat";
        callbackURL?: string | undefined;
        newUserCallbackURL?: string | undefined;
        errorCallbackURL?: string | undefined;
        disableRedirect?: boolean | undefined;
        idToken?: {
            token: string;
            nonce?: string | undefined;
            accessToken?: string | undefined;
            refreshToken?: string | undefined;
            expiresAt?: number | undefined;
            user?: {
                name?: {
                    firstName?: string | undefined;
                    lastName?: string | undefined;
                } | undefined;
                email?: string | undefined;
            } | undefined;
        } | undefined;
        scopes?: string[] | undefined;
        requestSignUp?: boolean | undefined;
        loginHint?: string | undefined;
        additionalData?: Record<string, any> | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
        redirect: boolean;
        url: string;
    } | (Omit<{
        redirect: boolean;
        token: string;
        url: undefined;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined | undefined;
        };
    }, "user"> & {
        user: import("better-auth/react").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        }>;
    }), {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
} & {
    email: <FetchOptions extends import("@better-auth/core").ClientFetchOption<Partial<{
        email: string;
        password: string;
        callbackURL?: string | undefined;
        rememberMe?: boolean | undefined;
    }> & Record<string, any>, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0: import("better-auth/react").Prettify<{
        email: string;
        password: string;
        callbackURL?: string | undefined;
        rememberMe?: boolean | undefined;
    } & {
        fetchOptions?: FetchOptions | undefined;
    }>, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<Omit<{
        redirect: boolean;
        token: string;
        url?: string | undefined;
        user: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined | undefined;
        };
    }, "user"> & {
        user: import("better-auth/react").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        }>;
    }, {
        code?: string | undefined;
        message?: string | undefined;
    }, FetchOptions["throw"] extends true ? true : false>>;
}, signOut: <FetchOptions extends import("@better-auth/core").ClientFetchOption<never, Partial<Record<string, any>> & Record<string, any>, Record<string, any> | undefined>>(data_0?: import("better-auth/react").Prettify<{
    query?: Record<string, any> | undefined;
    fetchOptions?: FetchOptions | undefined;
}> | undefined, data_1?: FetchOptions | undefined) => Promise<import("@better-fetch/fetch").BetterFetchResponse<{
    success: boolean;
}, {
    code?: string | undefined;
    message?: string | undefined;
}, FetchOptions["throw"] extends true ? true : false>>;
/**
 * NextAuth-compatible useSession wrapper.
 *
 * Maps Better Auth's { data, error, isPending } to NextAuth's { data, status, update }.
 * Drop-in replacement — no destructure changes needed in consuming components.
 */
export declare function useSessionCompat(): {
    data: {
        user: import("better-auth/react").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        }>;
        expires: string;
        session: import("better-auth/react").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined;
            userAgent?: string | null | undefined;
        }>;
    } | null;
    status: "loading" | "authenticated" | "unauthenticated";
    update: () => Promise<{
        user: import("better-auth/react").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            emailVerified: boolean;
            name: string;
            image?: string | null | undefined;
        }>;
        expires: string;
        session: import("better-auth/react").StripEmptyObjects<{
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            expiresAt: Date;
            token: string;
            ipAddress?: string | null | undefined;
            userAgent?: string | null | undefined;
        }>;
    } | null>;
};
/**
 * NextAuth-compatible signOut wrapper.
 *
 * Maps NextAuth signOut({ redirect, callbackUrl }) to Better Auth.
 */
export declare function signOutCompat(options?: {
    redirect?: boolean;
    callbackUrl?: string;
}): Promise<void>;
