import { JwtPayload } from 'jwt-decode';
export type AuthMode = 'traditional' | 'federated';
export type FederatedProvider = 'google' | 'microsoft' | 'facebook' | 'github' | 'apple';
export interface AuthConfig {
    mode: AuthMode;
    providers: FederatedProvider[];
    enableRecovery: boolean;
    enableEmailSignup: boolean;
    allowPasswordReset: boolean;
}
export interface JwtPayloadWithRoles extends JwtPayload {
    role?: string | string[];
    roles?: string[];
    amr?: string[];
    acr?: string;
    mfa_time?: number;
    mfa_expires?: number;
    mfa_validity_hours?: number;
}
