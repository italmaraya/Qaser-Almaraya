import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { isValidSession, SESSION_COOKIE } from '../../../../lib/session';

export async function POST(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = await isValidSession(token);
  if (!authenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '-');
  const blob = await put(`qaser-uploads/${Date.now()}-${safeName}`, file, {
    access: 'public',
  });

  return NextResponse.json({ url: blob.url });
}
