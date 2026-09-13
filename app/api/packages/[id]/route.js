import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';

export async function GET(request, { params }) {
  await ensureSchema();
  const { id } = await params;
  const rows = await sql`SELECT * FROM packages WHERE id = ${id} AND active = true`;
  if (rows.length === 0) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}
