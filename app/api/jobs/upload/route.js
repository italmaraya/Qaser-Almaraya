import { NextResponse } from 'next/server';
import { clientIp, rateLimit, tooMany, checkUpload } from '../../../../lib/security';
import { put } from '@vercel/blob';

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB safety cap

export async function POST(request) {
  {
    const rl = await rateLimit('upj:' + clientIp(request), 30, 3600);
    if (!rl.ok) return tooMany(NextResponse, rl.retryAfter, 'تم رفع ملفات كثيرة. حاول مرة أخرى بعد قليل.');
  }
  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error('jobs upload: failed to read form data:', err);
    return NextResponse.json({ error: 'تعذّرت قراءة الملف المُرسَل' }, { status: 400 });
  }

  const file = formData.get('file');
  const chk = await checkUpload(file, MAX_SIZE_BYTES);
  if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: 400 });

  const safeName = (file.name.replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9\-_]/g, '-').slice(0, 60) || 'file') + '.' + chk.ext;
  try {
    const blob = await put(`job-uploads/${Date.now()}-${safeName}`, file, {
      access: 'public',
      // Random code in the file address keeps uploaded documents unguessable.
      addRandomSuffix: true,
      contentType: chk.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error('jobs upload: Vercel Blob put() failed:', err);
    return NextResponse.json({ error: 'تعذّر رفع الملف — حاول مرة أخرى' }, { status: 500 });
  }
}
