// src/lib/auth.ts
import { createAuthOptions } from '@payez/next-mvp';
import { UNAUTHENTICATED_ROUTES } from '@payez/next-mvp/auth/route-config';
import CredentialsProvider from 'next-auth/providers/credentials';

// Define routes that do NOT require authentication
UNAUTHENTICATED_ROUTES.push(
  {
    pattern: '/',
    description: 'Home page',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: false
  },
  {
    pattern: '/login',
    description: 'Login page',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: false
  },
  {
    pattern: '/api/health',
    description: 'Health check API',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: false
  },
  {
    pattern: '/api/public/*',
    description: 'Public API endpoints',
    allowDuringCircuitBreakerOpen: true,
    requiresRateLimit: false
  },
);

export const authOptions = createAuthOptions({
  credentialsProvider: CredentialsProvider,
  // You can pass additional NextAuthOptions here to override or extend defaults
  // For example, custom pages, callbacks, etc.
  // pages: {
  //   signIn: '/auth/signin',
  // },
});
