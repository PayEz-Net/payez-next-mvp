import { ReactNode } from 'react';
import { AuthConfig, AuthMode, FederatedProvider } from '@/types/auth';
interface AuthProviderProps {
    children: ReactNode;
    config?: Partial<AuthConfig>;
    /**
     * If true, providers will be fetched dynamically from NextAuth
     * instead of using the static providers array from config.
     * Defaults to true for dynamic provider loading from IDP.
     */
    useDynamicProviders?: boolean;
}
export declare function AuthProvider({ children, config, useDynamicProviders }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
export declare function useAuthConfig(): AuthConfig;
export declare function useAuthMode(): AuthMode;
export declare function useFederatedProviders(): FederatedProvider[];
export declare function useFederatedAuthEnabled(): boolean;
export declare function useTraditionalAuthEnabled(): boolean;
export {};
