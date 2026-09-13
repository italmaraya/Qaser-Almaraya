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

/**
 * Two separate passwords, two separate trust levels:
 * - ADMIN_PASSWORD: full dashboard — content, visa configuration, packages
 *   configuration, everything.
 * - STAFF_PASSWORD: the restricted "status board" only — view/update the
 *   status of visa applications and package bookings, nothing else.
 * Returns 'admin', 'staff', or null (wrong/missing password).
 */
export function resolveRole(password) {
  if (typeof password !== 'string' || password.length === 0) return null;
  const adminPass = process.env.ADMIN_PASSWORD;
  const staffPass = process.env.STAFF_PASSWORD;
  if (adminPass && password === adminPass) return 'admin';
  if (staffPass && password === staffPass) return 'staff';
  return null;
}

// Kept for anything that only ever needs a yes/no on the admin password
// specifically (there's no such caller left, but cheap to keep around).
export function checkPassword(password) {
  return resolveRole(password) === 'admin';
}

export async function createSession(role) {
  const redis = getRedis();
  const token = randomBytes(32).toString('hex');
  await redis.set(SESSION_PREFIX + token, role, { ex: SESSION_TTL_SECONDS });
  return token;
}

/**
 * Returns the role stored for this session token: 'admin', 'staff', or null
 * if the token is missing/expired. Sessions created before roles existed
 * stored the literal string '1' — those are treated as 'admin' so nobody
 * already logged in gets locked out by this change.
 */
export async function getSessionRole(token) {
  if (!token) return null;
  try {
    const redis = getRedis();
    const value = await redis.get(SESSION_PREFIX + token);
    if (value === '1') return 'admin';
    return value === 'admin' || value === 'staff' ? value : null;
  } catch (err) {
    console.error('getSessionRole check failed:', err);
    return null;
  }
}

export async function isValidSession(token) {
  return (await getSessionRole(token)) != null;
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

// Any signed-in session — admin or staff. Use this for routes both roles
// are allowed to call.
export async function requireAuth(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return isValidSession(token);
}

// Admin only. Use this for anything a staff account must NOT be able to
// reach: content editing, visa/package configuration, deletions, uploads,
// payment approval.
export async function requireAdmin(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return (await getSessionRole(token)) === 'admin';
}
