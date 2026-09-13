import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/session';

export async function GET(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const bookings = await sql`
    SELECT b.*, p.title_ar AS package_title_ar, p.title_en AS package_title_en, p.dest_ar AS package_dest_ar
    FROM package_bookings b
    LEFT JOIN packages p ON p.id = b.package_id
    ORDER BY b.submitted_at DESC
  `;
  const travelers = await sql`SELECT * FROM package_travelers ORDER BY sort_order ASC`;
  const withTravelers = bookings.map((b) => ({
    ...b,
    travelers: travelers.filter((t) => t.booking_id === b.id),
  }));
  return NextResponse.json(withTravelers);
}
