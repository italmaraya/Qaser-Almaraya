import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/session';
import { sql, ensureSchema } from '../../../../../lib/db';
import { parseWorkbook } from '../../../../../lib/importGroups';

export const maxDuration = 60;

const num = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);
const intOrNull = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Math.round(Number(v)));
const firstFree = (arr) => (Array.isArray(arr) ? arr.map((x, i) => (i === 0 ? { ...x, diff: 0 } : { ...x, diff: Math.max(0, Math.round(Number(x && x.diff) || 0)) })) : []);
const cleanDates = (a) => (Array.isArray(a) ? a.filter((d) => d && d.date).map((d) => ({ date: String(d.date).slice(0, 10), adjust: Math.round(Number(d.adjust) || 0) })) : []);

// Step 1: preview — parse the file and return the programs it found (no saving)
export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form && form.get('file');
  if (!file || typeof file === 'string') return NextResponse.json({ error: 'لم يتم إرفاق ملف Excel' }, { status: 400 });
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const drafts = parseWorkbook(buf);
    // return a light preview keyed by index
    const preview = drafts.map((d, i) => ({
      i, dest: d.dest_ar, title: d.title_ar, nights: d.nights, days: d.day_count,
      date: d.available_dates[0] ? d.available_dates[0].date : '',
      hotels: d._hotelCount, price: d.price, flight: d.flights[0] ? d.flights[0].nameAr : '',
    }));
    return NextResponse.json({ ok: true, count: drafts.length, preview, drafts });
  } catch (e) {
    return NextResponse.json({ error: 'تعذّرت قراءة الملف: ' + (e.message || '') }, { status: 400 });
  }
}

// Step 2: commit — insert the selected drafts as hidden packages
export async function PUT(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { drafts } = await request.json().catch(() => ({}));
  if (!Array.isArray(drafts) || !drafts.length) return NextResponse.json({ error: 'لا توجد باقات مختارة' }, { status: 400 });
  let inserted = 0;
  for (const b of drafts) {
    try {
      await sql`
        INSERT INTO packages (
          cat, countries, dest_ar, dest_en, title_ar, title_en, nights_ar, nights_en,
          departs_ar, departs_en, price, child_price, adult_cost, child_cost, cost_currency,
          badge_ar, badge_en, prefs, includes_ar, includes_en, hotels, flights, days,
          image_url, active, sort_order, iqd_migrated, rating, pdf_banner_url, excludes_ar, excludes_en,
          publish_at, departure_date, seats_left,
          child_nobed_price, infant_price, child_nobed_cost, infant_cost, nights, day_count, available_dates
        ) VALUES (
          ${b.cat || 'family'}, ${JSON.stringify([])}, ${b.dest_ar || ''}, '', ${b.title_ar || ''}, '', '', '',
          ${b.departs_ar || ''}, '', ${num(b.price)}, ${num(b.child_price)}, ${num(b.adult_cost)}, ${num(b.child_cost)}, 'IQD',
          '', '', ${JSON.stringify([])}, ${JSON.stringify([])}, ${JSON.stringify([])},
          ${JSON.stringify(firstFree(b.hotels))}, ${JSON.stringify(firstFree(b.flights))}, ${JSON.stringify([])},
          '', false, 0, true, 4.8, '', ${JSON.stringify([])}, ${JSON.stringify([])},
          null, null, null,
          ${num(b.child_nobed_price)}, ${num(b.infant_price)}, ${num(b.child_nobed_cost)}, ${num(b.infant_cost)},
          ${intOrNull(b.nights)}, ${intOrNull(b.day_count)}, ${JSON.stringify(cleanDates(b.available_dates))}
        )`;
      inserted += 1;
    } catch (e) {
      console.error('import row failed:', b.title_ar, e.message);
    }
  }
  return NextResponse.json({ ok: true, inserted });
}
