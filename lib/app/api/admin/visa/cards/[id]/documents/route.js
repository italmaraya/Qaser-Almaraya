import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../../../lib/db';
import { requireAuth } from '../../../../../../../lib/session';

export async function POST(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const b = await request.json();
  const rows = await sql`
    INSERT INTO visa_documents (
      visa_card_id, sort_order, name_ar, name_en, kind, choices, required, audience,
      condition_field_id, condition_value
    ) VALUES (
      ${id}, ${b.sort_order || 0}, ${b.name_ar || ''}, ${b.name_en || ''}, ${b.kind || 'file'},
      ${JSON.stringify(b.choices || [])}, ${b.required !== false}, ${b.audience || 'everyone'},
      ${b.condition_field_id || null}, ${b.condition_value || ''}
    ) RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
