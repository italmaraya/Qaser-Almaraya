import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/session';

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

export async function PUT(request, { params }) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  const b = await request.json();
  const rows = await sql`
    UPDATE packages SET
      cat = ${b.cat || 'family'},
      countries = ${JSON.stringify(b.countries || [])},
      dest_ar = ${b.dest_ar || ''}, dest_en = ${b.dest_en || ''},
      title_ar = ${b.title_ar || ''}, title_en = ${b.title_en || ''},
      nights_ar = ${b.nights_ar || ''}, nights_en = ${b.nights_en || ''},
      departs_ar = ${b.departs_ar || ''}, departs_en = ${b.departs_en || ''},
      price = ${b.price || 0}, child_price = ${b.child_price || 0},
      adult_cost = ${b.adult_cost || 0}, child_cost = ${b.child_cost || 0}, cost_currency = ${b.cost_currency || 'IQD'},
      badge_ar = ${b.badge_ar || ''}, badge_en = ${b.badge_en || ''},
      prefs = ${JSON.stringify(b.prefs || [])},
      includes_ar = ${JSON.stringify(b.includes_ar || [])}, includes_en = ${JSON.stringify(b.includes_en || [])},
      hotels = ${JSON.stringify(cleanHotels(b.hotels))}, flights = ${JSON.stringify(firstFree(b.flights))},
      days = ${JSON.stringify(b.days || [])}, image_url = ${b.image_url || ''},
      active = ${b.active !== false}, sort_order = ${b.sort_order || 0}, iqd_migrated = true, rating = ${b.rating || 4.8}, pdf_banner_url = ${b.pdf_banner_url || ''},
      excludes_ar = ${JSON.stringify(clean(b.excludes_ar))}, excludes_en = ${JSON.stringify(clean(b.excludes_en))},
      publish_at = ${b.publish_at || null}, departure_date = ${b.departure_date || null}, seats_left = ${seats(b.seats_left)},
      child_nobed_price = ${num(b.child_nobed_price)}, infant_price = ${num(b.infant_price)}, child_nobed_cost = ${num(b.child_nobed_cost)}, infant_cost = ${num(b.infant_cost)},
      nights = ${intOrNull(b.nights)}, day_count = ${intOrNull(b.day_count ?? b.days)}, available_dates = ${JSON.stringify(cleanDates(b.available_dates))},
      general_notes_ar = ${String(b.general_notes_ar || '')}, general_notes_en = ${String(b.general_notes_en || '')}, price_currency = ${b.price_currency === 'USD' ? 'USD' : 'IQD'}, supplier_id = ${intOrNull(b.supplier_id)}
    WHERE id = ${id} RETURNING *
  `;
  return NextResponse.json(rows[0] || {});
}

export async function DELETE(request, { params }) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  await ensureSchema();
  const { id } = await params;
  await sql`DELETE FROM packages WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
