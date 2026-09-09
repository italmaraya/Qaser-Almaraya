import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../../lib/db';
import { requireAuth } from '../../../../../../lib/session';

export async function PUT(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const { name_ar, name_en, sort_order } = await request.json();
  const rows = await sql`
    UPDATE nationalities SET name_ar = ${name_ar}, name_en = ${name_en}, sort_order = ${sort_order || 0}
    WHERE id = ${id} RETURNING *
  `;
  return NextResponse.json(rows[0] || {});
}

export async function DELETE(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  await sql`DELETE FROM nationalities WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
