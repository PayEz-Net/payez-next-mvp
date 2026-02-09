export type Session = import('next-auth').Session;
export type JWT = import('next-auth/jwt').JWT;
export type TwoFactorMethod = 'none' | 'sms' | 'authenticator' | 'passkey';

export interface User {
  id: string; email: string; name?: string | null; roles: string[]; twoFactorMethod?: TwoFactorMethod; requiresTwoFactor: boolean; accessToken?: string; refreshToken?: string; tokenType?: string;
  authenticationMethods?: string[]; authenticationLevel?: string;
}

export interface JwtPayload { [key: string]: unknown; sub: string; email: string; name?: string; roles?: string[]; exp: number; iat: number; aud: string; iss: string; requiresTwoFactor?: boolean; twoFactorMethod?: TwoFactorMethod; amr?: string[]; acr?: string; }
export interface JwtPayloadWithRoles extends JwtPayload { roles: string[]; requiresTwoFactor: boolean; twoFactorMethod?: TwoFactorMethod; amr?: string[]; acr?: string; }

export interface AuthorizeCredentials { email?: string; password?: string; token?: string; twoFactorCode?: string; twoFactorMethod?: TwoFactorMethod; }

export interface ApiResponse { access_token?: string; refresh_token?: string; requiresTwoFactor?: boolean; twoFactorMethod?: TwoFactorMethod; user_id?: string; email?: string; name?: string; roles?: string[]; error?: string; message?: string; result?: { access_token?: string; refresh_token?: string; name?: string; error?: string; id?: string; email?: string; roles?: string[]; user?: { email?: string; name?: string; roles?: string[]; id?: string; twoFactorMethod?: TwoFactorMethod | null; requiresTwoFactor?: boolean; accessToken?: string; refreshToken?: string; tokenType?: string; }; }; }
