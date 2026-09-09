import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/session';

export async function GET(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`SELECT * FROM nationalities ORDER BY sort_order ASC, name_ar ASC`;
  return NextResponse.json(rows);
}

export async function POST(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const body = await request.json();
  const { name_ar, name_en, sort_order } = body || {};
  if (!name_ar || !name_en) {
    return NextResponse.json({ error: 'name_ar and name_en are required' }, { status: 400 });
  }
  const rows = await sql`
    INSERT INTO nationalities (name_ar, name_en, sort_order)
    VALUES (${name_ar}, ${name_en}, ${sort_order || 0}) RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
