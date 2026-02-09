/**
 * Client-safe JWT decode (no Node.js dependencies)
 * This is a lightweight version for browser usage
 */

// Decode base64url
function base64urlDecode(base64url: string): string {
  try {
    // Convert base64url to base64
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    return atob(base64);
  } catch (e) {
    throw new Error('Invalid base64url encoding');
  }
}

/**
 * Simple JWT decode for client-side use (no signature verification)
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function jwtDecode<T = any>(token: string): T | null {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      console.error('[JWT] Invalid token format');
      return null;
    }

    const payload = parts[1];
    const decoded = base64urlDecode(payload);
    const parsedPayload = JSON.parse(decoded);

    return parsedPayload;
  } catch (e) {
    console.error('[JWT] Decode failed:', e instanceof Error ? e.message : 'Unknown error');
    return null;
  }
}
