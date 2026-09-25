import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/session';

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`SELECT * FROM countries ORDER BY name_ar ASC`;
  return NextResponse.json(rows);
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const body = await request.json();
  const { name_ar, name_en, region, flag_code, card_image_url, pdf_banner_url } = body || {};
  if (!name_ar || !name_en) {
    return NextResponse.json({ error: 'name_ar and name_en are required' }, { status: 400 });
  }
  const rows = await sql`
    INSERT INTO countries (name_ar, name_en, region, flag_code, card_image_url, pdf_banner_url)
    VALUES (${name_ar}, ${name_en}, ${region || ''}, ${flag_code || ''}, ${card_image_url || ''}, ${pdf_banner_url || ''}) RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
