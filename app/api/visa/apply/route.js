import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { sendPaymentReviewNotice } from '../../../../lib/mailer';

export async function POST(request) {
  await ensureSchema();
  const body = await request.json();
  const { visa_card_id, customer_name, customer_phone, customer_email, payment_method, payment_proof_url, travelers } = body || {};

  if (!visa_card_id || !customer_name || !customer_phone || !Array.isArray(travelers) || travelers.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const cards = await sql`
    SELECT vc.*, c.name_ar AS country_name_ar, c.name_en AS country_name_en,
           vt.name_ar AS visa_type_name_ar, vt.name_en AS visa_type_name_en
    FROM visa_cards vc
    LEFT JOIN countries c ON c.id = vc.country_id
    LEFT JOIN visa_types vt ON vt.id = vc.visa_type_id
    WHERE vc.id = ${visa_card_id}
  `;
  if (cards.length === 0) return NextResponse.json({ error: 'Visa not found' }, { status: 404 });
  const card = cards[0];

  const adultCount = travelers.filter((t) => t.traveler_type === 'adult').length;
  const childCount = travelers.filter((t) => t.traveler_type === 'child').length;

  // Every new application starts as 'awaiting_review' — regardless of payment
  // method — and is NEVER forwarded to the provider at this point. A customer
  // uploading an unrelated image, or simply lying about paying in person, must
  // not be able to trigger a real visa order on its own. A staff member has to
  // look at the payment proof (or confirm the office visit happened) and
  // explicitly approve it from the dashboard before anything goes to a
  // provider — see /api/admin/visa/applications/[id]/payment.
  const [application] = await sql`
    INSERT INTO visa_applications (
      visa_card_id, customer_name, customer_phone, customer_email,
      adult_count, child_count, payment_method, payment_proof_url, payment_status
    )
    VALUES (
      ${visa_card_id}, ${customer_name}, ${customer_phone}, ${customer_email || ''},
      ${adultCount}, ${childCount}, ${payment_method || ''}, ${payment_proof_url || ''}, 'awaiting_review'
    )
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

  // Notify the team's own inbox only — never the provider — so staff know a
  // new payment needs checking. This goes out no matter which payment method
  // was chosen, including "pay at the office", since that one still needs
  // someone watching for the customer to actually show up and pay.
  let emailResult = { skipped: true };
  try {
    emailResult = await sendPaymentReviewNotice({
      application: {
        ...application,
        country_name_ar: card.country_name_ar,
        visa_type_name_ar: card.visa_type_name_ar,
      },
    });
  } catch (err) {
    console.error('Failed to send payment-review notice:', err);
    emailResult = { error: err.message };
  }

  return NextResponse.json({
    ok: true,
    application_id: application.id,
    email: { sent: !!emailResult.sent, skipped: !!emailResult.skipped, error: emailResult.error ? true : undefined },
  });
}
