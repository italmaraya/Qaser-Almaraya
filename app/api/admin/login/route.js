import { NextResponse } from 'next/server';
import { clientIp, loginLocked, loginFailed, loginSucceeded, tooMany } from '../../../../lib/security';
import { resolveRole, createSession, SESSION_COOKIE } from '../../../../lib/session';

export async function POST(request) {
  const ip = clientIp(request);
  const locked = await loginLocked(ip);
  if (locked) return tooMany(NextResponse, locked, `تم إيقاف تسجيل الدخول مؤقتاً بسبب محاولات خاطئة كثيرة. حاول بعد ${Math.ceil(locked / 60)} دقيقة.`);
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { password } = body || {};
  const role = resolveRole(password);

  if (!role) {
    await loginFailed(ip);
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  let token;
  try {
    token = await createSession(role);
  } catch (err) {
    console.error('Login succeeded but session creation failed:', err);
    return NextResponse.json(
      { error: 'Password was correct, but the database connection failed. Check your Redis setup.' },
      { status: 500 }
    );
  }

  await loginSucceeded(ip);
  const response = NextResponse.json({ ok: true, role });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
