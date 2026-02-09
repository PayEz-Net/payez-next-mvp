import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    user: {
      id: string;
      requiresTwoFactor?: boolean;
      twoFactorSessionVerified?: boolean;
    } & DefaultSession['user'];
  }
}