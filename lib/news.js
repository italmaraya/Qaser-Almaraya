// Blog / news helpers shared by the public pages, the API and the dashboard.
import { sql, ensureSchema } from './db';

export const NEWS_CATEGORIES = [
  { id: 'news', ar: 'أخبار الشركة', en: 'Company news' },
  { id: 'tips', ar: 'نصائح السفر', en: 'Travel tips' },
  { id: 'visas', ar: 'تأشيرات', en: 'Visas' },
  { id: 'offers', ar: 'عروض ورحلات', en: 'Offers & trips' },
  { id: 'events', ar: 'فعاليات ومعارض', en: 'Events & expos' },
];

export function slugify(text, fallback) {
  const s = String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70)
    .replace(/^-|-$/g, '');
  return s || fallback;
}

export function readingMinutes(text) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export async function listPublished({ category, limit = 60 } = {}) {
  await ensureSchema();
  const rows = category
    ? await sql`SELECT id, slug, title_ar, title_en, excerpt_ar, excerpt_en, cover_url, category, featured, published_at, body_ar FROM news_posts WHERE published = true AND published_at <= now() AND category = ${category} ORDER BY featured DESC, published_at DESC LIMIT ${limit}`
    : await sql`SELECT id, slug, title_ar, title_en, excerpt_ar, excerpt_en, cover_url, category, featured, published_at, body_ar FROM news_posts WHERE published = true AND published_at <= now() ORDER BY featured DESC, published_at DESC LIMIT ${limit}`;
  return rows.map(({ body_ar, ...r }) => ({ ...r, minutes: readingMinutes(body_ar) }));
}

export async function getPublished(slug) {
  await ensureSchema();
  const rows = await sql`SELECT * FROM news_posts WHERE slug = ${slug} AND published = true AND published_at <= now() LIMIT 1`;
  return rows[0] || null;
}
