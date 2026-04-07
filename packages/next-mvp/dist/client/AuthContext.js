"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = AuthProvider;
exports.useAuthConfig = useAuthConfig;
exports.useAuthMode = useAuthMode;
exports.useFederatedProviders = useFederatedProviders;
exports.useFederatedAuthEnabled = useFederatedAuthEnabled;
exports.useTraditionalAuthEnabled = useTraditionalAuthEnabled;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
const AuthContext = (0, react_1.createContext)(null);
const defaultConfig = {
    mode: 'traditional',
    providers: [],
    enableRecovery: true,
    enableEmailSignup: true,
    allowPasswordReset: true,
};
// Map provider IDs to our FederatedProvider type
const PROVIDER_MAP = {
    'google': 'google',
    'apple': 'apple',
    'facebook': 'facebook',
    'github': 'github',
    'azure-ad': 'microsoft',
    'microsoft-entra-id': 'microsoft',
};
// OAuth providers we support in UI (excludes credentials)
const OAUTH_PROVIDER_IDS = ['google', 'apple', 'facebook', 'github', 'azure-ad', 'microsoft-entra-id'];
function AuthProvider({ children, config, useDynamicProviders = true }) {
    const [dynamicProviders, setDynamicProviders] = (0, react_1.useState)([]);
    const [providersLoaded, setProvidersLoaded] = (0, react_1.useState)(!useDynamicProviders);
    // Create QueryClient instance for React Query - used internally by MVP hooks
    const [queryClient] = (0, react_1.useState)(() => new react_query_1.QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    }));
    // Load available providers on mount
    (0, react_1.useEffect)(() => {
        if (!useDynamicProviders)
            return;
        let mounted = true;
        async function fetchDynamicProviders() {
            try {
                // Better Auth doesn't have a getProviders equivalent.
                // Use static provider map based on configured social providers.
                const result = {
                    google: { id: 'google', name: 'Google' },
                };
                if (!mounted)
                    return;
                if (result) {
                    // Filter to OAuth providers only and map to FederatedProvider type
                    const oauthProviders = Object.keys(result)
                        .filter(id => OAUTH_PROVIDER_IDS.includes(id))
                        .map(id => PROVIDER_MAP[id])
                        .filter((p) => p !== undefined);
                    setDynamicProviders(oauthProviders);
                }
            }
            catch (err) {
                // Fall back to static config providers on error
            }
            finally {
                if (mounted) {
                    setProvidersLoaded(true);
                }
            }
        }
        fetchDynamicProviders();
        return () => {
            mounted = false;
        };
    }, [useDynamicProviders]);
    // Determine final providers list
    const providers = useDynamicProviders && providersLoaded
        ? dynamicProviders
        : (config?.providers ?? defaultConfig.providers);
    const authConfig = {
        ...defaultConfig,
        ...config,
        providers, // Override with dynamic providers if enabled
    };
    return ((0, jsx_runtime_1.jsx)(react_query_1.QueryClientProvider, { client: queryClient, children: (0, jsx_runtime_1.jsx)(AuthContext.Provider, { value: authConfig, children: children }) }));
}
function useAuthConfig() {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context) {
        return defaultConfig;
    }
    return context;
}
function useAuthMode() {
    const config = useAuthConfig();
    return config.mode;
}
function useFederatedProviders() {
    const config = useAuthConfig();
    return config.providers;
}
function useFederatedAuthEnabled() {
    const config = useAuthConfig();
    return config.mode === 'federated' && config.providers.length > 0;
}
function useTraditionalAuthEnabled() {
    const config = useAuthConfig();
    return config.mode === 'traditional';
}
