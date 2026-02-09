/**
 * @payez/next-mvp Ready-to-Use Route Exports
 *
 * Pre-configured route handlers that can be imported directly
 * into your Next.js app with zero configuration.
 *
 * @version 2.0.0
 * @since auth-ready-v2
 */

// Export individual route handlers
export { POST as refreshPOST } from './refresh';
export { GET as sessionGET, POST as sessionPOST } from './session';
export { POST as logoutPOST } from './logout';
export { GET as viabilityGET } from './viability';
export { GET as nextAuthGET, POST as nextAuthPOST } from './nextauth';

// Also export as namespaced objects for cleaner imports
export * as refresh from './refresh';
export * as session from './session';
export * as logout from './logout';
export * as viability from './viability';
export * as nextauth from './nextauth';