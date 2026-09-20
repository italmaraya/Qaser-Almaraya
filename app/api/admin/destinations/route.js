import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/session';

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`SELECT * FROM popular_destinations ORDER BY kind ASC, sort_order ASC, id ASC`;
  return NextResponse.json(rows);
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const b = await request.json();
  const rows = await sql`
    INSERT INTO popular_destinations (name_ar, name_en, kind, sort_order)
    VALUES (${b.name_ar || ''}, ${b.name_en || ''}, ${b.kind === 'most_searched' ? 'most_searched' : 'popular'}, ${b.sort_order || 0})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
