import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { sendApplicationEmail } from '../../../../lib/mailer';

export async function POST(request) {
  await ensureSchema();
  const body = await request.json();
  const { visa_card_id, customer_name, customer_phone, customer_email, payment_method, travelers } = body || {};

  if (!visa_card_id || !customer_name || !customer_phone || !Array.isArray(travelers) || travelers.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const cards = await sql`
    SELECT vc.*, c.name_ar AS country_name_ar, c.name_en AS country_name_en,
           vt.name_ar AS visa_type_name_ar, vt.name_en AS visa_type_name_en,
           p.name AS provider_name, p.emails AS provider_emails
    FROM visa_cards vc
    LEFT JOIN countries c ON c.id = vc.country_id
    LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
    LEFT JOIN providers p ON p.id = vc.provider_id
    WHERE vc.id = ${visa_card_id}
  `;
  if (cards.length === 0) return NextResponse.json({ error: 'Visa not found' }, { status: 404 });
  const card = cards[0];

  const documents = await sql`SELECT * FROM visa_documents WHERE visa_card_id = ${visa_card_id}`;

  const adultCount = travelers.filter((t) => t.traveler_type === 'adult').length;
  const childCount = travelers.filter((t) => t.traveler_type === 'child').length;

  const [application] = await sql`
    INSERT INTO visa_applications (visa_card_id, customer_name, customer_phone, customer_email, adult_count, child_count, payment_method)
    VALUES (${visa_card_id}, ${customer_name}, ${customer_phone}, ${customer_email || ''}, ${adultCount}, ${childCount}, ${payment_method || ''})
    RETURNING *
  `;

  const savedTravelers = [];
  for (let i = 0; i < travelers.length; i++) {
    const t = travelers[i];
    const [row] = await sql`
      INSERT INTO visa_travelers (application_id, traveler_type, full_name, sort_order)
      VALUES (${application.id}, ${t.traveler_type || 'adult'}, ${t.full_name || ''}, ${i})
      RETURNING *
    `;
    const answers = [];
    for (const a of t.answers || []) {
      const [savedAnswer] = await sql`
        INSERT INTO visa_application_answers (application_id, traveler_id, visa_document_id, repeat_index, value_text, file_url)
        VALUES (${application.id}, ${row.id}, ${a.visa_document_id}, ${a.repeat_index || 0}, ${a.value_text || ''}, ${a.file_url || ''})
        RETURNING *
      `;
      answers.push(savedAnswer);
    }
    savedTravelers.push({ ...row, answers });
  }

  // Send the routing email according to the visa card's configured method.
  let recipients = [];
  const providerEmails = (card.provider_emails || []).map((e) => e.email).filter(Boolean);
  if (card.send_method === 'provider') recipients = card.provider_email ? [card.provider_email] : providerEmails;
  else if (card.send_method === 'team') recipients = process.env.GMAIL_USER ? [process.env.GMAIL_USER] : [];
  else if (card.send_method === 'both') {
    recipients = [...(card.provider_email ? [card.provider_email] : providerEmails), ...(process.env.GMAIL_USER ? [process.env.GMAIL_USER] : [])];
  }
  // send_method === 'none' -> no provider/team recipients added above, but we still
  // always notify the main team inbox below so a submission can never be silently missed.

  // Always notify the main team address, regardless of the card's own routing setting.
  const alwaysNotify = process.env.NOTIFY_EMAIL || process.env.GMAIL_USER;
  if (alwaysNotify && !recipients.includes(alwaysNotify)) recipients.push(alwaysNotify);
  recipients = [...new Set(recipients.filter(Boolean))];

  let emailResult = { skipped: true };
  try {
    emailResult = await sendApplicationEmail({
      recipients,
      application: {
        ...application,
        country_name_ar: card.country_name_ar,
        visa_type_name_ar: card.visa_type_name_ar,
        travelers: savedTravelers,
        documents,
      },
    });
  } catch (err) {
    console.error('Failed to send application email:', err);
    emailResult = { error: err.message };
  }

  return NextResponse.json({ ok: true, application_id: application.id, email: emailResult });
}
