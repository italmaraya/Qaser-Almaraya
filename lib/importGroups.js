// Parses the "كروبات قصر المرايا" Excel workbook into package drafts.
// Each program block (a titled group inside a destination tab) becomes one
// package; the first hotel is the base price (+0) and every other hotel is an
// added per-person price on top, matching the dashboard's pricing model.
import * as XLSX from 'xlsx';

// Tabs that are not sellable groups
const SKIP = ['visa', 'template', 'middel calcuator', 'programs', 'خدمات اخرى', 'copy of صلالة-م'];
const isSkipped = (name) => {
  const n = String(name || '').trim().toLowerCase();
  return SKIP.some((s) => n === s.toLowerCase()) || n.startsWith('copy of');
};

const norm = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();

function toInt(v) {
  if (v == null) return null;
  const s = String(v).replace(/[^\d.]/g, '');
  if (!s || s === '.') return null;
  const n = Math.round(parseFloat(s));
  return Number.isFinite(n) ? n : null;
}

// "10-10-2026" (d-m-y) or a real date cell → YYYY-MM-DD
function toISODate(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = norm(v);
  let m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  return null;
}

// nights/days from a title like "مسقط 8 ايام - 7 ليالي"
function nightsDays(title) {
  const t = norm(title);
  const days = (t.match(/(\d+)\s*(?:ايام|أيام|يوم)/) || [])[1];
  const nights = (t.match(/(\d+)\s*(?:ليال|ليلة|ليالي|ليلي)/) || [])[1];
  return { nights: nights ? Number(nights) : null, days: days ? Number(days) : null };
}

function starsFromText(t) {
  const m = norm(t).match(/(\d)/);
  return m ? Number(m[1]) : null;
}

function findHeader(rows) {
  for (let r = 0; r < Math.min(6, rows.length); r++) {
    const row = (rows[r] || []).map(norm);
    if (row.includes('اسم الفندق') && row.includes('البيع')) return { r, row };
  }
  return null;
}

function colMap(hdr) {
  const idx = {};
  hdr.forEach((h, i) => { idx[norm(h)] = i; });
  const c = (...names) => { for (const n of names) if (n in idx) return idx[n]; return -1; };
  return {
    date: c('التاريخ'), weekday: c('ايام الاسبوع'), air: c('الطيران'), dep: c('وقت الذهاب'), ret: c('وقت العودة'),
    hotel: c('اسم الفندق'), stars: c('التصنيف'), loc: c('الموقع والمميزات', 'الموقع والمميزا', 'الموقع'),
    sell: c('البيع'), cost: c('التسديد'), cnobed: c('طفل بدون سرير'), cbed: c('الطفل بسرير'), infant: c('الرضيع'),
  };
}

const TITLE_HINT = /(برنامج|ايام|أيام|ليال|ليلة|&|-)/;

function parseSheet(name, rows) {
  const h = findHeader(rows);
  if (!h) return [];
  const m = colMap(h.row);
  const progs = [];
  let cur = null;
  for (let r = h.r + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const hotel = norm(row[m.hotel]);
    const dateText = norm(row[m.date]);
    const isHotel = !!hotel;
    const looksTitle = !isHotel && dateText && !/^\d/.test(dateText) && TITLE_HINT.test(dateText);
    if (looksTitle) {
      cur = { title: dateText, sheet: name, date: null, weekday: '', air: '', dep: '', ret: '', hotels: [] };
      progs.push(cur);
      continue;
    }
    if (isHotel) {
      if (!cur) { cur = { title: norm(name), sheet: name, date: null, weekday: '', air: '', dep: '', ret: '', hotels: [] }; progs.push(cur); }
      if (cur.hotels.length === 0) {
        cur.date = toISODate(row[m.date]);
        cur.weekday = norm(row[m.weekday]);
        cur.air = norm(row[m.air]);
        cur.dep = norm(row[m.dep]);
        cur.ret = norm(row[m.ret]);
      }
      cur.hotels.push({
        name: hotel, stars: starsFromText(row[m.stars]), loc: norm(row[m.loc]),
        sell: toInt(row[m.sell]), cost: toInt(row[m.cost]),
        cnobed: toInt(row[m.cnobed]), cbed: toInt(row[m.cbed]), infant: toInt(row[m.infant]),
      });
    }
  }
  // keep only real programs: at least one priced hotel
  return progs.filter((p) => p.hotels.some((x) => x.sell));
}

// Turn a parsed program into a package draft (matches the packages table shape)
function toPackageDraft(p) {
  const priced = p.hotels.filter((h) => h.sell);
  const base = priced[0];
  const { nights, days } = nightsDays(p.title);
  const hotels = priced.map((h, i) => ({
    nameAr: h.name, nameEn: '', diff: i === 0 ? 0 : Math.max(0, (h.sell || 0) - (base.sell || 0)),
    imageUrl: '', extraImages: [], locationUrl: '', location: h.loc || '',
    stars: h.stars || '', amenitiesAr: [], amenitiesEn: [], lat: '', lng: '',
  }));
  const flights = (p.air || p.dep || p.ret) ? [{
    nameAr: p.air || 'الطيران', nameEn: '', diff: 0, logoUrl: '',
    outFromCity: '', outToCity: '', outDepartTime: p.dep || '', outArriveTime: '',
    retFromCity: '', retToCity: '', retDepartTime: p.ret || '', retArriveTime: '',
  }] : [];
  return {
    title_ar: norm(p.title), title_en: '',
    dest_ar: norm(p.sheet), dest_en: '',
    cat: 'family',
    nights, day_count: days, nights_ar: '', nights_en: '',
    departs_ar: p.weekday || '', departs_en: '',
    price: base.sell || 0,
    child_price: base.cbed || 0,
    child_nobed_price: base.cnobed || 0,
    infant_price: base.infant || 0,
    adult_cost: base.cost || 0,
    child_cost: base.cbed || 0,
    child_nobed_cost: base.cnobed || 0,
    infant_cost: base.infant || 0,
    cost_currency: 'IQD',
    available_dates: p.date ? [{ date: p.date, adjust: 0 }] : [],
    hotels, flights, days: [],
    includes_ar: [], includes_en: [], excludes_ar: [], excludes_en: [],
    image_url: '', pdf_banner_url: '',
    active: false, // imported as hidden draft
    _hotelCount: priced.length,
  };
}

export function parseWorkbook(input) {
  // Accepts an ArrayBuffer/Uint8Array (browser) or Buffer (server).
  const wb = XLSX.read(input, { type: 'array', cellDates: true });
  const out = [];
  for (const name of wb.SheetNames) {
    if (isSkipped(name)) continue;
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, blankrows: false, defval: '' });
    for (const prog of parseSheet(name, rows)) {
      out.push(toPackageDraft(prog));
    }
  }
  return out;
}
