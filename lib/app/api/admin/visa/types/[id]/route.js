import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../../lib/db';
import { requireAuth } from '../../../../../../lib/session';

export async function PUT(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const b = await request.json();
  const rows = await sql`
    UPDATE visa_types SET
      name_ar = ${b.name_ar}, name_en = ${b.name_en},
      needs_appointment = ${!!b.needs_appointment}, delivers_visa_file = ${!!b.delivers_visa_file},
      collects_passport = ${!!b.collects_passport}, prepares_papers = ${!!b.prepares_papers},
      result_guaranteed = ${!!b.result_guaranteed}
    WHERE id = ${id} RETURNING *
  `;
  return NextResponse.json(rows[0] || {});
}

export async function DELETE(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  await sql`DELETE FROM visa_types WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
