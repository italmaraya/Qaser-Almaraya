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
  const first = {}, last = {};
  hdr.forEach((h, i) => { const k = norm(h); if (!(k in first)) first[k] = i; last[k] = i; });
  const c = (...names) => { for (const nm of names) if (nm in first) return first[nm]; return -1; };
  const cl = (...names) => { for (const nm of names) if (nm in last) return last[nm]; return -1; };
  return {
    date: c('التاريخ'), weekday: c('ايام الاسبوع'), air: c('الطيران'), dep: c('وقت الذهاب'), ret: c('وقت العودة'),
    hotel: c('اسم الفندق'), stars: c('التصنيف'), loc: c('الموقع والمميزات', 'الموقع والمميزا', 'الموقع'),
    // Inputs (right-hand group in the workbook): settlement per category, single supplement
    sell: cl('البيع'), settle: cl('التسديد'),
    settleCNoBed: cl('طفل بدون سرير'), settleCBed: cl('الطفل بسرير'), settleInfant: cl('الرضيع'),
    singleDiff: c('فرق السنكل'),
    hotelNote: c('ملاحظات خاصة بالفندق'), generalNote: c('ملاحظات عامة للباكج'),
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
      if (cur.hotels.length === 0 && m.generalNote >= 0) cur.generalNote = norm(row[m.generalNote]);
      cur.hotels.push({
        name: hotel, stars: starsFromText(row[m.stars]), loc: norm(row[m.loc]),
        sellAdult: toInt(row[m.sell]), settleAdult: toInt(row[m.settle]),
        settleChildBed: toInt(row[m.settleCBed]), settleChildNoBed: toInt(row[m.settleCNoBed]), settleInfant: toInt(row[m.settleInfant]),
        singleDiff: m.singleDiff >= 0 ? toInt(row[m.singleDiff]) : null,
        note: m.hotelNote >= 0 ? norm(row[m.hotelNote]) : '',
      });
    }
  }
  // keep only real programs: at least one priced hotel
  return progs.filter((p) => p.hotels.some((x) => x.sellAdult));
}

// Turn a parsed program into a package draft (matches the packages table shape)
function toPackageDraft(p) {
  const priced = p.hotels.filter((h) => h.sellAdult);
  const base = priced[0];
  const { nights, days } = nightsDays(p.title);
  const hotels = priced.map((h) => ({
    nameAr: h.name, nameEn: '',
    sellAdult: h.sellAdult, settleAdult: h.settleAdult == null ? h.sellAdult : h.settleAdult,
    settleChildBed: h.settleChildBed == null ? '' : h.settleChildBed,
    settleChildNoBed: h.settleChildNoBed == null ? '' : h.settleChildNoBed,
    settleInfant: h.settleInfant == null ? '' : h.settleInfant,
    singleDiff: Math.max(0, h.singleDiff || 0),
    notesAr: h.note || '', notesEn: '', hidden: false,
    imageUrl: '', extraImages: [], locationUrl: '', location: h.loc || '',
    stars: h.stars || '', amenitiesAr: [], amenitiesEn: [], lat: '', lng: '',
  }));
  const flights = (p.air || p.dep || p.ret) ? [{
    nameAr: p.air || 'الطيران', nameEn: '', diff: 0, diffChildBed: 0, diffChildNoBed: 0, diffInfant: 0, logoUrl: '',
    outFromCity: '', outToCity: '', outDepartTime: p.dep || '', outArriveTime: '',
    retFromCity: '', retToCity: '', retDepartTime: p.ret || '', retArriveTime: '',
  }] : [];
  return {
    title_ar: norm(p.title), title_en: '',
    dest_ar: norm(p.sheet), dest_en: '',
    cat: 'family',
    nights, day_count: days, nights_ar: '', nights_en: '',
    departs_ar: p.weekday || '', departs_en: '',
    // package-level fields are only a preview/fallback; real prices come from the hotels
    price: base.sellAdult || 0, child_price: 0, child_nobed_price: 0, infant_price: 0,
    adult_cost: base.settleAdult || 0, child_cost: 0, child_nobed_cost: 0, infant_cost: 0,
    cost_currency: 'IQD', price_currency: 'IQD',
    general_notes_ar: p.generalNote || '', general_notes_en: '',
    available_dates: p.date ? [{ date: p.date, adjust: 0 }] : [],
    hotels, flights, days: [],
    includes_ar: [], includes_en: [], excludes_ar: [], excludes_en: [],
    image_url: '', pdf_banner_url: '',
    active: false,
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
