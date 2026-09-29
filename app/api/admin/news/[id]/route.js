import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/session';
import { sql, ensureSchema } from '../../../../../lib/db';
import { slugify } from '../../../../../lib/news';

export async function PUT(request, { params }) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const b = await request.json().catch(() => ({}));
  if (!String(b.title_ar || '').trim()) return NextResponse.json({ error: 'العنوان بالعربية مطلوب' }, { status: 400 });
  let slug = slugify(b.slug || b.title_en || b.title_ar, 'post-' + id);
  const clash = await sql`SELECT 1 FROM news_posts WHERE slug = ${slug} AND id <> ${id}`;
  if (clash.length) slug = slug + '-' + id;
  const rows = await sql`
    UPDATE news_posts SET slug = ${slug}, title_ar = ${b.title_ar || ''}, title_en = ${b.title_en || ''},
      excerpt_ar = ${b.excerpt_ar || ''}, excerpt_en = ${b.excerpt_en || ''}, body_ar = ${b.body_ar || ''}, body_en = ${b.body_en || ''},
      cover_url = ${b.cover_url || ''}, category = ${b.category || 'news'}, published = ${!!b.published}, featured = ${!!b.featured},
      published_at = ${b.published_at || new Date().toISOString()}, updated_at = now()
    WHERE id = ${id} RETURNING *`;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(request, { params }) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  await sql`DELETE FROM news_posts WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
