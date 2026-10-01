// ─────────────────────────────────────────────────────────────────────────
// Package pricing engine — single source of truth for the website, the PDF
// voucher, the dashboard preview and the Excel importer.
//
// NEW MODEL (per hotel, inputs only are stored):
//   sellAdult         البيع للبالغ
//   settleAdult       التسديد للبالغ
//   settleChildBed    التسديد — طفل بسرير      (empty = not offered)
//   settleChildNoBed  التسديد — طفل بدون سرير  (empty = not offered)
//   settleInfant      التسديد — رضيع           (empty = not offered)
//   singleDiff        فرق السنكل
//   notesAr/notesEn, hidden
// Formulas (Rate = USD→IQD when the package is priced in USD, else 1):
//   Commission = SellAdult − SettleAdult
//   Adult      = ROUND(SellAdult × Rate, −3)
//   ChildBed   = ROUND((SettleChildBed + Commission) × Rate, −3)
//   ChildNoBed = ROUND((SettleChildNoBed + Commission) × Rate, −3)
//   Infant     = ROUND((SettleInfant + Commission) × Rate, −3)
//   Single     = ROUND((SellAdult + SingleDiff) × Rate, −3)
// Customer "+X" differences are relative to the first VISIBLE hotel.
//
// LEGACY MODEL (packages saved before the engine): package base price per
// type + each hotel's stored difference, rebased on the first visible hotel.
// ─────────────────────────────────────────────────────────────────────────

export const TRAVELLER_TYPES = [
  { key: 'adult', priceField: 'price', costField: 'adult_cost', diffField: 'diff', ar: 'بالغ', en: 'Adult', hintAr: 'في غرفة مزدوجة', hintEn: 'double room' },
  { key: 'single', priceField: 'price', costField: 'adult_cost', diffField: 'diff', single: true, ar: 'بالغ في غرفة مفردة', en: 'Adult, single room', hintAr: 'سنكل', hintEn: 'single' },
  { key: 'childBed', priceField: 'child_price', costField: 'child_cost', diffField: 'diffChildBed', ar: 'طفل بسرير', en: 'Child with bed', hintAr: '', hintEn: '' },
  { key: 'childNoBed', priceField: 'child_nobed_price', costField: 'child_nobed_cost', diffField: 'diffChildNoBed', ar: 'طفل بدون سرير', en: 'Child without bed', hintAr: '', hintEn: '' },
  { key: 'infant', priceField: 'infant_price', costField: 'infant_cost', diffField: 'diffInfant', ar: 'رضيع', en: 'Infant', hintAr: 'أقل من سنتين', hintEn: 'under 2' },
];
export const TYPE_KEYS = TRAVELLER_TYPES.map((t) => t.key);

const n = (v) => Number(v) || 0;
const has = (v) => v !== undefined && v !== null && v !== '' && !Number.isNaN(Number(v));
export const round1000 = (v) => Math.round(n(v) / 1000) * 1000;

export function hotelHasEngine(h) { return !!h && has(h.sellAdult); }

// ── Package base price from INTERNAL COST + COMMISSION ──────────────────
// Per category: price = ROUND((cost + commission) × rate, −3).
// The admin enters the cost and the adult commission; child / infant
// commissions default to the adult commission (leave empty) and can be
// overridden. Active only once the adult commission has been entered —
// until then the package keeps using its stored selling price.
const COST_FIELD = { adult: 'adult_cost', childBed: 'child_cost', childNoBed: 'child_nobed_cost', infant: 'infant_cost' };
const COMM_FIELD = { adult: 'adult_commission', childBed: 'child_commission', childNoBed: 'child_nobed_commission', infant: 'infant_commission' };
const PRICE_FIELD = { adult: 'price', childBed: 'child_price', childNoBed: 'child_nobed_price', infant: 'infant_price' };

export function usesCostCommission(pkg) { return has(pkg && pkg.adult_commission); }
export function costRate(pkg, rate = 1) { return pkg && pkg.cost_currency === 'USD' ? n(rate) || 1 : 1; }

/** { adult, childBed, childNoBed, infant } in IQD, or null when the package uses stored prices. */
export function packageBasePrices(pkg, rate = 1) {
  if (!usesCostCommission(pkg)) return null;
  const r = costRate(pkg, rate);
  const adultComm = n(pkg.adult_commission);
  const out = {};
  for (const k of Object.keys(COST_FIELD)) {
    const cost = n(pkg[COST_FIELD[k]]);
    if (k === 'adult') out[k] = round1000((cost + adultComm) * r);
    else if (has(pkg[COMM_FIELD[k]])) out[k] = round1000((cost + n(pkg[COMM_FIELD[k]])) * r);
    else if (cost > 0) out[k] = round1000((cost + adultComm) * r); // inherits the adult commission
    else out[k] = n(pkg[PRICE_FIELD[k]]); // nothing entered for this category → keep stored price
  }
  return out;
}

/** The four stored selling-price columns, kept in sync on save (staff screens read them). */
export function syncedPriceColumns(pkg, rate = 1) {
  const b = packageBasePrices(pkg, rate);
  return {
    price: b ? b.adult : n(pkg.price),
    child_price: b ? b.childBed : n(pkg.child_price),
    child_nobed_price: b ? b.childNoBed : n(pkg.child_nobed_price),
    infant_price: b ? b.infant : n(pkg.infant_price),
  };
}
export function packageUsesEngine(pkg) { return visibleHotels(pkg).some(hotelHasEngine); }

export function rowExtra(row, type) {
  if (!row) return 0;
  const v = row[type.diffField];
  if (has(v)) return n(v);
  return n(row.diff);
}
export function singleSupplement(hotel) { return Math.max(0, n(hotel && hotel.singleDiff)); }
export function visibleHotels(pkg) { return (Array.isArray(pkg?.hotels) ? pkg.hotels : []).filter((h) => h && !h.hidden); }
export function primaryHotel(pkg) { return visibleHotels(pkg)[0] || null; }

// legacy: difference relative to the primary hotel (public data is already rebased)
function legacyExtra(pkg, hotel, type) {
  const alreadyRebased = !(Array.isArray(pkg?.hotels) && pkg.hotels.some((x) => x && x.hidden !== undefined));
  if (alreadyRebased) return rowExtra(hotel, type);
  const primary = primaryHotel(pkg);
  return primary ? rowExtra(hotel, type) - rowExtra(primary, type) : rowExtra(hotel, type);
}

/** Customer prices (IQD) + internal cost + commission for ONE hotel. null = type not offered. */
export function hotelPrices(pkg, h, rate = 1) {
  if (h && h.prices) return { prices: h.prices, cost: h.cost || null, commission: null }; // already public
  const r = pkg?.price_currency === 'USD' ? n(rate) || 1 : 1;
  if (hotelHasEngine(h)) {
    const sell = n(h.sellAdult), settleA = n(h.settleAdult), sd = singleSupplement(h);
    const commission = sell - settleA;
    const cat = (v) => (has(v) ? round1000((n(v) + commission) * r) : null);
    const cost = (v) => (has(v) ? Math.round(n(v) * r) : null);
    return {
      prices: { adult: round1000(sell * r), single: round1000((sell + sd) * r), childBed: cat(h.settleChildBed), childNoBed: cat(h.settleChildNoBed), infant: cat(h.settleInfant) },
      cost: { adult: Math.round(settleA * r), single: Math.round((settleA + sd) * r), childBed: cost(h.settleChildBed), childNoBed: cost(h.settleChildNoBed), infant: cost(h.settleInfant) },
      commission: Math.round(commission * r),
    };
  }
  // Package-level model: base price from cost + commission, or the stored price
  const ex = (key) => legacyExtra(pkg, h, TRAVELLER_TYPES.find((t) => t.key === key));
  const base = packageBasePrices(pkg, rate);
  const bp = (k) => (base ? base[k] : n(pkg?.[PRICE_FIELD[k]]));
  const cr = costRate(pkg, rate);
  const cst = (k) => Math.round(n(pkg?.[COST_FIELD[k]]) * cr);
  const adult = bp('adult') + ex('adult');
  return {
    prices: { adult, single: adult + singleSupplement(h), childBed: bp('childBed') + ex('childBed'), childNoBed: bp('childNoBed') + ex('childNoBed'), infant: bp('infant') + ex('infant') },
    cost: { adult: cst('adult') + ex('adult'), single: cst('adult') + ex('adult') + singleSupplement(h), childBed: cst('childBed') + ex('childBed'), childNoBed: cst('childNoBed') + ex('childNoBed'), infant: cst('infant') + ex('infant') },
    commission: base ? Math.round(n(pkg.adult_commission) * cr) : n(pkg?.price) - cst('adult'),
  };
}

/** Per-hotel differences vs the primary (first visible) hotel, per type. */
export function hotelExtras(pkg, rate = 1) {
  const vis = visibleHotels(pkg);
  if (!vis.length) return [];
  const all = vis.map((h) => hotelPrices(pkg, h, rate).prices);
  const base = all[0];
  return all.map((p) => Object.fromEntries(TYPE_KEYS.map((k) => [k, p[k] == null || base[k] == null ? null : p[k] - base[k]])));
}

/** Flight add-on per traveller type (first flight is always 0; single uses the adult extra). */
export function flightExtra(flight, typeKey) {
  if (!flight) return 0;
  const t = TRAVELLER_TYPES.find((x) => x.key === typeKey);
  const f = t ? t.diffField : 'diff';
  return has(flight[f]) ? n(flight[f]) : n(flight.diff);
}

/** Totals for a selection. `hotel` may be raw (dashboard) or public (has `prices`). */
export function computeTotals(pkg, counts, hotel, flight, dateObj, rate = 1) {
  const hp = hotel ? hotelPrices(pkg, hotel, rate) : null;
  const lines = [];
  const units = {};
  let total = 0, totalCost = 0, costKnown = !!(hp && hp.cost);
  for (const t of TRAVELLER_TYPES) {
    const base = hp ? hp.prices[t.key] : null;
    const extra = flightExtra(flight, t.key) + n(dateObj && dateObj.adjust);
    units[t.key] = base == null ? null : base + extra;
    const c = Math.max(0, Math.round(n(counts && counts[t.key])));
    if (c <= 0 || base == null) continue;
    const unit = base + extra;
    lines.push({ type: t, count: c, unit, subtotal: unit * c });
    total += unit * c;
    if (costKnown) totalCost += ((hp.cost[t.key] == null ? 0 : hp.cost[t.key]) + extra) * c;
  }
  const extra = flightExtra(flight, 'adult') + n(dateObj && dateObj.adjust);
  return { lines, units, total, totalCost: costKnown ? totalCost : null, profit: costKnown ? total - totalCost : null, extra };
}

/**
 * Customer-safe package for the public website/API: visible hotels only,
 * each with computed `prices` and `extras`; settlement, commission,
 * supplier and raw inputs removed; package price fields set from the primary.
 */
export function publicPackage(pkg, rate = 1) {
  const vis = visibleHotels(pkg);
  const extras = hotelExtras(pkg, rate);
  const hotels = vis.map((h, i) => {
    const { prices } = hotelPrices(pkg, h, rate);
    const { sellAdult, settleAdult, settleChildBed, settleChildNoBed, settleInfant, hidden, diff, diffChildBed, diffChildNoBed, diffInfant, ...rest } = h;
    return { ...rest, singleDiff: singleSupplement(h), prices, extras: extras[i] || null };
  });
  const primary = hotels[0];
  const baseP = packageBasePrices(pkg, rate);
  const { adult_cost, child_cost, child_nobed_cost, infant_cost, cost_currency, adult_commission, child_commission, child_nobed_commission, infant_commission, supplier_id, supplier_name, price_currency, ...safe } = pkg;
  return {
    ...safe,
    hotels,
    price: primary ? primary.prices.adult : (baseP ? baseP.adult : n(pkg.price)),
    single_price: primary ? primary.prices.single : (baseP ? baseP.adult : n(pkg.price)),
    child_price: primary ? primary.prices.childBed : (baseP ? baseP.childBed : n(pkg.child_price)),
    child_nobed_price: primary ? primary.prices.childNoBed : (baseP ? baseP.childNoBed : n(pkg.child_nobed_price)),
    infant_price: primary ? primary.prices.infant : (baseP ? baseP.infant : n(pkg.infant_price)),
  };
}

// Kept for older imports
export const customerHotels = (pkg, rate = 1) => publicPackage(pkg, rate).hotels;
export function unitPrice(pkg, type, extra) { return n(pkg && pkg[type.priceField]) + n(extra); }

// "4 ليالٍ / 5 أيام" / "4 nights / 5 days"
export function durationLabel(pkg, lang) {
  const en = lang === 'en';
  const nights = pkg.nights, days = pkg.day_count != null ? pkg.day_count : null;
  if (!nights && !days) return en ? pkg.nights_en || pkg.nights_ar || '' : pkg.nights_ar || pkg.nights_en || '';
  const arNights = (x) => (x === 1 ? 'ليلة واحدة' : x === 2 ? 'ليلتان' : x <= 10 ? x + ' ليالٍ' : x + ' ليلة');
  const arDays = (x) => (x === 1 ? 'يوم واحد' : x === 2 ? 'يومان' : x <= 10 ? x + ' أيام' : x + ' يوماً');
  const parts = [];
  if (nights) parts.push(en ? nights + (nights === 1 ? ' night' : ' nights') : arNights(nights));
  if (days) parts.push(en ? days + (days === 1 ? ' day' : ' days') : arDays(days));
  return parts.join(' / ');
}
