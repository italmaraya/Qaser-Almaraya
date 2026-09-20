import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/session';

export async function PUT(request, { params }) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const b = await request.json();
  const rows = await sql`
    UPDATE package_reviews SET
      name_ar = ${b.name_ar || ''},
      name_en = ${b.name_en || ''},
      text_ar = ${b.text_ar || ''},
      text_en = ${b.text_en || ''},
      image_url = ${b.image_url || ''},
      rating = ${b.rating || 5},
      sort_order = ${b.sort_order || 0},
      active = ${b.active !== false}
    WHERE id = ${id}
    RETURNING *
  `;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(request, { params }) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  await sql`DELETE FROM package_reviews WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
