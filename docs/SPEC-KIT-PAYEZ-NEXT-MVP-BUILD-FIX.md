# SPEC-KIT: `@payez/next-mvp` Build & Integration Fix

## 1. Overview

This document outlines the necessary steps to diagnose and fix a critical build and packaging issue with the `@payez/next-mvp` TypeScript package. The package fails to produce a complete build artifact, which prevents it from being used in consuming applications like `nexus.cryptaply`.

An expert familiar with TypeScript, `tsc`, `npm`, and Next.js module resolution is required to resolve this issue.

## 2. Problem Description

The `nexus.cryptaply` project fails its build process with "Module not found" errors when trying to import from a locally-built `@payez/next-mvp` package.

This failure occurs despite using standard local development methods, including `npm link` and `npm pack` -> `npm install <path/to/package.tgz>`.

The root cause is that the `@payez/next-mvp` build process is not generating a complete `dist` directory. The `npm pack` command then creates a tarball that is missing the majority of the required modules.

## 3. Current State & Analysis

-   **Source Code:** The `src` directory (`E:\Repos\PayEz-Next-MVP\packages\next-mvp\src`) is complete and contains all necessary modules (`theme`, `utils`, `lib`, etc.).
-   **`tsconfig.json`:** The configuration appears correct. `include` is set to `["src/**/*"]` and `outDir` is set to `./dist`. This *should* result in a complete compilation of the `src` directory.
-   **`package.json`:** The `exports` field has been restored from a known-good version. The `files` array is set to `["dist"]`.
-   **The Anomaly:** Despite the configuration, running `npm run build` (which executes `npx tsc --project tsconfig.json`) results in an incomplete `dist` directory, often containing only a few sub-folders. This is the core mystery that the expert must solve.

## 4. Definition of Done (Acceptance Criteria)

The task is complete when the following conditions are met:

1.  Running `npm run build` in `E:\Repos\PayEz-Next-MVP\packages\next-mvp` generates a `dist` directory that is a complete, mirrored, compiled version of the `src` directory.
2.  Running `npm pack` in the same directory creates a `.tgz` tarball.
3.  Inspecting the contents of the generated `.tgz` file confirms that the **entire** `dist` directory and all its sub-modules are included.
4.  In the `nexus.cryptaply` project (`E:\Repos\Nexus.CryptAply`), running `npm install <path/to/payez-next-mvp.tgz>` successfully installs the package.
5.  After installation, running `npm run build` in `nexus.cryptaply` **succeeds without any "Module not found" errors** related to `@payez/next-mvp`.

## 5. Required Tasks for the Expert

1.  **Diagnose the `tsc` Build Failure:**
    -   Investigate why `tsc` is not compiling the entire `src` directory into `dist` as specified in `tsconfig.json`.
    -   Determine if there are hidden configuration issues, file-level problems (e.g., syntax errors preventing output), or environmental factors causing this behavior.

2.  **Correct the Build Process:**
    -   Implement the necessary changes to `tsconfig.json`, `package.json`, or the build script itself to ensure a complete and correct build artifact is generated in the `dist` folder.

3.  **Verify the Package:**
    -   Perform a clean build.
    -   Verify the `dist` folder's contents.
    -   Pack the package and verify the `.tgz` contents.

4.  **Document the Solution:**
    -   Provide a brief, clear explanation of the root cause and the fix.
    -   Provide definitive, validated instructions for the local development workflow (e.g., "run `npm run build` then `npm pack`...").
