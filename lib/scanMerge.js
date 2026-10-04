// Merge scanned values into a package form WITHOUT overwriting anything the
// user already typed. Returns { next, count } where count = boxes filled.
const isEmpty = (v) => v === '' || v === null || v === undefined || (Array.isArray(v) && v.length === 0);
const has = (v) => !(v === null || v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v)));

const BLANK_HOTEL = { nameAr: '', nameEn: '', stars: '', notesAr: '', notesEn: '', hidden: false, sellAdult: '', settleAdult: '', settleChildBed: '', settleChildNoBed: '', settleInfant: '', singleDiff: 0, diff: 0, diffChildBed: 0, diffChildNoBed: 0, diffInfant: 0, imageUrl: '', extraImages: [], locationUrl: '', location: '', amenitiesAr: [], amenitiesEn: [], lat: '', lng: '' };
const BLANK_FLIGHT = { nameAr: '', nameEn: '', diff: 0, diffChildBed: 0, diffChildNoBed: 0, diffInfant: 0, outFlightNo: '', outFromCity: '', outToCity: '', outDepartTime: '', outArriveTime: '', outDuration: '', retFlightNo: '', retFromCity: '', retToCity: '', retDepartTime: '', retArriveTime: '', retDuration: '' };

const HOTEL_KEYS = ['nameAr', 'nameEn', 'stars', 'location', 'sellAdult', 'settleAdult', 'settleChildBed', 'settleChildNoBed', 'settleInfant', 'singleDiff', 'notesAr'];
const FLIGHT_KEYS = ['nameAr', 'outDepartTime', 'retDepartTime'];

const emptyForKey = (k, v) => isEmpty(v) || (k === 'singleDiff' && Number(v) === 0);

function mergeRows(existing, scanned, blank, keys, counter) {
  const rows = (existing || []).map((r) => ({ ...r }));
  (scanned || []).forEach((s, i) => {
    if (!s) return;
    if (i >= rows.length) {
      const row = { ...blank };
      keys.forEach((k) => { if (has(s[k])) { row[k] = s[k]; counter.n += 1; } });
      if (s.hidden === true) row.hidden = true; // crossed-out in the sheet
      if (keys.some((k) => has(s[k]))) rows.push(row);
    } else {
      keys.forEach((k) => { if (emptyForKey(k, rows[i][k]) && has(s[k])) { rows[i][k] = s[k]; counter.n += 1; } });
    }
  });
  return rows;
}

export function mergeScan(form, f) {
  const c = { n: 0 };
  const next = { ...form };
  ['dest_ar', 'dest_en', 'title_ar', 'title_en', 'departs_ar', 'general_notes_ar', 'nights', 'day_count'].forEach((k) => {
    if (isEmpty(next[k]) && has(f[k])) { next[k] = f[k]; c.n += 1; }
  });
  ['includes_ar', 'excludes_ar'].forEach((k) => {
    if (isEmpty(next[k]) && Array.isArray(f[k]) && f[k].length) { next[k] = f[k].map(String); c.n += 1; }
  });
  if (isEmpty(next.available_dates) && Array.isArray(f.available_dates) && f.available_dates.length) {
    next.available_dates = f.available_dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).map((date) => ({ date, adjust: 0 }));
    c.n += next.available_dates.length;
  }
  next.hotels = mergeRows(form.hotels, f.hotels, BLANK_HOTEL, HOTEL_KEYS, c);
  next.flights = mergeRows(form.flights, f.flights, BLANK_FLIGHT, FLIGHT_KEYS, c);
  return { next, count: c.n };
}
