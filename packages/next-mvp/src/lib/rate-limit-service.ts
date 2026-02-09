import redis from '../lib/redis';
import { logger } from '../config/logger';

export interface RateLimitRule { endpoint: string; period: string; limit: number; }
export interface RateLimitResult { isAllowed: boolean; requestCount: number; limit: number; retryAfterSeconds?: number; failedAttempts?: number; }

export function createPayEzRateLimitResponse(retryAfterSeconds: number, remainingAttempts: number = 0) {
  return { success: false, message: 'Too many failed attempts', user_info: null, errors: [ { code: 'RateLimitExceeded', message: 'Too many failed authentication attempts', resolution: `Please try again in ${retryAfterSeconds} seconds`, remainingAttempts } ] };
}
