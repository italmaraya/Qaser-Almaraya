import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../lib/db';

export async function GET() {
  await ensureSchema();
  const rows = await sql`
    SELECT * FROM packages WHERE active = true
      AND (publish_at IS NULL OR publish_at <= (now() AT TIME ZONE 'Asia/Baghdad')::date)
      AND (departure_date IS NULL OR departure_date >= (now() AT TIME ZONE 'Asia/Baghdad')::date)
    ORDER BY sort_order ASC, id ASC
  `;
  return NextResponse.json(rows);
}
