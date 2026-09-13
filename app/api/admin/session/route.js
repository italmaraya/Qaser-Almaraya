import { NextResponse } from 'next/server';
import { getSessionRole, SESSION_COOKIE } from '../../../../lib/session';

export async function GET(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const role = await getSessionRole(token);
  return NextResponse.json({ authenticated: !!role, role: role || null });
}
