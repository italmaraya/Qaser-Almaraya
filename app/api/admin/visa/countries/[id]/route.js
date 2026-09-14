import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../../lib/db';
import { requireAdmin } from '../../../../../../lib/session';

export async function PUT(request, { params }) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const { name_ar, name_en, region, flag_code, card_image_url } = await request.json();
  const rows = await sql`
    UPDATE countries SET name_ar = ${name_ar}, name_en = ${name_en}, region = ${region || ''}, flag_code = ${flag_code || ''}, card_image_url = ${card_image_url || ''}
    WHERE id = ${id} RETURNING *
  `;
  return NextResponse.json(rows[0] || {});
}

export async function DELETE(request, { params }) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  await sql`DELETE FROM countries WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
