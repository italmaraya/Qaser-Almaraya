import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../../lib/db';
import { requireAuth } from '../../../../../../lib/session';

export async function PUT(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const b = await request.json();
  const rows = await sql`
    UPDATE visa_cards SET
      country_id = ${b.country_id || null},
      visa_type_id = ${b.visa_type_id || null},
      stay_duration = ${b.stay_duration || ''},
      issuing_time_days = ${b.issuing_time_days || null},
      validity_before_travel = ${b.validity_before_travel || ''},
      adult_price = ${b.adult_price || 0},
      child_price = ${b.child_price || 0},
      adult_cost = ${b.adult_cost || 0},
      child_cost = ${b.child_cost || 0},
      booking_notes = ${b.booking_notes || ''},
      image_url = ${b.image_url || ''},
      provider_id = ${b.provider_id || null},
      provider_email = ${b.provider_email || ''},
      send_method = ${b.send_method || 'provider'},
      active = ${b.active !== false}
    WHERE id = ${id} RETURNING *
  `;
  return NextResponse.json(rows[0] || {});
}

export async function DELETE(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  await sql`DELETE FROM visa_cards WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
