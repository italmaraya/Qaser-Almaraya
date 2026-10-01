import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../lib/db';
import { requireAdmin } from '../../../../lib/session';

const firstFree = (arr) => (Array.isArray(arr) ? arr.map((x, i) => { const clampAll = (o) => ['diff','diffChildBed','diffChildNoBed','diffInfant'].reduce((r,k)=>({...r,[k]:Math.max(0,Math.round(Number(o&&o[k])||0))}),{}); return i===0 ? {...x, diff:0, diffChildBed:0, diffChildNoBed:0, diffInfant:0} : {...x, ...clampAll(x)}; }) : []);
const numOrEmpty = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? '' : Math.round(Number(v)));
const cleanHotels = (arr) => (Array.isArray(arr) ? arr.map((x) => { const c = ['diff','diffChildBed','diffChildNoBed','diffInfant'].reduce((r,k)=>({...r,[k]:Math.max(0,Math.round(Number(x&&x[k])||0))}),{}); return { ...x, ...c,
  sellAdult: numOrEmpty(x && x.sellAdult), settleAdult: numOrEmpty(x && x.settleAdult), settleChildBed: numOrEmpty(x && x.settleChildBed), settleChildNoBed: numOrEmpty(x && x.settleChildNoBed), settleInfant: numOrEmpty(x && x.settleInfant),
  singleDiff: Math.max(0, Math.round(Number(x && x.singleDiff) || 0)), hidden: !!(x && x.hidden), notesAr: String((x && x.notesAr) || ''), notesEn: String((x && x.notesEn) || '') }; }) : []);
const num = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v)) : 0);
const intOrNull = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Math.round(Number(v)));
const cleanDates = (a) => (Array.isArray(a) ? a.filter((d) => d && d.date).map((d) => ({ date: String(d.date).slice(0, 10), adjust: Math.round(Number(d.adjust) || 0) })).sort((x, y) => x.date.localeCompare(y.date)) : []);
const seats = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Math.max(0, Math.round(Number(v))));
const clean = (a) => (Array.isArray(a) ? a.map((s) => String(s || '').trim()).filter(Boolean) : []);

export async function GET(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const rows = await sql`SELECT p.*, s.name AS supplier_name FROM packages p LEFT JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.sort_order ASC, p.id ASC`;
  return NextResponse.json(rows);
}

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const b = await request.json();
  const rows = await sql`
    INSERT INTO packages (
      cat, countries, dest_ar, dest_en, title_ar, title_en, nights_ar, nights_en,
      departs_ar, departs_en, price, child_price, adult_cost, child_cost, cost_currency,
      badge_ar, badge_en, prefs,
      includes_ar, includes_en, hotels, flights, days, image_url, active, sort_order, iqd_migrated, rating, pdf_banner_url, excludes_ar, excludes_en, publish_at, departure_date, seats_left,
      child_nobed_price, infant_price, child_nobed_cost, infant_cost, nights, day_count, available_dates,
      general_notes_ar, general_notes_en, price_currency, supplier_id
    ) VALUES (
      ${b.cat || 'family'}, ${JSON.stringify(b.countries || [])}, ${b.dest_ar || ''}, ${b.dest_en || ''},
      ${b.title_ar || ''}, ${b.title_en || ''}, ${b.nights_ar || ''}, ${b.nights_en || ''},
      ${b.departs_ar || ''}, ${b.departs_en || ''}, ${b.price || 0}, ${b.child_price || 0},
      ${b.adult_cost || 0}, ${b.child_cost || 0}, ${b.cost_currency || 'IQD'},
      ${b.badge_ar || ''}, ${b.badge_en || ''}, ${JSON.stringify(b.prefs || [])},
      ${JSON.stringify(b.includes_ar || [])}, ${JSON.stringify(b.includes_en || [])},
      ${JSON.stringify(cleanHotels(b.hotels))}, ${JSON.stringify(firstFree(b.flights))}, ${JSON.stringify(b.days || [])},
      ${b.image_url || ''}, ${b.active !== false}, ${b.sort_order || 0}, true, ${b.rating || 4.8}, ${b.pdf_banner_url || ''},
      ${JSON.stringify(clean(b.excludes_ar))}, ${JSON.stringify(clean(b.excludes_en))},
      ${b.publish_at || null}, ${b.departure_date || null}, ${seats(b.seats_left)},
      ${num(b.child_nobed_price)}, ${num(b.infant_price)}, ${num(b.child_nobed_cost)}, ${num(b.infant_cost)}, ${intOrNull(b.nights)}, ${intOrNull(b.day_count ?? b.days)}, ${JSON.stringify(cleanDates(b.available_dates))},
      ${String(b.general_notes_ar || '')}, ${String(b.general_notes_en || '')}, ${b.price_currency === 'USD' ? 'USD' : 'IQD'}, ${intOrNull(b.supplier_id)}
    )
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
}
