import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/session';

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`SELECT * FROM packages ORDER BY sort_order ASC, id ASC`;
  return NextResponse.json(rows);
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const b = await request.json();
  const rows = await sql`
    INSERT INTO packages (
      cat, countries, dest_ar, dest_en, title_ar, title_en, nights_ar, nights_en,
      departs_ar, departs_en, price, child_price, adult_cost, child_cost, cost_currency,
      badge_ar, badge_en, prefs,
      includes_ar, includes_en, hotels, flights, days, image_url, active, sort_order, iqd_migrated, rating
    ) VALUES (
      ${b.cat || 'family'}, ${JSON.stringify(b.countries || [])}, ${b.dest_ar || ''}, ${b.dest_en || ''},
      ${b.title_ar || ''}, ${b.title_en || ''}, ${b.nights_ar || ''}, ${b.nights_en || ''},
      ${b.departs_ar || ''}, ${b.departs_en || ''}, ${b.price || 0}, ${b.child_price || 0},
      ${b.adult_cost || 0}, ${b.child_cost || 0}, ${b.cost_currency || 'IQD'},
      ${b.badge_ar || ''}, ${b.badge_en || ''}, ${JSON.stringify(b.prefs || [])},
      ${JSON.stringify(b.includes_ar || [])}, ${JSON.stringify(b.includes_en || [])},
      ${JSON.stringify(b.hotels || [])}, ${JSON.stringify(b.flights || [])}, ${JSON.stringify(b.days || [])},
      ${b.image_url || ''}, ${b.active !== false}, ${b.sort_order || 0}, true, ${b.rating || 4.8}
    )
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
