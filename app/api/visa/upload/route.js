import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB safety cap

export async function POST(request) {
  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error('visa upload: failed to read form data:', err);
    return NextResponse.json({ error: 'تعذّرت قراءة الملف المُرسَل' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'لم يتم إرفاق ملف' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: `الملف كبير جدًا (${(file.size / 1024 / 1024).toFixed(1)}MB) — الحد الأقصى 15 ميغابايت` }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
  try {
    const blob = await put(`visa-uploads/${Date.now()}-${safeName}`, file, {
      access: 'public',
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error('visa upload: Vercel Blob put() failed:', err);
    return NextResponse.json({ error: 'تعذّر رفع الملف — حاول مرة أخرى' }, { status: 500 });
  }
}
