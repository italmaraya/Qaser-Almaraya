import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/session';
import { getExchangeRate, setSetting, clearRateCache } from '../../../../lib/settings';
import { sql, ensureSchema } from '../../../../lib/db';
import { syncedPriceColumns } from '../../../../lib/packagePricing';

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

  // The customer-facing site recomputes USD prices on every request, but the
  // stored price columns (read by the dashboard list, the staff screens and
  // the Excel exports) are only written when a package is saved. Re-sync them
  // here so one rate change updates every screen, not just the website.
  let repriced = 0;
  try {
    await ensureSchema();
    const rows = await sql`SELECT * FROM packages WHERE price_currency = 'USD' OR cost_currency = 'USD'`;
    for (const pkg of rows) {
      const px = syncedPriceColumns(pkg, Math.round(rate));
      if (px.price === Number(pkg.price) && px.child_price === Number(pkg.child_price)
          && px.child_nobed_price === Number(pkg.child_nobed_price) && px.infant_price === Number(pkg.infant_price)) continue;
      await sql`UPDATE packages SET price = ${px.price}, child_price = ${px.child_price},
                child_nobed_price = ${px.child_nobed_price}, infant_price = ${px.infant_price} WHERE id = ${pkg.id}`;
      repriced++;
    }
  } catch (e) {
    // A failure here must not lose the saved rate — the website is already correct.
    return NextResponse.json({ ok: true, usd_iqd_rate: Math.round(rate), repriced, warning: 'تم حفظ سعر الصرف، لكن تعذّرت إعادة حساب الأسعار المخزّنة' });
  }
  return NextResponse.json({ ok: true, usd_iqd_rate: Math.round(rate), repriced });
}
