/**
 * Anonymous Session Preferences API Handler
 *
 * GET /api/anon/preferences - Get current preferences
 * POST /api/anon/preferences - Update preferences
 *
 * Sets a cookie to track anonymous visitors and stores preferences in Redis.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getOrCreateAnonSession,
  updateAnonPreferences,
  ANON_COOKIE_NAME,
  AnonSessionPreferences,
} from '../../lib/anon-session';

const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days in seconds

/**
 * GET handler - retrieves anonymous session preferences
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    let anonId = cookieStore.get(ANON_COOKIE_NAME)?.value;

    // Get or create session
    const session = await getOrCreateAnonSession(anonId);

    // Build response
    const response = NextResponse.json({
      success: true,
      data: {
        id: session.id,
        preferences: session.preferences,
        metrics: session.metrics,
      },
    });

    // Set cookie if it's a new session
    if (!anonId || anonId !== session.id) {
      response.cookies.set(ANON_COOKIE_NAME, session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('[ANON-PREFERENCES] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST handler - updates anonymous session preferences
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    let anonId = cookieStore.get(ANON_COOKIE_NAME)?.value;

    // Get or create session first
    const session = await getOrCreateAnonSession(anonId);
    anonId = session.id;

    // Parse body for preferences to update
    const body = await request.json();
    const preferences: Partial<AnonSessionPreferences> = body.preferences || body;

    // Validate preferences
    if (typeof preferences !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    // Update preferences
    const updatedSession = await updateAnonPreferences(anonId, preferences);

    if (!updatedSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Build response
    const response = NextResponse.json({
      success: true,
      data: {
        id: updatedSession.id,
        preferences: updatedSession.preferences,
      },
    });

    // Ensure cookie is set
    response.cookies.set(ANON_COOKIE_NAME, anonId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[ANON-PREFERENCES] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
