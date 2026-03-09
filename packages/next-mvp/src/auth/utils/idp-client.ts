/**
 * IDP Client Utilities
 *
 * Functions for calling PayEz IDP API endpoints.
 * Handles login, OAuth callback, token refresh, and 2FA verification.
 *
 * URL USAGE:
 * - IDP_URL: Used for all calls to the PayEz Identity Provider
 * - INTERNAL_API_URL: NOT used here - that's for calling THIS app's own endpoints
 *
 * @version 1.0.0
 * @since auth-refactor-2026-01
 */

import type {
  IdpLoginResponse,
  IdpOAuthCallbackResponse,
  IdpRefreshResponse,
  LoginCredentials,
} from '../types/auth-types';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get IDP base URL. Throws if not configured.
 */
export function getIdpUrl(): string {
  const url = process.env.IDP_URL;
  if (!url) {
    throw new Error('[IDP_CLIENT] FATAL: IDP_URL environment variable is REQUIRED');
  }
  return url.replace(/\/$/, ''); // Remove trailing slash
}

/**
 * Get client ID for this application.
 */
export function getClientId(): string {
  const clientId = process.env.CLIENT_ID || process.env.NEXT_PUBLIC_CLIENT_ID;
  if (!clientId) {
    throw new Error('[IDP_CLIENT] FATAL: CLIENT_ID environment variable is REQUIRED');
  }
  return clientId;
}

// ============================================================================
// LOGIN
// ============================================================================

/**
 * Authenticate user with email/password via IDP.
 *
 * @param credentials - User's email and password
 * @param clientHeaders - Headers to forward (IP, User-Agent for audit)
 * @returns IDP login response with tokens or error
 */
export async function idpLogin(
  credentials: LoginCredentials,
  clientHeaders?: { ip?: string; userAgent?: string }
): Promise<IdpLoginResponse> {
  const idpUrl = getIdpUrl();
  const clientId = getClientId();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Id': clientId,
  };

  // Forward client IP for audit logging
  if (clientHeaders?.ip) {
    headers['X-Forwarded-For'] = clientHeaders.ip;
  }

  // Forward User-Agent for audit logging
  if (clientHeaders?.userAgent) {
    headers['User-Agent'] = clientHeaders.userAgent;
  }

  try {
    const response = await fetch(`${idpUrl}/api/ExternalAuth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        username_or_email: credentials.email,
        password: credentials.password,
        client_id: clientId,
      }),
    });

    const data = await response.json();

    // Unwrap PayEz response envelope if present
    const responseData = data.data || data;

    if (!response.ok || !responseData.result || !responseData.success) {
      return {
        success: false,
        error: responseData.error || {
          code: `HTTP_${response.status}`,
          message: getLoginErrorMessage(response.status, responseData),
        },
      };
    }

    return {
      success: true,
      result: responseData.result,
    };
  } catch (error) {
    console.error('[IDP_CLIENT] Login request failed:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to authentication service',
      },
    };
  }
}

/**
 * Get user-friendly error message for login failures.
 */
function getLoginErrorMessage(status: number, responseData: any): string {
  // Check for structured error from IDP
  if (responseData?.error?.message) {
    return responseData.error.message;
  }

  // Fallback to HTTP status-based messages
  switch (status) {
    case 401:
      return 'Invalid email or password. Please try again.';
    case 403:
      return 'Account access denied. Please contact support.';
    case 429:
      return 'Too many login attempts. Please try again later.';
    default:
      if (status >= 500) {
        return 'Authentication service is temporarily unavailable.';
      }
      return 'Authentication failed. Please try again.';
  }
}

// ============================================================================
// OAUTH CALLBACK
// ============================================================================

/**
 * Register/authenticate OAuth user with IDP.
 *
 * Called after OAuth provider (Google, etc.) redirects back.
 * Creates or retrieves IDP user and returns IDP tokens.
 *
 * @param oauthData - Data from OAuth provider
 * @returns IDP response with tokens and user info
 */
export async function idpOAuthCallback(oauthData: {
  provider: string;
  providerAccountId: string;
  email: string;
  name?: string;
  image?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}): Promise<IdpOAuthCallbackResponse> {
  const idpUrl = getIdpUrl();
  const clientId = getClientId();

  try {
    const response = await fetch(`${idpUrl}/api/ExternalAuth/oauth-callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': clientId,
      },
      body: JSON.stringify({
        provider: oauthData.provider,
        provider_account_id: oauthData.providerAccountId,
        email: oauthData.email,
        name: oauthData.name || '',
        image: oauthData.image || '',
        access_token: oauthData.accessToken || '',
        refresh_token: oauthData.refreshToken || '',
        expires_at: oauthData.expiresAt || 0,
        client_id: clientId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[IDP_CLIENT] OAuth callback failed:', response.status, errorText);
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: 'OAuth registration failed',
        },
      };
    }

    const data = await response.json();
    const responseData = data.data || data;

    // Normalize snake_case to camelCase
    return {
      success: responseData.success !== false,
      data: responseData.success !== false
        ? {
            accessToken: responseData.accessToken || responseData.access_token,
            refreshToken: responseData.refreshToken || responseData.refresh_token,
            isNewUser: responseData.isNewUser ?? responseData.is_new_user ?? false,
            user: responseData.user
              ? {
                  userId: responseData.user.userId || responseData.user.user_id,
                  email: responseData.user.email || responseData.user.Email,
                  fullName: responseData.user.fullName || responseData.user.full_name || responseData.user.name,
                  roles: responseData.user.roles || [],
                }
              : undefined,
          }
        : undefined,
      error: responseData.error,
    };
  } catch (error) {
    console.error('[IDP_CLIENT] OAuth callback request failed:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to authentication service',
      },
    };
  }
}

// ============================================================================
// TOKEN REFRESH
// ============================================================================

/**
 * Refresh an expired access token using the refresh token.
 *
 * @param refreshToken - The refresh token from previous login
 * @param mfaContext - MFA context to preserve across refresh
 * @returns New tokens or error
 */
export async function idpRefreshToken(
  refreshToken: string,
  mfaContext?: {
    amr?: string[];
    acr?: string;
    twoFactorVerified?: boolean;
    twoFactorMethod?: string;
    twoFactorCompletedAt?: number;
  }
): Promise<IdpRefreshResponse> {
  const idpUrl = getIdpUrl();
  const clientId = getClientId();

  const requestBody: Record<string, any> = {
    refresh_token: refreshToken,
  };

  // Include MFA context so new token preserves authentication level
  if (mfaContext) {
    if (mfaContext.amr) {
      requestBody.amr = mfaContext.amr;
    }
    if (mfaContext.acr) {
      requestBody.acr = mfaContext.acr;
    }
    if (mfaContext.twoFactorVerified) {
      requestBody.two_factor_verified = true;
    }
    if (mfaContext.twoFactorMethod) {
      requestBody.two_factor_method = mfaContext.twoFactorMethod;
    }
    if (mfaContext.twoFactorCompletedAt) {
      requestBody.two_factor_completed_at = new Date(mfaContext.twoFactorCompletedAt).toISOString();
    }
  }

  try {
    const response = await fetch(`${idpUrl}/api/ExternalAuth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': clientId,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[IDP_CLIENT] Token refresh failed:', response.status, errorText);
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: response.status === 401 ? 'Refresh token expired' : 'Token refresh failed',
        },
      };
    }

    const data = await response.json();

    if (data.success === false) {
      return {
        success: false,
        error: data.error || { code: 'REFRESH_FAILED', message: 'Token refresh failed' },
      };
    }

    const tokenData = data.data || data;

    return {
      success: true,
      data: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in || 3600,
      },
    };
  } catch (error) {
    console.error('[IDP_CLIENT] Token refresh request failed:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to authentication service',
      },
    };
  }
}

// ============================================================================
// 2FA VERIFICATION
// ============================================================================

/**
 * Verify 2FA code with IDP.
 *
 * @param sessionToken - Redis session ID
 * @param code - The 2FA code entered by user
 * @param method - The 2FA method ('email' | 'sms' | 'totp')
 * @returns Success status and updated tokens
 */
export async function idpVerify2FA(
  accessToken: string,
  code: string,
  method: 'email' | 'sms' | 'totp'
): Promise<{ success: boolean; error?: { code: string; message: string } }> {
  const idpUrl = getIdpUrl();
  const clientId = getClientId();

  try {
    const response = await fetch(`${idpUrl}/api/ExternalAuth/verify-2fa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': clientId,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        code,
        method,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        error: data.error || {
          code: `HTTP_${response.status}`,
          message: response.status === 401 ? 'Invalid code' : '2FA verification failed',
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[IDP_CLIENT] 2FA verification failed:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to authentication service',
      },
    };
  }
}

/**
 * Request a new 2FA code to be sent.
 *
 * @param accessToken - User's access token
 * @param method - How to send the code ('email' | 'sms')
 */
export async function idpSend2FACode(
  accessToken: string,
  method: 'email' | 'sms'
): Promise<{ success: boolean; error?: { code: string; message: string } }> {
  const idpUrl = getIdpUrl();
  const clientId = getClientId();

  try {
    const response = await fetch(`${idpUrl}/api/ExternalAuth/send-2fa-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': clientId,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ method }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        error: data.error || {
          code: `HTTP_${response.status}`,
          message: 'Failed to send 2FA code',
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[IDP_CLIENT] Send 2FA code failed:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to authentication service',
      },
    };
  }
}
