// Reads the structured "قالب الكروبات الكامل" Excel template (sheets: الباقات,
// الفنادق, البرنامج اليومي) and turns every package into a full form object,
// the same shape the admin "إضافة باقة" form saves. Columns are found by the
// technical key written in row 2 of each sheet, never by position.
import * as XLSX from 'xlsx';
import { CATS, MEAL_PLANS } from './packagesData';

const norm = (v) => String(v == null ? '' : v).trim();
const lines = (v) => String(v == null ? '' : v).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const commaList = (v) => String(v == null ? '' : v).split(/[,،]/).map((s) => s.trim()).filter(Boolean);
const num = (v) => {
  if (v === '' || v == null) return '';
  const n = Number(String(v).replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : '';
};
const pad = (x) => String(x).padStart(2, '0');

function parseDates(v) {
  if (v instanceof Date) return [`${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`];
  const s = String(v == null ? '' : v);
  const out = [];
  const re = /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})|(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/g;
  let m;
  while ((m = re.exec(s))) {
    if (m[1]) out.push(`${m[1]}-${pad(m[2])}-${pad(m[3])}`);
    else out.push(`${m[6]}-${pad(m[5])}-${pad(m[4])}`);
  }
  return [...new Set(out)].sort();
}

function mealKey(v) {
  const s = norm(v).toLowerCase();
  if (!s) return '';
  if (MEAL_PLANS[s.toUpperCase()]) return s.toUpperCase();
  if (/شامل كلي|all inclusive/.test(s)) return 'AI';
  if (/كاملة|full/.test(s)) return 'FB';
  if (/نصف|half/.test(s)) return 'HB';
  if (/بدون|room only/.test(s)) return 'RO';
  if (/إفطار|افطار|فطور|breakfast|bb/.test(s)) return 'BB';
  return '';
}

function refundKey(v) {
  const s = norm(v).toLowerCase();
  if (!s) return '';
  if (/غير|non|^no$/.test(s)) return 'no';
  if (/قابل|refundable|^yes$/.test(s)) return 'yes';
  return '';
}

function catId(v) {
  const s = norm(v).toLowerCase();
  const c = CATS.find((x) => x.id === s || x.ar === norm(v) || x.en.toLowerCase() === s);
  return c ? c.id : 'family';
}

function nightsLabel(n, lang) {
  if (!n) return '';
  if (lang === 'en') return n === 1 ? '1 night' : `${n} nights`;
  if (n === 1) return 'ليلة واحدة';
  if (n === 2) return 'ليلتان';
  return n <= 10 ? `${n} ليالٍ` : `${n} ليلة`;
}

// rows[0] = Arabic header, rows[1] = technical keys, rows[2..] = data
function rowsToObjects(rows) {
  if (!rows || rows.length < 3) return [];
  const keys = rows[1].map(norm);
  return rows.slice(2).map((row) => {
    const o = {};
    keys.forEach((k, i) => { if (k) o[k] = row[i]; });
    return o;
  }).filter((o) => norm(o.package_id));
}

function buildHotel(h) {
  return {
    nameAr: norm(h.name_ar), nameEn: norm(h.name_en), notesAr: norm(h.hotel_note_ar), notesEn: norm(h.hotel_note_en), hidden: false,
    sellAdult: num(h.sale_adult), settleAdult: num(h.pay_adult), settleChildBed: num(h.pay_child_bed),
    settleChildNoBed: num(h.pay_child_nobed), settleInfant: num(h.pay_infant),
    singleDiff: Math.max(0, num(h.single_diff) || 0),
    diff: 0, diffChildBed: 0, diffChildNoBed: 0, diffInfant: 0,
    imageUrl: '', extraImages: [], locationUrl: norm(h.map_url), location: norm(h.location_ar),
    amenitiesAr: commaList(h.amenities_ar), amenitiesEn: commaList(h.amenities_en),
    lat: num(h.latitude), lng: num(h.longitude),
    stars: num(h.stars), reviewScore: num(h.rating_100), meal: mealKey(h.meal_plan), refundable: refundKey(h.cancel_policy),
    address: norm(h.address_ar),
    roomAr: norm(h.room_type_ar), roomEn: norm(h.room_type_en),
    bedAr: norm(h.bed_ar), bedEn: norm(h.bed_en),
    viewAr: norm(h.view_ar), viewEn: norm(h.view_en),
    overviewAr: norm(h.overview_ar), overviewEn: norm(h.overview_en),
    nearbyAr: lines(h.nearby_ar), nearbyEn: lines(h.nearby_en),
    policiesAr: lines(h.policies_ar), policiesEn: lines(h.policies_en),
  };
}

// sheets = { packages: rows[], hotels: rows[], days: rows[] } (raw rows from the workbook)
export function buildDrafts(sheets) {
  const pk = rowsToObjects(sheets.packages);
  const ht = rowsToObjects(sheets.hotels);
  const dy = rowsToObjects(sheets.days);
  return pk.map((p) => {
    const id = norm(p.package_id);
    const hotelRows = ht.filter((h) => norm(h.package_id) === id)
      .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
    const hotels = hotelRows.map(buildHotel);
    const days = dy.filter((d) => norm(d.package_id) === id)
      .sort((a, b) => (Number(a.day_no) || 999) - (Number(b.day_no) || 999))
      .map((d) => ({ titleAr: norm(d.title_ar), titleEn: norm(d.title_en), descAr: norm(d.program_ar), descEn: norm(d.program_en), imageUrl: '' }));
    const base = hotels.find((h) => h.sellAdult) || {};
    const cur = /دولار|usd|\$/i.test(norm(p.currency)) ? 'USD' : 'IQD';
    const nights = num(p.nights);
    const dayCount = num(p.days);
    const dates = parseDates(p.available_dates);
    const draft = {
      cat: catId(p.category), countries: [],
      dest_ar: norm(p.destination_ar), dest_en: norm(p.destination_en),
      title_ar: norm(p.title_ar), title_en: norm(p.title_en),
      nights_ar: nightsLabel(nights, 'ar'), nights_en: nightsLabel(nights, 'en'),
      departs_ar: norm(p.departures_ar), departs_en: norm(p.departures_en),
      price: base.sellAdult || 0, child_price: 0, adult_cost: base.settleAdult || 0, child_cost: 0,
      child_nobed_price: 0, infant_price: 0, child_nobed_cost: 0, infant_cost: 0,
      cost_currency: cur, price_currency: cur,
      nights, day_count: dayCount,
      available_dates: dates.map((d) => ({ date: d, adjust: 0 })),
      general_notes_ar: String(p.notes_ar == null ? '' : p.notes_ar).trim(),
      general_notes_en: String(p.notes_en == null ? '' : p.notes_en).trim(),
      supplier_id: null, adult_commission: '', child_commission: '', child_nobed_commission: '', infant_commission: '',
      badge_ar: norm(p.badge_ar), badge_en: norm(p.badge_en), prefs: [],
      includes_ar: lines(p.includes_ar), includes_en: lines(p.includes_en),
      excludes_ar: lines(p.excludes_ar), excludes_en: lines(p.excludes_en),
      hotels, flights: [], days, image_url: '', pdf_banner_url: '',
      active: false, sort_order: 0, rating: Number(p.rating) || 4.8,
    };
    const warnings = [];
    if (!draft.title_ar) warnings.push('بدون عنوان');
    if (!hotels.length) warnings.push('مفيش فنادق');
    const noPrice = hotels.filter((h) => !h.sellAdult || !h.settleAdult).length;
    if (noPrice) warnings.push(`${noPrice} فندق بدون سعر بيع أو تسديد`);
    if (!dates.length) warnings.push('مفيش تواريخ توفر');
    if (!days.length) warnings.push('مفيش برنامج يومي');
    else if (dayCount && days.length !== dayCount) warnings.push(`عدد أيام البرنامج (${days.length}) غير عدد الأيام (${dayCount})`);
    const noDetails = hotels.filter((h) => !h.overviewAr && !h.address).length;
    if (noDetails) warnings.push(`${noDetails} فندق تفاصيله لسه فاضية`);
    return { draft, warnings };
  });
}

export function parseTemplate(input) {
  const wb = XLSX.read(input, { type: 'array', cellDates: true });
  const get = (name) => (wb.Sheets[name]
    ? XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, blankrows: false, defval: '' })
    : null);
  const packages = get('الباقات');
  if (!packages) throw new Error('الملف ده مش القالب الكامل: مفيش فيه شيت اسمه "الباقات".');
  const out = buildDrafts({ packages, hotels: get('الفنادق') || [], days: get('البرنامج اليومي') || [] });
  if (!out.length) throw new Error('مفيش أي باقة في الملف. اتأكدي إن "كود الباقة" مكتوب في الصفوف.');
  return out;
}
