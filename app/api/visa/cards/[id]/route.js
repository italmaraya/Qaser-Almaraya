import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';

export async function GET(request, { params }) {
  await ensureSchema();
  const { id } = await params;
  const cards = await sql`
    SELECT vc.*, c.name_ar AS country_name_ar, c.name_en AS country_name_en,
           vt.name_ar AS visa_type_name_ar, vt.name_en AS visa_type_name_en
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
