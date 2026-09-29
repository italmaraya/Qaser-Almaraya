// Shared security helpers: request limits, upload checks, safe comparisons.
import { timingSafeEqual, createHash } from 'crypto';
import { getRedis } from './session';

export function clientIp(request) {
  const h = request.headers;
  return (h.get('x-real-ip') || (h.get('x-forwarded-for') || '').split(',')[0] || 'unknown').trim();
}

/**
 * Counts requests per key in a time window. Returns { ok, retryAfter }.
 * If Redis is unreachable we allow the request (never lock real users out).
 */
export async function rateLimit(key, limit, windowSec) {
  try {
    const r = getRedis();
    const k = 'rl:' + key;
    const n = await r.incr(k);
    if (n === 1) await r.expire(k, windowSec);
    if (n > limit) {
      const ttl = await r.ttl(k);
      return { ok: false, retryAfter: ttl > 0 ? ttl : windowSec };
    }
    return { ok: true, retryAfter: 0 };
  } catch (e) {
    console.error('rateLimit unavailable:', e && e.message);
    return { ok: true, retryAfter: 0 };
  }
}

export function tooMany(NextResponse, retryAfter, msgAr) {
  const mins = Math.max(1, Math.ceil(retryAfter / 60));
  return NextResponse.json(
    { error: msgAr || `محاولات كثيرة جداً. حاول مرة أخرى بعد ${mins} دقيقة.` },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}

// ── Login lockout: 5 wrong passwords → locked for 15 minutes ─────────────
const LOGIN_MAX = 5;
const LOGIN_WINDOW = 15 * 60;

export async function loginLocked(ip) {
  try {
    const n = Number(await getRedis().get('lf:' + ip)) || 0;
    if (n >= LOGIN_MAX) {
      const ttl = await getRedis().ttl('lf:' + ip);
      return ttl > 0 ? ttl : LOGIN_WINDOW;
    }
  } catch {}
  return 0;
}
export async function loginFailed(ip) {
  try {
    const n = await getRedis().incr('lf:' + ip);
    if (n === 1) await getRedis().expire('lf:' + ip, LOGIN_WINDOW);
  } catch {}
}
export async function loginSucceeded(ip) {
  try { await getRedis().del('lf:' + ip); } catch {}
}

// Constant-time string comparison (avoids leaking password length/prefix via timing).
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb) && a.length === b.length;
}

// ── Uploads: only real documents/images, checked by their first bytes ───
const KINDS = [
  { ext: 'pdf', type: 'application/pdf', test: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
  { ext: 'png', type: 'image/png', test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { ext: 'jpg', type: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'webp', type: 'image/webp', test: (b) => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
  { ext: 'heic', type: 'image/heic', test: (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 && /^(heic|heix|mif1|msf1|hevc)$/.test(String.fromCharCode(b[8], b[9], b[10], b[11])) },
  { ext: 'docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', test: (b, name) => b[0] === 0x50 && b[1] === 0x4b && /\.docx$/i.test(name) },
  { ext: 'doc', type: 'application/msword', test: (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0 },
];

/** Returns { ok, ext, type } or { ok:false, error } */
export async function checkUpload(file, maxBytes = 15 * 1024 * 1024) {
  if (!file || typeof file === 'string') return { ok: false, error: 'لم يتم إرفاق ملف' };
  if (file.size > maxBytes) return { ok: false, error: `الملف كبير جداً (الحد الأقصى ${Math.round(maxBytes / 1024 / 1024)} ميغابايت)` };
  if (file.size < 16) return { ok: false, error: 'الملف فارغ أو تالف' };
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const kind = KINDS.find((k) => k.test(head, file.name || ''));
  if (!kind) return { ok: false, error: 'نوع الملف غير مدعوم. المسموح: PDF أو Word أو صورة (JPG / PNG / WEBP / HEIC).' };
  return { ok: true, ext: kind.ext, type: kind.type };
}
