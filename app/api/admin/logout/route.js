import { NextResponse } from 'next/server';
import { destroySession, SESSION_COOKIE } from '../../../../lib/session';

export async function POST(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  await destroySession(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
