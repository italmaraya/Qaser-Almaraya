import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';

export async function GET() {
  await ensureSchema();
  const rows = await sql`SELECT id, name_ar, name_en FROM nationalities ORDER BY sort_order ASC, name_ar ASC`;
  return NextResponse.json(rows);
}
