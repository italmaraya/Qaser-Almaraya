import { NextResponse } from 'next/server';
import { clientIp, rateLimit, tooMany } from '../../../lib/security';
import { sendContactEmail } from '../../../lib/mailer';

export async function POST(request) {
  {
    const rl = await rateLimit('contact:' + clientIp(request), 6, 3600);
    if (!rl.ok) return tooMany(NextResponse, rl.retryAfter, 'أرسلت رسائل كثيرة. حاول مرة أخرى بعد ساعة.');
  }
  const body = await request.json().catch(() => ({}));
  const { name, phone, email, company, subject, message } = body || {};

  if (!name || !name.trim() || !email || !email.trim() || !message || !message.trim()) {
    return NextResponse.json({ error: 'يرجى تعبئة الاسم والبريد الإلكتروني والسؤال' }, { status: 400 });
  }

  try {
    await sendContactEmail({ name, phone, email, company, subject, message });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact form email failed:', err);
    return NextResponse.json({ error: 'تعذر إرسال الرسالة، حاول لاحقاً' }, { status: 500 });
  }
}
 
