"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNAUTHENTICATED_ROUTES = void 0;
exports.isUnauthenticatedRoute = isUnauthenticatedRoute;
exports.isAllowedDuringCircuitBreakerOpen = isAllowedDuringCircuitBreakerOpen;
exports.requiresRateLimit = requiresRateLimit;
exports.UNAUTHENTICATED_ROUTES = [
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
function isUnauthenticatedRoute(pathname) { return exports.UNAUTHENTICATED_ROUTES.some(route => route.pattern.endsWith('*') ? pathname.startsWith(route.pattern.slice(0, -1)) : pathname === route.pattern); }
function isAllowedDuringCircuitBreakerOpen(pathname) { const route = exports.UNAUTHENTICATED_ROUTES.find(route => route.pattern.endsWith('*') ? pathname.startsWith(route.pattern.slice(0, -1)) : pathname === route.pattern); return route?.allowDuringCircuitBreakerOpen === true; }
function requiresRateLimit(pathname) { const route = exports.UNAUTHENTICATED_ROUTES.find(route => route.pattern.endsWith('*') ? pathname.startsWith(route.pattern.slice(0, -1)) : pathname === route.pattern); return route?.requiresRateLimit === true; }
exports.default = { UNAUTHENTICATED_ROUTES: exports.UNAUTHENTICATED_ROUTES, isUnauthenticatedRoute, isAllowedDuringCircuitBreakerOpen, requiresRateLimit };
