import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';

export async function GET() {
  await ensureSchema();
  const rows = await sql`
    SELECT * FROM tour_countries ORDER BY region_ar ASC, sort_order ASC, id ASC
  `;
  return NextResponse.json(rows);
}
