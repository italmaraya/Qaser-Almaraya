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

/**
 * Sends a staff-only heads-up that a new application needs its payment
 * checked before anything goes to a provider. Never includes provider info,
 * and is never sent to the customer or the provider — internal team inbox only.
 */
export async function sendPaymentReviewNotice({ application }) {
  const to = process.env.NOTIFY_EMAIL || process.env.GMAIL_USER;
  if (!to) return { skipped: true };

  const transporter = getTransporter();
  const from = process.env.GMAIL_USER;

  const methodLabel = application.payment_method === 'office' ? 'الدفع في المكتب' : (application.payment_method || 'غير محدد');

  const text = `طلب تأشيرة جديد بانتظار مراجعة الدفع

رقم الطلب: QA-${String(application.id).padStart(6, '0')}
الدولة: ${application.country_name_ar}
النوع: ${application.visa_type_name_ar}
اسم العميل: ${application.customer_name}
الهاتف: ${application.customer_phone}
طريقة الدفع: ${methodLabel}
${application.payment_proof_url ? 'إشعار الدفع: ' + application.payment_proof_url : 'لم يُرفَق إشعار دفع (الدفع في المكتب)'}

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
