import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/session';

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`SELECT * FROM tour_countries ORDER BY region_ar ASC, sort_order ASC, id ASC`;
  return NextResponse.json(rows);
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const b = await request.json();
  const rows = await sql`
    INSERT INTO tour_countries (name_ar, name_en, flag_code, region_ar, region_en, sort_order, lat, lng)
    VALUES (${b.name_ar || ''}, ${b.name_en || ''}, ${b.flag_code || ''}, ${b.region_ar || ''}, ${b.region_en || ''}, ${b.sort_order || 0}, ${b.lat || null}, ${b.lng || null})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
