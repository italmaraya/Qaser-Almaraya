import { NextResponse } from 'next/server';
import { publicPackage } from '../../../../lib/packagePricing';
import { getExchangeRate } from '../../../../lib/settings';
import { sql, ensureSchema } from '../../../../lib/db';
import { livePackages } from '../../../../lib/packageExpiry';

export async function GET(request, { params }) {
  await ensureSchema();
  const { id } = await params;
  const rows = await sql`SELECT * FROM packages WHERE id = ${id} AND active = true
      AND (publish_at IS NULL OR publish_at <= (now() AT TIME ZONE 'Asia/Baghdad')::date)
      AND (departure_date IS NULL OR departure_date >= (now() AT TIME ZONE 'Asia/Baghdad')::date)`;
  const live = livePackages(rows);
  if (live.length === 0) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  const rate = await getExchangeRate();
  return NextResponse.json(publicPackage(live[0], rate));
}
