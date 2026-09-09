import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../../../lib/db';
import { requireAuth } from '../../../../../../../lib/session';

export async function POST(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const { internal_status_id, note } = await request.json();

  const rows = await sql`
    UPDATE visa_applications SET internal_status_id = ${internal_status_id || null}, updated_at = now()
    WHERE id = ${id} RETURNING *
  `;
  await sql`
    INSERT INTO visa_status_history (application_id, internal_status_id, changed_by, note)
    VALUES (${id}, ${internal_status_id || null}, 'admin', ${note || ''})
  `;

  return NextResponse.json(rows[0] || {});
}
