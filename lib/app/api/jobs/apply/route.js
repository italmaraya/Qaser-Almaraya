import { NextResponse } from 'next/server';
import { sendJobApplicationEmail } from '../../../../lib/mailer';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { job, name, phone, email, bring, cvUrl, coverUrl, workUrl } = body || {};

  if (!name || !phone || !email || !bring || !cvUrl || !coverUrl) {
    return NextResponse.json({ error: 'يرجى تعبئة جميع الحقول المطلوبة ورفع الملفات المطلوبة' }, { status: 400 });
  }

  try {
    await sendJobApplicationEmail({ job, name, phone, email, bring, cvUrl, coverUrl, workUrl });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Job application email failed:', err);
    return NextResponse.json({ error: 'تعذر إرسال الطلب، حاول لاحقاً' }, { status: 500 });
  }
}
