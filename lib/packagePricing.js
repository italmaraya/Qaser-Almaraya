// One source of truth for package pricing, used by the package page, the PDF
// voucher and the internal profit view. Model: base price per traveller type
// + selected hotel extra + selected flight extra + the chosen date's adjust.

export const TRAVELLER_TYPES = [
  { key: 'adult', priceField: 'price', costField: 'adult_cost', ar: 'بالغ', en: 'Adult', hintAr: 'في سرير مستقل', hintEn: 'own bed' },
  { key: 'childBed', priceField: 'child_price', costField: 'child_cost', ar: 'طفل بسرير', en: 'Child with bed', hintAr: '', hintEn: '' },
  { key: 'childNoBed', priceField: 'child_nobed_price', costField: 'child_nobed_cost', ar: 'طفل بدون سرير', en: 'Child without bed', hintAr: '', hintEn: '' },
  { key: 'infant', priceField: 'infant_price', costField: 'infant_cost', ar: 'رضيع', en: 'Infant', hintAr: 'أقل من سنتين', hintEn: 'under 2' },
];

const n = (v) => Number(v) || 0;

// extra added on top of every traveller's price (hotel + flight + date)
export function selectedExtra(pkg, hotel, flight, dateObj) {
  return n(hotel && hotel.diff) + n(flight && flight.diff) + n(dateObj && dateObj.adjust);
}

// Unit sell price for one traveller of a type, with the current selections.
export function unitPrice(pkg, type, extra) {
  return n(pkg[type.priceField]) + extra;
}

// Unit internal cost. The hotel/flight extras are a sell-side upsell, so by
// default they are treated as pure margin (cost side unchanged); date adjust
// is not a cost either. Costs come only from the per-type cost fields.
export function unitCost(pkg, type) {
  return n(pkg[type.costField]);
}

/**
 * counts: { adult, childBed, childNoBed, infant }
 * returns { lines:[{type,count,unit,subtotal}], total, totalCost, profit }
 */
export function computeTotals(pkg, counts, hotel, flight, dateObj) {
  const extra = selectedExtra(pkg, hotel, flight, dateObj);
  const lines = [];
  let total = 0, totalCost = 0;
  for (const t of TRAVELLER_TYPES) {
    const c = Math.max(0, Math.round(n(counts[t.key])));
    if (c <= 0) continue;
    const unit = unitPrice(pkg, t, extra);
    const cost = unitCost(pkg, t) + extra; // extra is paid to suppliers per head
    lines.push({ type: t, count: c, unit, subtotal: unit * c });
    total += unit * c;
    totalCost += cost * c;
  }
  return { lines, total, totalCost, profit: total - totalCost, extra };
}

// "4 ليالٍ / 5 أيام" or "4 nights / 5 days", from the numeric fields with a
// text fallback (nights_ar / nights_en).
export function durationLabel(pkg, lang) {
  const en = lang === 'en';
  const nights = pkg.nights, days = pkg.day_count != null ? pkg.day_count : pkg.days;
  if (!nights && !days) return en ? pkg.nights_en || pkg.nights_ar || '' : pkg.nights_ar || pkg.nights_en || '';
  const arNights = (x) => (x === 1 ? 'ليلة واحدة' : x === 2 ? 'ليلتان' : x <= 10 ? x + ' ليالٍ' : x + ' ليلة');
  const arDays = (x) => (x === 1 ? 'يوم واحد' : x === 2 ? 'يومان' : x <= 10 ? x + ' أيام' : x + ' يوماً');
  const parts = [];
  if (nights) parts.push(en ? nights + (nights === 1 ? ' night' : ' nights') : arNights(nights));
  if (days) parts.push(en ? days + (days === 1 ? ' day' : ' days') : arDays(days));
  return parts.join(en ? ' / ' : ' / ');
}
