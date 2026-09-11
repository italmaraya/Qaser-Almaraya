import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/session';

export async function GET(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const cards = await sql`
    SELECT vc.*, c.name_ar AS country_name_ar, c.name_en AS country_name_en,
           vt.name_ar AS visa_type_name_ar, vt.name_en AS visa_type_name_en,
           p.name AS provider_name
    FROM visa_cards vc
    LEFT JOIN countries c ON c.id = vc.country_id
    LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
    LEFT JOIN providers p ON p.id = vc.provider_id
    ORDER BY vc.created_at DESC
  `;
  const docs = await sql`SELECT * FROM visa_documents ORDER BY sort_order ASC, id ASC`;
  const cardsWithDocs = cards.map((c) => ({
    ...c,
    documents: docs.filter((d) => d.visa_card_id === c.id),
  }));
  return NextResponse.json(cardsWithDocs);
}

export async function POST(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const b = await request.json();
  const rows = await sql`
    INSERT INTO visa_cards (
      country_id, visa_type_id, stay_duration, issuing_time_days, validity_before_travel,
      adult_price, child_price, adult_cost, child_cost, cost_currency, booking_notes, booking_notes_en, image_url,
      provider_id, provider_email, send_method, active
    ) VALUES (
      ${b.country_id || null}, ${b.visa_type_id || null}, ${b.stay_duration || ''}, ${b.issuing_time_days || null},
      ${b.validity_before_travel || ''}, ${b.adult_price || 0}, ${b.child_price || 0}, ${b.adult_cost || 0},
      ${b.child_cost || 0}, ${b.cost_currency || 'IQD'}, ${b.booking_notes || ''}, ${b.booking_notes_en || ''}, ${b.image_url || ''}, ${b.provider_id || null},
      ${b.provider_email || ''}, ${b.send_method || 'provider'}, ${b.active !== false}
    ) RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
