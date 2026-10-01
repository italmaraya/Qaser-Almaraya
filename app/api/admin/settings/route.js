import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/session';
import { getExchangeRate, setSetting, clearRateCache } from '../../../../lib/settings';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  return NextResponse.json({ usd_iqd_rate: await getExchangeRate() });
}

export async function PUT(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const rate = Number(b.usd_iqd_rate);
  if (!(rate > 0)) return NextResponse.json({ error: 'أدخل سعر صرف صحيحاً' }, { status: 400 });
  await setSetting('usd_iqd_rate', Math.round(rate));
  clearRateCache();
  return NextResponse.json({ ok: true, usd_iqd_rate: Math.round(rate) });
}
