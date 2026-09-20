import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';

export async function GET() {
  await ensureSchema();
  const rows = await sql`SELECT * FROM tour_regions ORDER BY sort_order ASC, id ASC`;
  return NextResponse.json(rows);
}
