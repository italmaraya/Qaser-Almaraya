import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { isValidSession, SESSION_COOKIE } from '../../../../lib/session';

const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB safety cap — plenty for a flag/logo image

export async function POST(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = await isValidSession(token);
  if (!authenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error('admin upload: failed to read form data:', err);
    return NextResponse.json({ error: 'تعذّرت قراءة الملف المُرسَل' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'لم يتم إرفاق ملف' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: `الملف كبير جدًا (${(file.size / 1024 / 1024).toFixed(1)}MB) — الحد الأقصى 8 ميغابايت` }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
  try {
    const blob = await put(`qaser-uploads/${Date.now()}-${safeName}`, file, {
      access: 'public',
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error('admin upload: Vercel Blob put() failed:', err);
    const message =
      err && /token/i.test(String(err.message))
        ? 'تخزين الملفات (Vercel Blob) غير مُهيّأ على هذا المشروع — تحقّق من إعداد Blob Storage في Vercel'
        : 'تعذّر رفع الصورة إلى التخزين — حاول مرة أخرى بصورة أصغر';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
