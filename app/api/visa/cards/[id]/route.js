import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';

export async function GET(request, { params }) {
  await ensureSchema();
  const { id } = await params;
  // Only select customer-safe fields here — this is a public endpoint.
  // Internal cost, provider name/email, and send method must never leave
  // the server; those are staff-only details managed in the admin dashboard.
  const cards = await sql`
    SELECT vc.id, vc.country_id, vc.visa_type_id, vc.stay_duration, vc.issuing_time_days,
           vc.validity_before_travel, vc.adult_price, vc.child_price, vc.booking_notes, vc.image_url,
           c.name_ar AS country_name_ar, c.name_en AS country_name_en, c.flag_code,
           vt.name_ar AS visa_type_name_ar, vt.name_en AS visa_type_name_en,
           vt.needs_appointment, vt.delivers_visa_file, vt.collects_passport, vt.prepares_papers, vt.result_guaranteed
    FROM visa_cards vc
    LEFT JOIN countries c ON c.id = vc.country_id
    LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
    WHERE vc.id = ${id} AND vc.active = true
  `;
  if (cards.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const documents = await sql`
    SELECT * FROM visa_documents WHERE visa_card_id = ${id} ORDER BY sort_order ASC, id ASC
  `;

  return NextResponse.json({ ...cards[0], documents });
}
