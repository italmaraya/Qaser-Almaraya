import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/session';

export async function GET(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`SELECT * FROM visa_types ORDER BY name_ar ASC`;
  return NextResponse.json(rows);
}

export async function POST(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const b = await request.json();
  const rows = await sql`
    INSERT INTO visa_types (name_ar, name_en, needs_appointment, delivers_visa_file, collects_passport, prepares_papers, result_guaranteed)
    VALUES (${b.name_ar}, ${b.name_en}, ${!!b.needs_appointment}, ${!!b.delivers_visa_file}, ${!!b.collects_passport}, ${!!b.prepares_papers}, ${!!b.result_guaranteed})
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
