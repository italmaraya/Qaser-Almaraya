import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/session';

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`SELECT * FROM tour_regions ORDER BY sort_order ASC, id ASC`;
  return NextResponse.json(rows);
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const b = await request.json();
  const rows = await sql`
    INSERT INTO tour_regions (region_ar, region_en, image_url, deal_text_ar, deal_text_en, sort_order)
    VALUES (${b.region_ar || ''}, ${b.region_en || ''}, ${b.image_url || ''}, ${b.deal_text_ar || ''}, ${b.deal_text_en || ''}, ${b.sort_order || 0})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
