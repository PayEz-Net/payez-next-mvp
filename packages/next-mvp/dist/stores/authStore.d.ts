/**
 * 🚀 CENTRALIZED AUTH STORE - THE SINGLE SOURCE OF TRUTH
 *
 * This Zustand store replaces ALL scattered useState patterns for auth-related state.
 * No more prop drilling, no more duplicate loading states, no more auth chaos.
 *
 * Features:
 * - Centralized session, token, and user state
 * - Built-in API calling with auto token refresh
 * - Loading state management for all async operations
 * - Type-safe throughout
 * - Integrates seamlessly with existing NextAuth
 */
import { AppSession } from '../lib/session';
import { HubConnection, HubConnectionState } from '@microsoft/signalr';
export interface User {
    id: string;
    email: string;
    roles: string[];
    twoFactorSessionVerified: boolean;
    requiresTwoFactor: boolean;
    twoFactorMethod?: string;
    authenticationMethods?: string[];
    authenticationLevel?: string;
    isApproved: boolean;
    isSuspended: boolean;
    lockoutEnabled: boolean;
    lockoutEnd?: Date | null;
    pausedAt?: Date | null;
    pausedBy?: string | null;
    suspensionReason?: string | null;
}
export interface UserStateChangeEvent {
    userId: string;
    action: 'APPROVE' | 'DISAPPROVE' | 'PAUSE' | 'RESUME' | 'HALT' | 'UNLOCK';
    newState: {
        isApproved?: boolean;
        isSuspended?: boolean;
        lockoutEnabled?: boolean;
        lockoutEnd?: string | null;
        pausedAt?: string | null;
        pausedBy?: string | null;
        suspensionReason?: string | null;
    };
    reason?: string;
    changedBy: string;
    timestamp: string;
}
export interface SecurityNotificationEvent {
    type: 'USER_LOCKOUT' | 'IP_THROTTLE' | 'BRUTE_FORCE' | 'DISTRIBUTED_ATTACK';
    userId?: string;
    ipAddress?: string;
    message: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timestamp: string;
}
export interface AuthState {
    session: AppSession | null;
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isInitialized: boolean;
    isLoading: boolean;
    isRefreshingToken: boolean;
    isLoadingUserStats: boolean;
    isLoadingClients: boolean;
    isLoadingRoles: boolean;
    isLoadingUsers: boolean;
    isLoadingUserDetails: Record<string, boolean>;
    isLoadingRoleCategories: boolean;
    isLoadingUserAssignments: Record<string, boolean>;
    isLoadingClientAuthorizations: Record<string, boolean>;
    error: string | null;
    tokenError: string | null;
    userStats: any | null;
    clients: any[] | null;
    roles: any[] | null;
    users: any[] | null;
    userDetails: Record<string, any>;
    userAssignments: Record<string, any>;
    roleCategories: any[] | null;
    clientAuthorizations: Record<string, any[] | undefined>;
    userStatsLastFetch: number | null;
    clientsLastFetch: number | null;
    rolesLastFetch: number | null;
    usersLastFetch: number | null;
    roleCategoriesLastFetch: number | null;
    signalrConnection: HubConnection | null;
    signalrConnectionState: HubConnectionState;
    isConnectedToSignalR: boolean;
}
export interface AuthActions {
    setSession: (session: AppSession | null) => void;
    clearSession: () => void;
    refreshSession: () => Promise<void>;
    refreshTokens: () => Promise<void>;
    rehydrateSessionAfterRefresh: () => Promise<void>;
    signIn: (credentials: {
        email: string;
        password: string;
    }) => Promise<boolean>;
    signOut: () => Promise<void>;
    forceLogoutAndRedirect: (reason: string) => Promise<void>;
    apiCall: <T = any>(url: string, options?: RequestInit, maxRetries?: number) => Promise<T>;
    makeApiCall: <T = any>(url: string, options?: RequestInit, attempt?: number) => Promise<T>;
    fetchUserStats: (force?: boolean) => Promise<void>;
    fetchClients: (force?: boolean) => Promise<void>;
    fetchRoles: (force?: boolean) => Promise<void>;
    fetchUsers: (params?: any, force?: boolean) => Promise<void>;
    fetchUserDetails: (userId: string, force?: boolean) => Promise<void>;
    fetchUserClientAuthorizations: (userId: string, force?: boolean) => Promise<void>;
    fetchUserRoleAssignments: (userId: string, force?: boolean) => Promise<void>;
    fetchRoleCategories: (force?: boolean) => Promise<void>;
    createUser: (userData: any) => Promise<any>;
    updateUser: (userId: string, updates: any) => Promise<any>;
    deleteUser: (userId: string) => Promise<void>;
    createRole: (roleData: any) => Promise<any>;
    updateRole: (roleId: string, updates: any) => Promise<any>;
    deleteRole: (roleId: string) => Promise<void>;
    assignUserToRole: (userId: string, roleId: string) => Promise<void>;
    removeUserFromRole: (userId: string, roleId: string) => Promise<void>;
    assignUserToClient: (userId: string, clientId: string) => Promise<void>;
    removeUserFromClient: (userId: string, clientId: string) => Promise<void>;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    hasAllRoles: (roles: string[]) => boolean;
    isFullyAuthenticated: () => boolean;
    setError: (error: string | null) => void;
    clearError: () => void;
    approveUser: (userId: string, reason?: string) => Promise<void>;
    disapproveUser: (userId: string, reason?: string) => Promise<void>;
    pauseUser: (userId: string, reason?: string) => Promise<void>;
    resumeUser: (userId: string) => Promise<void>;
    haltUser: (userId: string, reason?: string) => Promise<void>;
    unlockUser: (userId: string) => Promise<void>;
    canUserAccess: () => boolean;
    getUserStateDisplay: () => string;
    isUserLocked: () => boolean;
    initializeSignalR: () => Promise<void>;
    disconnectSignalR: () => Promise<void>;
    handleUserStateChanged: (data: UserStateChangeEvent) => void;
}
export type AuthStore = AuthState & AuthActions;
export declare const useAuthStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AuthStore>, "setState"> & {
    setState<A extends string | {
        type: string;
    }>(partial: AuthStore | Partial<AuthStore> | ((state: AuthStore) => AuthStore | Partial<AuthStore>), replace?: boolean | undefined, action?: A | undefined): void;
}>;
/**
 * Initialize the auth store with a session (typically called in layout)
 */
export declare const initializeAuthStore: (session: AppSession | null) => void;
export default useAuthStore;
