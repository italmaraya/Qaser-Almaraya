import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../../lib/db';
import { requireAuth } from '../../../../../../lib/session';

export async function GET(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;

  const apps = await sql`
    SELECT a.*, c.name_ar AS country_name_ar, vt.name_ar AS visa_type_name_ar
    FROM visa_applications a
    LEFT JOIN visa_cards vc ON vc.id = a.visa_card_id
    LEFT JOIN countries c ON c.id = vc.country_id
    LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
    WHERE a.id = ${id}
  `;
  if (apps.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const application = apps[0];

  const travelers = await sql`SELECT * FROM visa_travelers WHERE application_id = ${id} ORDER BY sort_order ASC, id ASC`;
  const answers = await sql`SELECT * FROM visa_application_answers WHERE application_id = ${id}`;
  const documents = await sql`SELECT * FROM visa_documents WHERE visa_card_id = ${application.visa_card_id}`;
  const history = await sql`
    SELECT h.*, s.name_ar AS status_name_ar
    FROM visa_status_history h
    LEFT JOIN internal_statuses s ON s.id = h.internal_status_id
    WHERE h.application_id = ${id}
    ORDER BY h.changed_at ASC
  `;

  const travelersWithAnswers = travelers.map((t) => ({
    ...t,
    answers: answers.filter((a) => a.traveler_id === t.id),
  }));

  return NextResponse.json({ ...application, travelers: travelersWithAnswers, documents, history });
}
