import { NextResponse } from 'next/server';
import { getContent, saveContent } from '../../../../lib/content';
import { isValidSession, SESSION_COOKIE } from '../../../../lib/session';

export async function GET() {
  const content = await getContent();
  return NextResponse.json(content);
}

export async function PUT(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = await isValidSession(token);
  if (!authenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const saved = await saveContent(body);
  return NextResponse.json(saved);
}
