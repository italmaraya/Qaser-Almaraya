import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../../lib/db';
import { requireAuth } from '../../../../../../lib/session';

export async function PUT(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const b = await request.json();
  const rows = await sql`
    UPDATE visa_documents SET
      sort_order = ${b.sort_order || 0},
      name_ar = ${b.name_ar || ''},
      name_en = ${b.name_en || ''},
      kind = ${b.kind || 'file'},
      choices = ${JSON.stringify(b.choices || [])},
      required = ${b.required !== false},
      audience = ${b.audience || 'everyone'},
      condition_field_id = ${b.condition_field_id || null},
      condition_value = ${b.condition_value || ''}
    WHERE id = ${id} RETURNING *
  `;
  return NextResponse.json(rows[0] || {});
}

export async function DELETE(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  await sql`DELETE FROM visa_documents WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
