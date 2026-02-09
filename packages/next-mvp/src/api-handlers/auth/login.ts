/**
 * Authentication Login API Handler
 *
 * Handles user authentication against the external IDP service.
 * This handler is designed to be imported and used by Next.js applications
 * using the @payez/next-mvp package.
 *
 * @version 2.0
 * @requires No authentication (public endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';

// Add protection headers to all responses
function addSecurityHeaders(response: NextResponse) {
  // Content Security Policy - restrictive for auth endpoints
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Strict transport security for HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');

  // Cache control for sensitive auth endpoints
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

interface LoginRequest {
  username_or_email: string;
  password: string;
  client_id?: string;
  client_type?: string;
  two_factor_code?: string;
  two_factor_recovery_code?: string;
}

interface LoginConfig {
  idpBaseUrl: string;
  clientId: string;
  loginEndpoint?: string;
  clientType?: string; // "partner" or "idp", defaults to "partner" for CryptAply
}

/**
 * Creates a login handler for Next.js API routes
 *
 * @param config Configuration for IDP connection
 * @returns Next.js POST handler function
 *
 * @example
 * ```typescript
 * // In your app's /app/api/auth/login/route.ts
 * import { createLoginHandler } from '@payez/next-mvp/api-handlers/auth/login';
 *
 * export const POST = createLoginHandler({
 *   idpBaseUrl: process.env.IDP_URL!,
 *   clientId: process.env.CLIENT_ID!,
 *   loginEndpoint: '/api/ExternalAuth/login'
 * });
 * ```
 */
export function createLoginHandler(config: LoginConfig) {
  const { idpBaseUrl, clientId, loginEndpoint = '/api/ExternalAuth/login', clientType = 'partner' } = config;

  return async function POST(req: NextRequest) {
    let body: LoginRequest;

    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    const { username_or_email, password, client_type, two_factor_code, two_factor_recovery_code } = body;

    // Validate required fields
    if (!username_or_email || typeof username_or_email !== 'string' || username_or_email.trim() === '') {
      return NextResponse.json(
        { error: 'username_or_email is required' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const idpUrl = `${idpBaseUrl}${loginEndpoint}`;
    const payload: any = {
      username_or_email,
      password,
      client_id: clientId,
      client_type: client_type || clientType // Use provided client_type or config default
    };

    // Add optional 2FA fields if provided
    if (two_factor_code) {
      payload.two_factor_code = two_factor_code;
    }
    if (two_factor_recovery_code) {
      payload.two_factor_recovery_code = two_factor_recovery_code;
    }

    // Extract client headers for forwarding to IDP
    const clientHeaders: Record<string, string> = {};

    // Forward client IP if available
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    if (clientIp) {
      clientHeaders['X-Forwarded-For'] = clientIp.split(',')[0].trim();
    }

    // Forward user agent if available
    const userAgent = req.headers.get('user-agent');
    if (userAgent) {
      clientHeaders['User-Agent'] = userAgent;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cookie': 'X-Device-Id=payez-PayEz-6c8201c35c1b44c9b2e823b36b95a718',
      ...clientHeaders
    };

    try {
      const backendResponse = await fetch(idpUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const rawText = await backendResponse.text();
      let data: any;

      try {
        data = JSON.parse(rawText);
      } catch (jsonError) {
        console.error('[LOGIN] IDP returned non-JSON response', {
          response: rawText,
          status: backendResponse.status
        });
        return NextResponse.json(
          { error: 'Invalid response from authentication service' },
          { status: 502 }
        );
      }

      if (!backendResponse.ok) {
        // Handle rate limiting specifically
        if (backendResponse.status === 429) {
          const retryAfter = backendResponse.headers.get('retry-after');
          const retryAfterSeconds = retryAfter ? parseInt(retryAfter) : 60;

          return addSecurityHeaders(NextResponse.json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts. Please try again later.',
            retryAfter: retryAfterSeconds
          }, { status: 429 }));
        }

        // Pass through error from IDP
        console.error('[LOGIN] IDP service error', {
          status: backendResponse.status,
          error: data
        });
        return addSecurityHeaders(NextResponse.json(data, { status: backendResponse.status }));
      }

      if (!data.success) {
        // IDP returned a canonical error envelope with HTTP 200
        console.error('[LOGIN] IDP authentication failure', { error: data });
        return addSecurityHeaders(NextResponse.json(data, { status: 200 }));
      }

      // Normalize response shape for NextAuth authorize()
      const normalized = {
        success: data?.success === true,
        result: (data?.data && data?.data?.result) ? data.data.result : (data?.result ?? data),
        // Preserve original payload for debugging/compatibility
        original: data
      };

      return addSecurityHeaders(NextResponse.json(normalized as any));

    } catch (error) {
      // Handle network and other errors
      console.error('[LOGIN] FETCH FAILED:', {
        error: error instanceof Error ? error.message : String(error),
        idpUrl
      });

      if (error instanceof Error && error.message.includes('fetch')) {
        return NextResponse.json(
          { error: 'Unable to connect to authentication service' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'An unexpected error occurred during login' },
        { status: 500 }
      );
    }
  };
}

/**
 * Default export for backward compatibility
 * Requires environment variables: IDP_URL, CLIENT_ID
 */
export const POST = createLoginHandler({
  idpBaseUrl: process.env.IDP_URL!,
  clientId: process.env.CLIENT_ID || 'payez_default_client',
  loginEndpoint: '/api/ExternalAuth/login'
});
