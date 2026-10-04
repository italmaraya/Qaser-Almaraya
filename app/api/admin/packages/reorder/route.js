import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/session';

// Saves the display order of the groups: body = { ids: [id, id, ...] } in the
// order they should appear. Used by the Duplicate button so the copy sits
// right next to the original.
export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { ids } = await request.json().catch(() => ({}));
  if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ error: 'ids required' }, { status: 400 });
  const rows = ids.map((id, i) => ({ id: Number(id), sort_order: i + 1 })).filter((r) => Number.isInteger(r.id));
  await sql`
    UPDATE packages SET sort_order = (x->>'sort_order')::int
    FROM jsonb_array_elements(${JSON.stringify(rows)}::jsonb) AS x
    WHERE packages.id = (x->>'id')::int`;
  return NextResponse.json({ ok: true, count: rows.length });
}
