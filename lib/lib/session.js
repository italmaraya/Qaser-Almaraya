import { Redis } from '@upstash/redis';
import { randomBytes } from 'crypto';

const SESSION_PREFIX = 'qaser:session:';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const SESSION_COOKIE = 'qaser_admin_session';

function getRedis() {
  // Different Vercel/Upstash integration flows have used different env var
  // names over time. Check all known variants rather than relying on a
  // single fixed name.
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.REDIS_TOKEN;

  if (!url || !token) {
    throw new Error(
      'No Redis connection found. Expected KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN to be set.'
    );
  }
  return new Redis({ url, token });
}

export function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    // Fail closed: if no password is configured, nobody can log in.
    console.error('ADMIN_PASSWORD environment variable is not set.');
    return false;
  }
  return typeof password === 'string' && password.length > 0 && password === expected;
}

export async function createSession() {
  const redis = getRedis();
  const token = randomBytes(32).toString('hex');
  await redis.set(SESSION_PREFIX + token, '1', { ex: SESSION_TTL_SECONDS });
  return token;
}

export async function isValidSession(token) {
  if (!token) return false;
  try {
    const redis = getRedis();
    const value = await redis.get(SESSION_PREFIX + token);
    return value != null;
  } catch (err) {
    console.error('isValidSession check failed:', err);
    return false;
  }
}

export async function destroySession(token) {
  if (!token) return;
  try {
    const redis = getRedis();
    await redis.del(SESSION_PREFIX + token);
  } catch (err) {
    console.error('destroySession failed:', err);
  }
}

export async function requireAuth(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return isValidSession(token);
}
