import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/session';

export async function PUT(request, { params }) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const b = await request.json();
  const rows = await sql`
    UPDATE tour_regions SET
      region_ar = ${b.region_ar || ''},
      region_en = ${b.region_en || ''},
      image_url = ${b.image_url || ''},
      deal_text_ar = ${b.deal_text_ar || ''},
      deal_text_en = ${b.deal_text_en || ''},
      sort_order = ${b.sort_order || 0}
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
  await sql`DELETE FROM tour_regions WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
