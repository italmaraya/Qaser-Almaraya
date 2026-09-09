import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/session';

export async function GET(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`SELECT * FROM providers ORDER BY name ASC`;
  return NextResponse.json(rows);
}

export async function POST(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const b = await request.json();
  const rows = await sql`
    INSERT INTO providers (name, emails) VALUES (${b.name}, ${JSON.stringify(b.emails || [])}) RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
