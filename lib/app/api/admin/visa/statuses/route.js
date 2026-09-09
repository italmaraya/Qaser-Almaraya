import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/session';

export async function GET(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const internal = await sql`SELECT * FROM internal_statuses ORDER BY sort_order ASC, id ASC`;
  const customer = await sql`SELECT * FROM customer_statuses ORDER BY sort_order ASC, id ASC`;
  return NextResponse.json({ internal, customer });
}

export async function POST(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const b = await request.json();
  // action: 'add_internal' | 'add_customer' | 'update_internal' | 'update_customer' | 'delete_internal' | 'delete_customer' | 'set_mapping'
  if (b.action === 'add_internal') {
    const rows = await sql`INSERT INTO internal_statuses (name_ar, name_en) VALUES (${b.name_ar}, ${b.name_en}) RETURNING *`;
    return NextResponse.json(rows[0]);
  }
  if (b.action === 'add_customer') {
    const rows = await sql`INSERT INTO customer_statuses (name_ar, name_en) VALUES (${b.name_ar}, ${b.name_en}) RETURNING *`;
    return NextResponse.json(rows[0]);
  }
  if (b.action === 'update_internal') {
    const rows = await sql`UPDATE internal_statuses SET name_ar = ${b.name_ar}, name_en = ${b.name_en} WHERE id = ${b.id} RETURNING *`;
    return NextResponse.json(rows[0] || {});
  }
  if (b.action === 'update_customer') {
    const rows = await sql`UPDATE customer_statuses SET name_ar = ${b.name_ar}, name_en = ${b.name_en} WHERE id = ${b.id} RETURNING *`;
    return NextResponse.json(rows[0] || {});
  }
  if (b.action === 'delete_internal') {
    await sql`DELETE FROM internal_statuses WHERE id = ${b.id}`;
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'delete_customer') {
    await sql`DELETE FROM customer_statuses WHERE id = ${b.id}`;
    return NextResponse.json({ ok: true });
  }
  if (b.action === 'set_mapping') {
    const rows = await sql`UPDATE internal_statuses SET customer_status_id = ${b.customer_status_id || null} WHERE id = ${b.internal_id} RETURNING *`;
    return NextResponse.json(rows[0] || {});
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
