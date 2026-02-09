# SPEC-KIT: `@payez/next-mvp` V2 Upgrade

**Document Version:** 1.0
**Status:** Ready for Implementation
**Owner:** BAPert
**Target Agent:** NextPert

---

## 1. Executive Summary

### 1.1. Objective
This document outlines the specification and implementation plan to upgrade the `@payez/next-mvp` package from a collection of helper utilities into a comprehensive, "batteries-included" authentication framework for Next.js. The goal is to provide a turnkey solution that enables developers to secure an application with our company's IDP and session management patterns with minimal boilerplate and configuration.

### 1.2. Background
An audit of `nexus.cryptaply` revealed that critical authentication logic (middleware, client-side redirects, session viability checks) had to be manually implemented, as it was missing from the `@payez/next-mvp` package. This indicates a significant gap between the package's current state and its intended purpose. The `website-membership` project will serve as the "gold standard" for the required architecture.

### 1.3. Success Criteria
- The upgraded package will provide a `createMvpMiddleware` handler that encapsulates all server-side page and API protection logic.
- The package will provide a configurable `createAuthOptions` function for seamless NextAuth and Redis integration.
- The package will include the robust `fetchWithAuth` utility for all authenticated client-side API calls.
- A developer will be able to fully secure a new Next.js application by following a simple "Quick Start" guide, writing less than 20 lines of configuration code.

---

## 2. Audit and Gap Analysis

A formal audit was conducted comparing the `website-membership` project's mature authentication patterns against the current `@payez/next-mvp` package.

| Feature / Component | `website-membership` (Gold Standard) | `@payez/next-mvp` (Current State) | Status & Action Required |
| :--- | :--- | :--- | :--- |
| **Server-Side Page Protection** | ✅ Full middleware with decision logic, public route checks, and session viability calls. | ❌ **MISSING.** Only provides the `makeAuthDecision` logic. | **Critical Gap.** Package must provide a configurable, "one-line" middleware handler. |
| **Client-Side API Protection** | ✅ `standardizedApi` client with automatic token injection, refresh, and redirect logic. | ✅ **COMPLETE.** The new `fetchWithAuth` provides this. | **No Gap.** This piece is now robust. |
| **Public Route Configuration** | ✅ Sophisticated, pattern-based `unauthenticated-routes.ts` with wildcard support. | ❌ **MISSING.** Only has a basic `Set` with exact string matching. | **Major Gap.** Implement the pattern-based, configurable route checker. |
| **Session Viability Endpoint** | ✅ Dedicated `/api/session/refresh-viability` route that checks Redis for session status. | ❌ **MISSING.** No server-side handlers are exported or provided. | **Critical Gap.** Package must provide this standard API handler. |
| **NextAuth Configuration** | ✅ Comprehensive `lib/auth.ts` with Redis session store integration, JWT/Session callbacks, and IDP logic. | ❌ **MISSING.** Provides no `authOptions` template or Redis integration. | **Critical Gap.** Package must provide a configurable `createAuthOptions` function. |
| **Error Handling & Resilience** | ✅ Circuit breaker logic, coordinated token refresh, and detailed logging. | ❌ **MISSING.** No resilience patterns are included. | **Major Gap.** These production-grade features are essential. |
| **Documentation & Examples** | ✅ (Implicitly exists in the working code) | ❌ **MISSING.** No `README` or example app for auth setup. | **Critical Gap.** Without this, the package is unusable for new developers. |

---

## 3. Target Architecture ("The Golden Path")

The upgraded package will enable the following streamlined developer experience:

1.  **Install:** `npm install @payez/next-mvp`
2.  **Configure:** A developer creates a single file, e.g., `src/lib/auth.ts`, to define their public routes and export their `authOptions`.
3.  **Protect:** The developer creates a `src/middleware.ts` file that is only 3-5 lines long, importing and exporting a pre-built handler from our package.
4.  **Fetch Data:** The developer uses the `fetchWithAuth` utility for all client-side data fetching, with full confidence that authentication and redirects are handled automatically.

---

## 4. Implementation Phases

### Phase 1: Core Middleware & Configuration (Critical Path)

**Objective:** Build the foundational server-side protection and configuration logic.

*   **Task 1.1: Implement Advanced Route Configuration**
    *   **Action:** Created `src/auth/route-config.ts` in the package.
    *   **Details:** This module now replicates the pattern-based, wildcard-supporting `isUnauthenticatedRoute` logic from `website-membership`. It exports `configurePublicRoutes`, `isUnauthenticatedRoute`, and `getRouteConfig`.
    *   **Status:** ✅ COMPLETE.

*   **Task 1.2: Create the Session Viability API Handler**
    *   **Action:** Create `src/api-handlers/session/viability.ts` in the package.
    *   **Details:** This file will export a Next.js API route handler (`GET`) that replicates the logic from `website-membership`'s `/api/session/refresh-viability` route. It will check Redis for the session and return a simple `{ authenticated: boolean }` status. This handler must be easily importable and usable by the host application.

*   **Task 1.3: Create the `createMvpMiddleware` Handler**
    *   **Action:** Created `src/middleware/create-middleware.ts` in the package.
    *   **Details:** This function, `createMvpMiddleware`, encapsulates the entire middleware logic (checking routes, calling the viability endpoint, making a decision, and handling redirects vs. 401s for API calls). The developer's `middleware.ts` file will only need to import and use this function.
    *   **Status:** ✅ COMPLETE.

### Phase 2: NextAuth Integration

**Objective:** Abstract away the complexity of configuring NextAuth with our Redis session store.

*   **Task 2.1: Create the `createAuthOptions` Function**
    *   **Action:** Create `src/auth/auth-options.ts` in the package.
    *   **Details:** This module will export a function, `createAuthOptions`, that takes the application's specific `CredentialsProvider` logic as an argument and returns a complete `NextAuthOptions` object. This object will be pre-configured with our Redis session strategy, JWT/Session callbacks, and all the other mature logic from `website-membership`'s `lib/auth.ts`.

### Phase 3: Documentation & Examples

**Objective:** Make the package easy to adopt and use.

*   **Task 3.1: Write the "Quick Start" Guide**
    *   **Action:** Create a `README.md` in the `packages/next-mvp` directory.
    *   **Details:** This guide will provide clear, step-by-step instructions for a developer to secure a new Next.js application using the V2 package. It will include code snippets for all required files.

*   **Task 3.2: Create a Working Example Application**
    *   **Action:** Create a new application in the `examples/` directory of the monorepo.
    *   **Details:** This example app will serve as a living demonstration of a complete and correct integration of the `@payez/next-mvp` package.

---

## 5. File Manifest (New/Modified Files in `@payez/next-mvp`)

### New Files:
- `src/auth/route-config.ts`
- `src/api-handlers/session/viability.ts`
- `src/middleware/create-middleware.ts`
- `src/auth/auth-options.ts`
- `README.md`
- `examples/auth-quickstart/` (entire new Next.js app)

### Modified Files:
- `src/index.ts` (to export all the new, high-level functions)

---

## 6. Acceptance Criteria

- A developer can follow the new `README.md` to secure a fresh Next.js application in under 15 minutes.
- The example application builds and runs successfully, demonstrating all core authentication features (login, logout, protected pages, protected API calls).
- The new package version is published internally.
- `nexus.cryptaply` is successfully refactored to use the new, streamlined V2 package, resulting in a significant reduction of boilerplate authentication code in its repository.
