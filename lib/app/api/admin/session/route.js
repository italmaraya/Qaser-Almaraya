import { NextResponse } from 'next/server';
import { isValidSession, SESSION_COOKIE } from '../../../../lib/session';

export async function GET(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = await isValidSession(token);
  return NextResponse.json({ authenticated });
}
