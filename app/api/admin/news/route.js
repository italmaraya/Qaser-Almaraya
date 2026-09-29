import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/session';
import { sql, ensureSchema } from '../../../../lib/db';
import { slugify } from '../../../../lib/news';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`SELECT * FROM news_posts ORDER BY published_at DESC, id DESC`;
  return NextResponse.json(rows);
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const b = await request.json().catch(() => ({}));
  if (!String(b.title_ar || '').trim()) return NextResponse.json({ error: 'العنوان بالعربية مطلوب' }, { status: 400 });
  let slug = slugify(b.slug || b.title_en || b.title_ar, 'post-' + Date.now().toString(36));
  const exists = await sql`SELECT 1 FROM news_posts WHERE slug = ${slug}`;
  if (exists.length) slug = slug + '-' + Date.now().toString(36).slice(-4);
  const rows = await sql`
    INSERT INTO news_posts (slug, title_ar, title_en, excerpt_ar, excerpt_en, body_ar, body_en, cover_url, category, published, featured, published_at)
    VALUES (${slug}, ${b.title_ar || ''}, ${b.title_en || ''}, ${b.excerpt_ar || ''}, ${b.excerpt_en || ''}, ${b.body_ar || ''}, ${b.body_en || ''},
            ${b.cover_url || ''}, ${b.category || 'news'}, ${!!b.published}, ${!!b.featured}, ${b.published_at || new Date().toISOString()})
    RETURNING *`;
  return NextResponse.json(rows[0]);
}
