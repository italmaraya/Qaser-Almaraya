import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/session';

export async function GET(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();

  const apps = await sql`
    SELECT a.*, c.name_ar AS country_name_ar, vt.name_ar AS visa_type_name_ar,
           vc.issuing_time_days,
           s.name_ar AS status_name_ar, s.name_en AS status_name_en, s.id AS status_id,
           p.name AS provider_name,
           latest_hist.note AS latest_note
    FROM visa_applications a
    LEFT JOIN visa_cards vc ON vc.id = a.visa_card_id
    LEFT JOIN countries c ON c.id = vc.country_id
    LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
    LEFT JOIN internal_statuses s ON s.id = a.internal_status_id
    LEFT JOIN providers p ON p.id = vc.provider_id
    LEFT JOIN LATERAL (
      SELECT note FROM visa_status_history h
      WHERE h.application_id = a.id AND h.note <> ''
      ORDER BY h.changed_at DESC LIMIT 1
    ) latest_hist ON true
    ORDER BY a.submitted_at DESC
  `;

  const withDelay = apps.map((a) => {
    let isDelayed = false;
    if (a.issuing_time_days) {
      const deadline = new Date(a.submitted_at);
      deadline.setDate(deadline.getDate() + Number(a.issuing_time_days));
      isDelayed = new Date() > deadline;
    }
    return { ...a, is_delayed: isDelayed };
  });

  return NextResponse.json(withDelay);
}
