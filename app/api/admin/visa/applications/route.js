import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAuth } from '../../../../../lib/session';
import { IQD_PER_USD } from '../../../../../lib/exchangeRate';

export async function GET(request) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();

  // Lazy cleanup: a "pay at the office" application that's still awaiting
  // review 24 hours after submission means the customer never showed up to
  // pay, so it's auto-removed here. This runs opportunistically whenever
  // staff open this list, which needs no separate cron/infrastructure.
  // Applications with an uploaded payment proof are never auto-deleted this
  // way — those always wait for an explicit staff decision.
  await sql`
    DELETE FROM visa_applications
    WHERE payment_status = 'awaiting_review'
      AND payment_method = 'office'
      AND submitted_at < now() - interval '24 hours'
  `;

  const apps = await sql`
    SELECT a.*, c.name_ar AS country_name_ar, vt.name_ar AS visa_type_name_ar,
           vc.issuing_time_days, vc.adult_cost, vc.child_cost, vc.cost_currency, vc.adult_price, vc.child_price,
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
    let internal_cost_total = (Number(a.adult_cost) || 0) * (Number(a.adult_count) || 0) + (Number(a.child_cost) || 0) * (Number(a.child_count) || 0);
    // The admin may have entered this card's internal cost in USD — convert
    // to IQD here so the badge always reads in one consistent currency.
    if (a.cost_currency === 'USD') internal_cost_total *= IQD_PER_USD;
    return { ...a, is_delayed: isDelayed, internal_cost_total };
  });

  return NextResponse.json(withDelay);
}
