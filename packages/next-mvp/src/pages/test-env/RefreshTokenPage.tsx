"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

/**
 * Refresh Token Test Page
 *
 * Debug page for testing OAuth refresh token flow.
 * Shows current session state, allows manual refresh trigger,
 * and can force-expire tokens for testing.
 *
 * Usage:
 * ```typescript
 * // app/test-env/refresh-token/page.tsx
 * export { RefreshTokenPage as default } from '@payez/next-mvp/pages/test-env';
 * ```
 */
export function RefreshTokenPage() {
  const { data: session, update } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<any>(null);

  // Fetch detailed session info on mount
  useEffect(() => {
    async function fetchSessionDetails() {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        const data = await res.json();
        setSessionDetails(data);
      } catch (e) {
        console.error("Failed to fetch session details", e);
      }
    }
    fetchSessionDetails();
  }, [result]); // Refetch after refresh

  async function handleRefresh() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      setResult({ status: res.status, ...data });
      // Update NextAuth session
      await update();
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleForceExpire() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/test/force-expire", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      setResult({ action: "force_expire", status: res.status, ...data });
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  }

  const formatExpiry = (exp: number | string | undefined) => {
    if (!exp) return "N/A";
    const date = new Date(typeof exp === "string" ? exp : exp);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${date.toLocaleTimeString()} (${diffMins}m ${diffSecs}s remaining)`;
  };

  return (
    <div className="p-8 max-w-2xl mx-auto bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Refresh Token Test</h1>

      {/* Session Info */}
      <div className="mb-6 rounded border border-blue-500 bg-blue-900/30 p-4">
        <h2 className="font-semibold mb-2 text-blue-300">Current Session</h2>
        <div className="text-sm space-y-1 font-mono">
          <div><span className="text-gray-400">User:</span> {session?.user?.email || "Not logged in"}</div>
          <div><span className="text-gray-400">2FA Complete:</span> {String((session?.user as any)?.twoFactorSessionVerified ?? "unknown")}</div>
          <div>
            <span className="text-gray-400">Access Token:</span>{" "}
            {sessionDetails?.accessToken ? `${sessionDetails.accessToken.substring(0, 40)}...` : "N/A"}
          </div>
          <div>
            <span className="text-gray-400">Refresh Token:</span>{" "}
            {sessionDetails?.refreshToken ? `${sessionDetails.refreshToken.substring(0, 40)}...` : "N/A"}
          </div>
          <div>
            <span className="text-gray-400">Access Expires:</span>{" "}
            {formatExpiry(sessionDetails?.accessTokenExpires)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Test Refresh Token"}
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleForceExpire}
          disabled={loading}
        >
          Force Expire Token
        </button>
        <button
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded border border-gray-600 bg-gray-800 p-4">
          <h3 className="font-semibold mb-2 text-gray-300">Result:</h3>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-green-400">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Raw Session Details */}
      <details className="mt-4">
        <summary className="cursor-pointer text-gray-400 hover:text-white">Raw Session Details</summary>
        <pre className="mt-2 text-xs bg-gray-800 p-2 rounded overflow-x-auto text-gray-300">
          {JSON.stringify(sessionDetails, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default RefreshTokenPage;
