import { NextResponse } from 'next/server';
import { publicPackage } from '../../../lib/packagePricing';
import { getExchangeRate } from '../../../lib/settings';
import { sql, ensureSchema } from '../../../lib/db';

export async function GET() {
  await ensureSchema();
  const rows = await sql`
    SELECT * FROM packages WHERE active = true
      AND (publish_at IS NULL OR publish_at <= (now() AT TIME ZONE 'Asia/Baghdad')::date)
      AND (departure_date IS NULL OR departure_date >= (now() AT TIME ZONE 'Asia/Baghdad')::date)
    ORDER BY sort_order ASC, id ASC
  `;
  const rate = await getExchangeRate();
  // Customer-safe: computed prices only — no settlement, commission, supplier or hidden hotels
  return NextResponse.json(rows.map((r) => publicPackage(r, rate)));
}
