# User-Scoped State Storage Pattern in Redis

## Overview
This pattern provides a resilient, repeatable way to store and retrieve user-scoped UI or feature state in Redis. It is designed for use cases like grid state, preferences, onboarding progress, etc., and is intended to be shared across features.

## Key Concepts
- **User-Scoped:** State is keyed by user ID, so each user has their own state.
- **Feature-Scoped:** State is further namespaced by feature (e.g., `grid-state`, `onboarding`, etc.).
- **JSON Storage:** State is stored as a JSON object.
- **TTL:** Optionally, a time-to-live (TTL) can be set for state expiration.
- **Resilience:** All serialization, error handling, and Redis access is abstracted in a shared utility.

## Redis Key Format
```
user:{userId}:feature:{featureName}
```

## Example Usage

### 1. Utility Functions (`src/lib/user-state-store.ts`)
```ts
import { redis } from './redis';

export async function getUserState<T>(userId: string, feature: string): Promise<T | null> {
  const key = `user:${userId}:feature:${feature}`;
  const data = await redis.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function setUserState<T>(userId: string, feature: string, state: T, ttlSeconds?: number): Promise<void> {
  const key = `user:${userId}:feature:${feature}`;
  const value = JSON.stringify(state);
  if (ttlSeconds) {
    await redis.set(key, value, 'EX', ttlSeconds);
  } else {
    await redis.set(key, value);
  }
}
```

### 2. API Route Example
- `POST /api/admin/users/grid-state` to save
- `GET /api/admin/users/grid-state` to load

### 3. Frontend Usage
- On grid state change, POST the new state.
- On mount, GET the state and initialize the grid.

## Best Practices
- Always validate and sanitize state before saving.
- Use feature namespaced keys to avoid collisions.
- Set a reasonable TTL for ephemeral UI state.
- Handle errors gracefully (e.g., fallback to defaults if Redis is unavailable).

## Extending the Pattern
- Add versioning to state objects if needed.
- Use this pattern for any per-user, per-feature state (not just grids).

---

**This pattern ensures a consistent, maintainable approach to user-scoped state across your app.** 