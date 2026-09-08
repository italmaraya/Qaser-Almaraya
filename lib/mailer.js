import nodemailer from 'nodemailer';

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD environment variables are not set.');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

/**
 * Sends the visa application notification email.
 * `recipients` is an array of plain email address strings.
 * `application` is the full application record (with card, travelers, answers already loaded).
 */
export async function sendApplicationEmail({ recipients, application }) {
  if (!recipients || recipients.length === 0) return { skipped: true };

  const transporter = getTransporter();
  const from = process.env.GMAIL_USER;

  const travelerBlocks = application.travelers
    .map((t) => {
      const answerLines = t.answers
        .map((a) => {
          const doc = application.documents.find((d) => d.id === a.visa_document_id);
          const docName = doc ? doc.name_ar : 'مستند';
          if (a.file_url) {
            return `  - ${docName}: ${a.file_url}`;
          }
          return `  - ${docName}: ${a.value_text || ''}`;
        })
        .join('\n');
      return `${t.traveler_type === 'adult' ? 'بالغ' : 'طفل'} — ${t.full_name}\n${answerLines}`;
    })
    .join('\n\n');

  const text = `طلب تأشيرة جديد

الدولة: ${application.country_name_ar}
النوع: ${application.visa_type_name_ar}
اسم العميل: ${application.customer_name}
الهاتف: ${application.customer_phone}
البريد: ${application.customer_email}
عدد البالغين: ${application.adult_count}
عدد الأطفال: ${application.child_count}
طريقة الدفع: ${application.payment_method || '-'}

المستندات المرفوعة:

${travelerBlocks}
`;

  await transporter.sendMail({
    from,
    to: recipients.join(','),
    subject: `طلب تأشيرة جديد — ${application.country_name_ar} / ${application.visa_type_name_ar}`,
    text,
  });

  return { sent: true, recipients };
}
