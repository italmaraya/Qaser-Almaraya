import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/session';

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`SELECT * FROM package_reviews ORDER BY sort_order ASC, id ASC`;
  return NextResponse.json(rows);
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const b = await request.json();
  const rows = await sql`
    INSERT INTO package_reviews (name_ar, name_en, text_ar, text_en, image_url, rating, sort_order, active)
    VALUES (${b.name_ar || ''}, ${b.name_en || ''}, ${b.text_ar || ''}, ${b.text_en || ''}, ${b.image_url || ''}, ${b.rating || 5}, ${b.sort_order || 0}, ${b.active !== false})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
