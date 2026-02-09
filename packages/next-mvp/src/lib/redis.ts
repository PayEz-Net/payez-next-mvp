// E:\Repos\PayEz-Next-MVP\packages\next-mvp\src\lib\redis.ts
import Redis, { RedisOptions } from 'ioredis';

let client: Redis | null = null;

function createClient(): Redis {
  const url = process.env.REDIS_URL;

  if (url && url.trim() !== '') {
    // Use a standard configuration for better Docker compatibility
    return new Redis(url);
  }

  // No REDIS_URL set, create a client that will fail fast.
  return new Redis({ lazyConnect: true });
}

export function getRedis(): Redis {
  if (!client) {
    client = createClient();
  }
  return client;
}

const redis = getRedis();
export { redis };
export default redis;