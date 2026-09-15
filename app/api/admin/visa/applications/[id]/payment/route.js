import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../../../lib/db';
import { requireAuth } from '../../../../../../../lib/session';
import { sendApplicationEmail } from '../../../../../../../lib/mailer';

// Both admin and staff can decide payment now (approve → sends to provider,
// reject → deletes). Staff never sees internal cost/margin fields (those are
// stripped in the applications list route), but they do need to be able to
// confirm a payment came in and act on it.
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

  // 'resend' re-sends the provider/team email using the CURRENT provider
  // configuration without touching payment_status — this is the fix for
  // "the provider email was set but it went to us instead": if the card
  // wasn't actually linked to a provider (or the provider had no email) at
  // approval time, staff can add the correct email in the "مزودو الخدمة" tab
  // and then hit resend here instead of the request being stuck.
  if (action !== 'approve' && action !== 'resend') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  const apps = await sql`
    SELECT a.*, vc.send_method, vc.provider_email, vc.provider_id,
           c.name_ar AS country_name_ar, c.name_en AS country_name_en,
           vt.name_ar AS visa_type_name_ar, vt.name_en AS visa_type_name_en,
           pr.name AS provider_name, pr.emails AS provider_emails
    FROM visa_applications a
    LEFT JOIN visa_cards vc ON vc.id = a.visa_card_id
    LEFT JOIN countries c ON c.id = vc.country_id
    LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
    LEFT JOIN providers pr ON pr.id = vc.provider_id
    WHERE a.id = ${id}
  `;
  if (apps.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const application = apps[0];

  if (action === 'approve' && application.payment_status === 'approved') {
    return NextResponse.json({ error: 'تمت الموافقة على هذا الطلب مسبقًا — استخدم "إعادة الإرسال" إذا كنت تريد إرسال البريد مجددًا' }, { status: 400 });
  }
  if (action === 'resend' && application.payment_status !== 'approved') {
    return NextResponse.json({ error: 'لا يمكن إعادة الإرسال قبل الموافقة على الدفع' }, { status: 400 });
  }

  const travelers = await sql`SELECT * FROM visa_travelers WHERE application_id = ${id} ORDER BY sort_order ASC, id ASC`;
  const answers = await sql`SELECT * FROM visa_application_answers WHERE application_id = ${id}`;
  const documents = await sql`SELECT * FROM visa_documents WHERE visa_card_id = ${application.visa_card_id}`;
  const travelersWithAnswers = travelers.map((t) => ({ ...t, answers: answers.filter((a) => a.traveler_id === t.id) }));

  // This is the ONLY place in the whole app that sends an application to a
  // provider — deliberately gated behind a human confirming real payment.
  //
  // `providerRecipients` and `teamRecipients` are tracked SEPARATELY (instead
  // of merging into one flat list right away) so we can tell — and tell the
  // admin/staff member — whether the provider side actually got an address
  // to send to. Previously these were merged silently: if a card's method
  // was "provider" (or "both") but had no provider linked, or a linked
  // provider had no email saved, providerRecipients quietly ended up empty
  // and only the always-on team notification went out — looking exactly
  // like "it got sent to us instead of the provider" with no error anywhere.
  const linkedProviderEmails = (application.provider_emails || []).map((e) => e.email).filter(Boolean);
  const cardProviderEmail = application.provider_email || '';
  const resolvedProviderEmails = cardProviderEmail ? [cardProviderEmail] : linkedProviderEmails;

  const wantsProvider = application.send_method === 'provider' || application.send_method === 'both';
  const wantsTeam = application.send_method === 'team' || application.send_method === 'both';

  const providerRecipients = wantsProvider ? resolvedProviderEmails : [];
  const teamRecipients = [];
  if (wantsTeam && process.env.GMAIL_USER) teamRecipients.push(process.env.GMAIL_USER);
  const alwaysNotify = process.env.NOTIFY_EMAIL || process.env.GMAIL_USER;
  if (alwaysNotify) teamRecipients.push(alwaysNotify);

  const recipients = [...new Set([...providerRecipients, ...teamRecipients].filter(Boolean))];
  // True failure to reach the provider: the card's send method calls for a
  // provider email but none could be resolved from either the card or its
  // linked provider record.
  const providerMisconfigured = wantsProvider && providerRecipients.length === 0;

  if (providerMisconfigured) {
    console.error(
      `visa application ${id}: send_method="${application.send_method}" requires a provider email but none is configured ` +
      `(visa_card_id=${application.visa_card_id}, provider_id=${application.provider_id || 'none'}, provider_name=${application.provider_name || 'none'}). ` +
      `Email went to team-only recipients: ${teamRecipients.join(', ') || '(none)'}.`
    );
  }

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
    console.error('Failed to send application email:', err);
    emailResult = { error: err.message };
  }

  let updated = application;
  if (action === 'approve') {
    const rows = await sql`
      UPDATE visa_applications SET payment_status = 'approved' WHERE id = ${id} RETURNING *
    `;
    updated = rows[0];
  }

  return NextResponse.json({
    ok: true,
    application: updated,
    email: {
      sent: !!emailResult.sent,
      skipped: !!emailResult.skipped,
      error: emailResult.error ? true : undefined,
      recipients,
      providerReached: !wantsProvider || providerRecipients.length > 0,
      providerRequired: wantsProvider,
      providerMisconfigured,
    },
  });
}
