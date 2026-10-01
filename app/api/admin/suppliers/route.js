import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/session';
import { sql, ensureSchema } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  return NextResponse.json(await sql`SELECT id, name FROM suppliers ORDER BY name ASC`);
}

// Quick-add a supplier (returns the existing one if the name already exists)
export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { name } = await request.json().catch(() => ({}));
  const clean = String(name || '').trim();
  if (!clean) return NextResponse.json({ error: 'اسم المورد مطلوب' }, { status: 400 });
  const rows = await sql`INSERT INTO suppliers (name) VALUES (${clean}) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name`;
  return NextResponse.json(rows[0]);
}
