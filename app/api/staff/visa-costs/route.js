import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { requireAuth } from '../../../../lib/session';

// GET only — this route intentionally has no POST/PUT/DELETE. It exists so
// staff accounts can see the internal cost side of visa pricing (what we pay
// the provider) without being able to change anything here or anywhere else.
export async function GET(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`
    SELECT
      vc.id,
      c.name_ar AS country_ar, c.name_en AS country_en,
      vt.name_ar AS visa_type_ar, vt.name_en AS visa_type_en,
      p.name AS provider_name,
      vc.adult_price, vc.child_price,
      vc.adult_cost, vc.child_cost,
      vc.cost_currency, vc.active
    FROM visa_cards vc
    LEFT JOIN countries c ON c.id = vc.country_id
    LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
    LEFT JOIN providers p ON p.id = vc.provider_id
    ORDER BY c.name_ar ASC NULLS LAST, vt.name_ar ASC NULLS LAST, vc.id ASC
  `;
  return NextResponse.json(rows);
}
