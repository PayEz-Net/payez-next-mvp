/**
 * SessionSync - Bridges NextAuth session with Zustand auth store
 *
 * CRITICAL: This component enforces strict session validation. If NextAuth
 * reports an authenticated status but the session data is invalid (empty user ID,
 * empty email, or missing access token), it forces a sign-out to prevent
 * contradictory state like "hasSession: true, userId: ''"
 *
 * This ensures the app NEVER shows authenticated UI with empty/invalid session data.
 */
export declare function SessionSync({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
