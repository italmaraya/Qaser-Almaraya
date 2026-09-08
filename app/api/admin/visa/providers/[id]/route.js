import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../../lib/db';
import { requireAuth } from '../../../../../../lib/session';

export async function PUT(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const b = await request.json();
  const rows = await sql`
    UPDATE providers SET name = ${b.name}, emails = ${JSON.stringify(b.emails || [])}
    WHERE id = ${id} RETURNING *
  `;
  return NextResponse.json(rows[0] || {});
}

export async function DELETE(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  await sql`DELETE FROM providers WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
