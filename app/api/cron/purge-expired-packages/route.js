import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { isPurgeDue } from '../../../../lib/packageExpiry';

export const dynamic = 'force-dynamic';

// Daily job (vercel.json crons): permanently deletes packages that expired
// more than 30 days ago. Before each delete, the package's name is copied
// onto its bookings so the bookings list still shows which trip they were.
//
// Runs on production only: previews share the production database, so a
// preview must never delete anything.
function allowed(request) {
  if (process.env.VERCEL_ENV !== 'production') return false;
  const secret = process.env.CRON_SECRET;
  if (secret) return request.headers.get('authorization') === 'Bearer ' + secret;
  return /vercel-cron/i.test(request.headers.get('user-agent') || '');
}

export async function GET(request) {
  if (!allowed(request)) return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`SELECT id, title_ar, title_en, dest_ar, departure_date, available_dates FROM packages`;
  const due = rows.filter((p) => isPurgeDue(p));
  const deleted = [];
  for (const p of due) {
    await sql`
      UPDATE package_bookings
         SET pkg_title_ar = ${p.title_ar || ''}, pkg_title_en = ${p.title_en || ''}, pkg_dest_ar = ${p.dest_ar || ''}
       WHERE package_id = ${p.id}`;
    await sql`DELETE FROM packages WHERE id = ${p.id}`;
    deleted.push({ id: p.id, title_ar: p.title_ar });
  }
  if (deleted.length) console.log('purge-expired-packages deleted', JSON.stringify(deleted));
  return NextResponse.json({ deleted });
}
