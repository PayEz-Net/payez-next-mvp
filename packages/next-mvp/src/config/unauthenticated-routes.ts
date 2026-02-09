export interface UnauthenticatedRouteConfig { pattern: string; description: string; allowDuringCircuitBreakerOpen?: boolean; requiresRateLimit?: boolean; }
export const UNAUTHENTICATED_ROUTES: UnauthenticatedRouteConfig[] = [
  { pattern: '/account-auth/*', description: 'All authentication pages', allowDuringCircuitBreakerOpen: true },
  { pattern: '/account-auth/login', description: 'Login page', allowDuringCircuitBreakerOpen: true },
  { pattern: '/account-auth/verify-code', description: '2FA page', allowDuringCircuitBreakerOpen: true },
  { pattern: '/api/auth/*', description: 'Auth API endpoints', allowDuringCircuitBreakerOpen: true, requiresRateLimit: true },
  { pattern: '/api/session/refresh-viability', description: 'Refresh viability check', allowDuringCircuitBreakerOpen: true },
  { pattern: '/landing', description: 'Public landing', allowDuringCircuitBreakerOpen: true },
  { pattern: '/service-unavailable', description: 'Service unavailable', allowDuringCircuitBreakerOpen: true },
  { pattern: '/favicon.ico', description: 'Favicon', allowDuringCircuitBreakerOpen: true },
  { pattern: '/robots.txt', description: 'Robots.txt', allowDuringCircuitBreakerOpen: true },
  { pattern: '/sitemap.xml', description: 'Sitemap', allowDuringCircuitBreakerOpen: true },
  { pattern: '/_next/*', description: 'Next.js assets', allowDuringCircuitBreakerOpen: true },
  { pattern: '/public/*', description: 'Public assets', allowDuringCircuitBreakerOpen: true }
];
export function isUnauthenticatedRoute(pathname: string): boolean { return UNAUTHENTICATED_ROUTES.some(route => route.pattern.endsWith('*') ? pathname.startsWith(route.pattern.slice(0, -1)) : pathname === route.pattern); }
export function isAllowedDuringCircuitBreakerOpen(pathname: string): boolean { const route = UNAUTHENTICATED_ROUTES.find(route => route.pattern.endsWith('*') ? pathname.startsWith(route.pattern.slice(0, -1)) : pathname === route.pattern); return route?.allowDuringCircuitBreakerOpen === true; }
export function requiresRateLimit(pathname: string): boolean { const route = UNAUTHENTICATED_ROUTES.find(route => route.pattern.endsWith('*') ? pathname.startsWith(route.pattern.slice(0, -1)) : pathname === route.pattern); return route?.requiresRateLimit === true; }
export default { UNAUTHENTICATED_ROUTES, isUnauthenticatedRoute, isAllowedDuringCircuitBreakerOpen, requiresRateLimit };
