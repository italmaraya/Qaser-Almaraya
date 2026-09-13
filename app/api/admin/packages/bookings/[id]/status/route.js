import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../../../lib/db';
import { requireAuth } from '../../../../../../../lib/session';

export async function PATCH(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const b = await request.json();
  const fields = [];
  const values = {};
  if (b.internal_status !== undefined) values.internal_status = b.internal_status;
  if (b.payment_status !== undefined) values.payment_status = b.payment_status;

  const rows = await sql`
    UPDATE package_bookings SET
      internal_status = COALESCE(${values.internal_status ?? null}, internal_status),
      payment_status = COALESCE(${values.payment_status ?? null}, payment_status),
      updated_at = now()
    WHERE id = ${id} RETURNING *
  `;
  return NextResponse.json(rows[0] || {});
}
