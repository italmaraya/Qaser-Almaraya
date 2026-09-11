import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../../../lib/db';
import { requireAuth } from '../../../../../../../lib/session';
import { sendApplicationEmail } from '../../../../../../../lib/mailer';

export async function POST(request, { params }) {
  if (!(await requireAuth(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const { action } = await request.json().catch(() => ({}));

  if (action === 'reject') {
    // Per the requested workflow: an unconfirmed payment (fake proof, or a
    // "pay at the office" no-show) is simply removed — cascades clean up the
    // travelers/answers/history rows automatically.
    await sql`DELETE FROM visa_applications WHERE id = ${id}`;
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (action !== 'approve') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const apps = await sql`
    SELECT a.*, vc.send_method, vc.provider_email, vc.provider_id,
           c.name_ar AS country_name_ar, c.name_en AS country_name_en,
           vt.name_ar AS visa_type_name_ar, vt.name_en AS visa_type_name_en,
           p.emails AS provider_emails
    FROM visa_applications a
    LEFT JOIN visa_cards vc ON vc.id = a.visa_card_id
    LEFT JOIN countries c ON c.id = vc.country_id
    LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
    LEFT JOIN providers p ON p.id = vc.provider_id
    WHERE a.id = ${id}
  `;
  if (apps.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const application = apps[0];

  if (application.payment_status === 'approved') {
    return NextResponse.json({ error: 'تمت الموافقة على هذا الطلب مسبقًا' }, { status: 400 });
  }

  const travelers = await sql`SELECT * FROM visa_travelers WHERE application_id = ${id} ORDER BY sort_order ASC, id ASC`;
  const answers = await sql`SELECT * FROM visa_application_answers WHERE application_id = ${id}`;
  const documents = await sql`SELECT * FROM visa_documents WHERE visa_card_id = ${application.visa_card_id}`;
  const travelersWithAnswers = travelers.map((t) => ({ ...t, answers: answers.filter((a) => a.traveler_id === t.id) }));

  // This is the ONLY place in the whole app that sends an application to a
  // provider — deliberately gated behind a human confirming real payment.
  let recipients = [];
  const providerEmails = (application.provider_emails || []).map((e) => e.email).filter(Boolean);
  if (application.send_method === 'provider') recipients = application.provider_email ? [application.provider_email] : providerEmails;
  else if (application.send_method === 'team') recipients = process.env.GMAIL_USER ? [process.env.GMAIL_USER] : [];
  else if (application.send_method === 'both') {
    recipients = [...(application.provider_email ? [application.provider_email] : providerEmails), ...(process.env.GMAIL_USER ? [process.env.GMAIL_USER] : [])];
  }
  const alwaysNotify = process.env.NOTIFY_EMAIL || process.env.GMAIL_USER;
  if (alwaysNotify && !recipients.includes(alwaysNotify)) recipients.push(alwaysNotify);
  recipients = [...new Set(recipients.filter(Boolean))];

  let emailResult = { skipped: true };
  try {
    emailResult = await sendApplicationEmail({
      recipients,
      application: {
        ...application,
        travelers: travelersWithAnswers,
        documents,
      },
    });
  } catch (err) {
    console.error('Failed to send application email on approval:', err);
    emailResult = { error: err.message };
  }

  const [updated] = await sql`
    UPDATE visa_applications SET payment_status = 'approved' WHERE id = ${id} RETURNING *
  `;

  return NextResponse.json({
    ok: true,
    application: updated,
    email: { sent: !!emailResult.sent, skipped: !!emailResult.skipped, error: emailResult.error ? true : undefined },
  });
}
