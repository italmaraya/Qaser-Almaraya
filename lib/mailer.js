import nodemailer from 'nodemailer';
import { IQD_PER_USD } from './exchangeRate';

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
 * Sends the visa application notification email — this is the message that
 * actually reaches the provider. Only ever call this AFTER a staff member
 * has verified payment; never at initial submission time.
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

  // The cost here is what we've agreed to pay this specific provider per
  // traveler (visa_cards.adult_cost/child_cost) — not the customer's selling
  // price. Providers are quoted in USD regardless of which currency the
  // admin entered the cost in internally, so IQD figures are converted here.
  const adultCostRaw = Number(application.adult_cost) || 0;
  const childCostRaw = Number(application.child_cost) || 0;
  const toUsd = (n) => (application.cost_currency === 'USD' ? n : n / IQD_PER_USD);
  const adultCost = toUsd(adultCostRaw);
  const childCost = toUsd(childCostRaw);
  const adultCount = Number(application.adult_count) || 0;
  const childCount = Number(application.child_count) || 0;
  const totalCost = adultCost * adultCount + childCost * childCount;
  const fmtUsd = (n) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const costLines = (adultCostRaw || childCostRaw)
    ? `تكلفة البالغ: ${fmtUsd(adultCost)}\nتكلفة الطفل: ${fmtUsd(childCost)}\nالإجمالي (${adultCount} بالغ${childCount ? ' / ' + childCount + ' طفل' : ''}): ${fmtUsd(totalCost)}\n`
    : '';

  const text = `طلب تأشيرة جديد

الدولة: ${application.country_name_ar}
النوع: ${application.visa_type_name_ar}
اسم العميل: ${application.customer_name}
عدد البالغين: ${application.adult_count}
عدد الأطفال: ${application.child_count}
${costLines}
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

/**
 * Sends a staff-only heads-up that a new application needs its payment
 * checked before anything goes to a provider. Never includes provider info,
 * and is never sent to the customer or the provider — internal team inbox only.
 */
/**
 * Sends the staff-only notification for a new package booking. Same rule as
 * visa applications: this never goes to a supplier — it just tells the team
 * a payment needs checking before the booking is confirmed.
 */
export async function sendPackageBookingNotice({ booking, pkg }) {
  const to = process.env.NOTIFY_EMAIL || process.env.GMAIL_USER;
  if (!to) return { skipped: true };

  const transporter = getTransporter();
  const from = process.env.GMAIL_USER;

  const text = `حجز باقة جديد بانتظار مراجعة الدفع

رقم الحجز: QP-${String(booking.id).padStart(6, '0')}
الباقة: ${pkg.title_ar} (${pkg.dest_ar})
عدد البالغين: ${booking.adult_count}
عدد الأطفال: ${booking.child_count}
الإجمالي: ${booking.total_price} $

يرجى فتح لوحة التحكم، التحقق من الدفع، ثم تأكيد الحجز يدوياً.
`;

  await transporter.sendMail({
    from,
    to,
    subject: `حجز باقة بانتظار المراجعة — ${pkg.title_ar}`,
    text,
  });

  return { sent: true };
}

export async function sendPaymentReviewNotice({ application }) {
  const to = process.env.NOTIFY_EMAIL || process.env.GMAIL_USER;
  if (!to) return { skipped: true };

  const transporter = getTransporter();
  const from = process.env.GMAIL_USER;

  const text = `طلب تأشيرة جديد بانتظار مراجعة الدفع

رقم الطلب: QA-${String(application.id).padStart(6, '0')}
الدولة: ${application.country_name_ar}
النوع: ${application.visa_type_name_ar}
اسم العميل: ${application.customer_name}

هذا الطلب لن يُرسَل إلى مزود الخدمة تلقائياً. يرجى فتح لوحة التحكم، التحقق من الدفع، ثم الموافقة عليه يدوياً.
`;

  await transporter.sendMail({
    from,
    to,
    subject: `بانتظار مراجعة الدفع — ${application.country_name_ar} / ${application.visa_type_name_ar}`,
    text,
  });

  return { sent: true };
}

/**
 * Sends a notification email for a contact-form submission.
 */
export async function sendContactEmail({ name, phone, email, company, subject, message }) {
  const transporter = getTransporter();
  const from = process.env.GMAIL_USER;
  const to = process.env.NOTIFY_EMAIL || process.env.GMAIL_USER;

  const text = `رسالة جديدة من نموذج التواصل

الاسم: ${name}
الهاتف: ${phone || '-'}
البريد الإلكتروني: ${email}
الشركة: ${company || '-'}
الموضوع: ${subject || '-'}

الرسالة:
${message}
`;

  await transporter.sendMail({
    from,
    to,
    replyTo: email,
    subject: `رسالة تواصل جديدة — ${subject || 'استفسار'}`,
    text,
  });

  return { sent: true };
}

/**
 * Sends a notification email for a job application, with links to the uploaded files.
 */
export async function sendJobApplicationEmail({ job, name, phone, email, bring, cvUrl, coverUrl, workUrl }) {
  const transporter = getTransporter();
  const from = process.env.GMAIL_USER;
  const to = process.env.NOTIFY_EMAIL || process.env.GMAIL_USER;

  const text = `طلب توظيف جديد — ${job || 'تقديم عام'}

الاسم: ${name}
الهاتف: ${phone}
البريد الإلكتروني: ${email}

ما الذي يمكنه إضافته لفريقنا:
${bring}

السيرة الذاتية: ${cvUrl}
رسالة التقديم: ${coverUrl}
${workUrl ? 'نماذج من الأعمال: ' + workUrl : ''}
`;

  await transporter.sendMail({
    from,
    to,
    replyTo: email,
    subject: `طلب توظيف جديد — ${job || 'تقديم عام'}`,
    text,
  });

  return { sent: true };
}
