import { NextResponse } from 'next/server';
import { checkPassword, createSession, SESSION_COOKIE } from '../../../../lib/session';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { password } = body || {};

  if (!checkPassword(password)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  let token;
  try {
    token = await createSession();
  } catch (err) {
    console.error('Login succeeded but session creation failed:', err);
    return NextResponse.json(
      { error: 'Password was correct, but the database connection failed. Check your Redis setup.' },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
