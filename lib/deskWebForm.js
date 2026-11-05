// Sends a website contact message to Zoho Desk as a ticket, through the
// "Website contact form - Qasr" web form (Desk › Setup › Channels › Web Forms ›
// Advanced Web Form, department Customer Care). The two form keys below are the
// same public values Zoho prints in the form's embed HTML — they only allow
// creating a ticket through this one form, nothing else.
//
// Desk's web form insists on an email. When the visitor leaves it empty we
// pass a per-phone placeholder on a domain that receives no mail, so each
// customer still gets their own contact and staff reply by phone/WhatsApp.

const ENDPOINT = 'https://desk.zoho.com/support/WebToCase';
const FORM = {
  xnQsjsdp: process.env.DESK_WEBFORM_XNQSJSDP || 'edbsncd71f267dc1175c634df53b38db8a8ca',
  xmIwtLD: process.env.DESK_WEBFORM_XMIWTLD || 'edbsn8e1a8c7238c47ad5b079e227a7826c09de8d6deb1066af48a81d9fc6c9f9a0be',
};
const SITE = 'https://www.almarayagroup.iq';
const PLACEHOLDER_DOMAIN = 'noemail.almarayagroup.iq';

const clean = (v, max) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);

export function placeholderEmail(phone) {
  const digits = String(phone || '').replace(/\D/g, '').slice(-15) || 'unknown';
  return `web-${digits}@${PLACEHOLDER_DOMAIN}`;
}

export async function sendContactToDesk({ name, phone, email, company, subject, message }) {
  if (process.env.DESK_WEBFORM_DISABLED === '1') return { skipped: true };
  const realEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim()) ? String(email).trim() : '';
  const lines = [
    String(message || '').trim(),
    '',
    '— من نموذج «تواصل معنا» في موقع قصر المرايا —',
    `الاسم: ${clean(name, 120)}`,
    `الهاتف: ${clean(phone, 40)}`,
    realEmail ? `البريد: ${realEmail}` : 'البريد: لم يُكتب (تواصلوا بالهاتف أو واتساب)',
    company ? `الشركة: ${clean(company, 120)}` : '',
    `الموضوع: ${clean(subject, 80) || '-'}`,
  ].filter((l) => l !== '');

  const form = new URLSearchParams();
  form.set('xnQsjsdp', FORM.xnQsjsdp);
  form.set('xmIwtLD', FORM.xmIwtLD);
  form.set('xJdfEaS', '');
  form.set('actionType', 'Q2FzZXM=');
  form.set('returnURL', SITE + '/contact');
  form.set('Contact Name', clean(name, 120));
  form.set('Email', realEmail || placeholderEmail(phone));
  form.set('Phone', clean(phone, 40));
  form.set('Subject', `رسالة من الموقع: ${clean(subject, 60) || 'تواصل'} — ${clean(name, 60)}`);
  form.set('Description', lines.join('\n'));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      body: form,
      redirect: 'manual',
      signal: ctrl.signal,
      headers: { Referer: SITE + '/contact', Origin: SITE, 'User-Agent': 'QasrAlmaraya-Website/1.0' },
    });
    // Success = Desk redirects back to returnURL. Its error page is a 200 that
    // says "Can't submit your request".
    if (res.status >= 300 && res.status < 400) return { ok: true };
    const text = await res.text().catch(() => '');
    // Desk's own failure page says "Can't submit your request". Any other 200
    // (including its redirect page, whose scripts mention "error") is success.
    if (res.ok && !/can['’]t submit|cannot submit|unable to submit/i.test(text)) return { ok: true };
    throw new Error(`Desk web form answered ${res.status}: ${text.replace(/\s+/g, ' ').slice(0, 200)}`);
  } finally {
    clearTimeout(timer);
  }
}
