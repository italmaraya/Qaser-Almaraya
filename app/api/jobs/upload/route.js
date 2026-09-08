import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB safety cap

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'لم يتم إرفاق ملف' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'الملف كبير جداً (الحد الأقصى 15 ميغابايت)' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
  const blob = await put(`job-uploads/${Date.now()}-${safeName}`, file, {
    access: 'public',
  });

  return NextResponse.json({ url: blob.url });
}
