import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { requireAuth } from '../../../../lib/session';

// This is the one place a "public" route is allowed to reveal provider
// names — and only after confirming a real admin session server-side.
// The reveal button on the live site calls this; if the visitor isn't
// logged in as staff, this simply 401s and nothing is ever sent back.
export async function GET(request) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  await ensureSchema();

  const rows = await sql`
    SELECT vc.id, p.name AS provider_name, vc.adult_cost, vc.child_cost, vc.cost_currency
    FROM visa_cards vc
    LEFT JOIN providers p ON p.id = vc.provider_id
    WHERE vc.active = true
  `;

  const out = {};
  rows.forEach((r) => {
    out[r.id] = {
      provider_name: r.provider_name || null,
      adult_cost: r.adult_cost,
      child_cost: r.child_cost,
      cost_currency: r.cost_currency,
    };
  });
  return NextResponse.json(out);
}
