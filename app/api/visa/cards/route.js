import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';

export async function GET() {
  await ensureSchema();
  const cards = await sql`
    SELECT vc.id, vc.stay_duration, vc.issuing_time_days, vc.validity_before_travel,
           vc.adult_price, vc.child_price, vc.image_url,
           c.id AS country_id, c.name_ar AS country_name_ar, c.name_en AS country_name_en, c.flag_code, c.region,
           vt.name_ar AS visa_type_name_ar, vt.name_en AS visa_type_name_en
    FROM visa_cards vc
    LEFT JOIN countries c ON c.id = vc.country_id
    LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
    WHERE vc.active = true
    ORDER BY c.name_ar ASC
  `;
  return NextResponse.json(cards);
}
