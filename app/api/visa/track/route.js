import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';

export async function GET(request) {
  await ensureSchema();
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({ error: 'أدخل رقم الهاتف أو رقم الطلب' }, { status: 400 });
  }

  const orderMatch = q.match(/(\d+)/);
  let rows;

  if (/^qa-/i.test(q) && orderMatch) {
    // Looking up by order number, e.g. "QA-000012"
    const id = parseInt(orderMatch[1], 10);
    rows = await sql`
      SELECT a.id, a.customer_name, a.customer_phone, a.submitted_at, a.result_file_url,
             c.name_ar AS country_name_ar, vt.name_ar AS visa_type_name_ar,
             cs.id AS customer_status_id,
             COALESCE(cs.name_ar, 'قيد المعالجة') AS status_name_ar,
             latest_hist.note AS latest_note
      FROM visa_applications a
      LEFT JOIN visa_cards vc ON vc.id = a.visa_card_id
      LEFT JOIN countries c ON c.id = vc.country_id
      LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
      LEFT JOIN internal_statuses ist ON ist.id = a.internal_status_id
      LEFT JOIN customer_statuses cs ON cs.id = ist.customer_status_id
      LEFT JOIN LATERAL (
        SELECT note FROM visa_status_history h
        WHERE h.application_id = a.id AND h.note <> ''
        ORDER BY h.changed_at DESC LIMIT 1
      ) latest_hist ON true
      WHERE a.id = ${id}
      ORDER BY a.submitted_at DESC
    `;
  } else {
    // Looking up by phone number — compare digits only so spacing/dashes/country-code
    // formatting differences don't cause false negatives.
    rows = await sql`
      SELECT a.id, a.customer_name, a.customer_phone, a.submitted_at, a.result_file_url,
             c.name_ar AS country_name_ar, vt.name_ar AS visa_type_name_ar,
             cs.id AS customer_status_id,
             COALESCE(cs.name_ar, 'قيد المعالجة') AS status_name_ar,
             latest_hist.note AS latest_note
      FROM visa_applications a
      LEFT JOIN visa_cards vc ON vc.id = a.visa_card_id
      LEFT JOIN countries c ON c.id = vc.country_id
      LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
      LEFT JOIN internal_statuses ist ON ist.id = a.internal_status_id
      LEFT JOIN customer_statuses cs ON cs.id = ist.customer_status_id
      LEFT JOIN LATERAL (
        SELECT note FROM visa_status_history h
        WHERE h.application_id = a.id AND h.note <> ''
        ORDER BY h.changed_at DESC LIMIT 1
      ) latest_hist ON true
      WHERE regexp_replace(a.customer_phone, '[^0-9]', '', 'g') LIKE '%' || regexp_replace(${q}, '[^0-9]', '', 'g') || '%'
      ORDER BY a.submitted_at DESC
      LIMIT 10
    `;
  }

  const stages = await sql`SELECT id, name_ar FROM customer_statuses ORDER BY sort_order ASC, id ASC`;

  return NextResponse.json({ applications: rows, stages });
}
