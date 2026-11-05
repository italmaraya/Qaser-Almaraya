import { NextResponse } from 'next/server';
import { clientIp, rateLimit, tooMany } from '../../../lib/security';
import { sendContactEmail } from '../../../lib/mailer';
import { sendContactToDesk } from '../../../lib/deskWebForm';

export async function POST(request) {
  {
    const rl = await rateLimit('contact:' + clientIp(request), 6, 3600);
    if (!rl.ok) return tooMany(NextResponse, rl.retryAfter, 'أرسلت رسائل كثيرة. حاول مرة أخرى بعد ساعة.');
  }
  const body = await request.json().catch(() => ({}));
  const { name, phone, email, company, subject, message } = body || {};

  // Phone is the main way staff reach customers; email is optional.
  const str = (v) => (typeof v === 'string' ? v.trim() : '');
  if (!str(name) || !str(phone) || !str(message)) {
    return NextResponse.json({ error: 'يرجى تعبئة الاسم ورقم الهاتف والسؤال' }, { status: 400 });
  }
  if (str(phone).replace(/\D/g, '').length < 7) {
    return NextResponse.json({ error: 'يرجى كتابة رقم هاتف صحيح' }, { status: 400 });
  }

  // Two copies: a Desk ticket (so staff see it with the other customer
  // conversations) and the existing email. The visitor sees success if either
  // arrived.
  const payload = { name, phone, email, company, subject, message };
  const [desk, mail] = await Promise.allSettled([sendContactToDesk(payload), sendContactEmail(payload)]);
  if (desk.status === 'rejected') console.error('Contact form → Desk failed:', desk.reason);
  if (mail.status === 'rejected') console.error('Contact form email failed:', mail.reason);
  const deskOk = desk.status === 'fulfilled' && !desk.value?.skipped;
  if (deskOk || mail.status === 'fulfilled') return NextResponse.json({ ok: true, desk: deskOk });
  return NextResponse.json({ error: 'تعذر إرسال الرسالة، حاول لاحقاً' }, { status: 500 });
}
 
