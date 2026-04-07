/**
 * Demo mode utilities
 * When DEMO_MODE=true, auth package is installed but not enforced
 */

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

export function isAuthConfigured(): boolean {
  if (isDemoMode()) return false;
  return !!(
    process.env.BETTER_AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    (process.env.NEXT_CLIENT_ID && process.env.NEXT_CLIENT_PRIVATE_KEY_PEM)
  );
}
