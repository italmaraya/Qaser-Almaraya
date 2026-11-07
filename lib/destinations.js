// One source of truth for where each destination is in the world.
//
// The dashboard data has a few geographic slips (Thailand and Indonesia filed
// under "Middle East & Africa", the Gulf states under "Asia", package
// destinations with no country set, misspelt country names). Rather than trust
// the free-text fields, the public pages resolve every visa country and every
// package to an ISO code here and take the region and the display name from
// this table. The admin data itself is left untouched.

export const REGIONS = [
  { id: 'gulf', ar: 'دول الخليج العربي', en: 'Gulf states' },
  { id: 'mena', ar: 'الشرق الأوسط وشمال أفريقيا', en: 'Middle East & North Africa' },
  { id: 'caucasus', ar: 'تركيا والقوقاز', en: 'Türkiye & the Caucasus' },
  { id: 'asia', ar: 'آسيا', en: 'Asia' },
  { id: 'europe', ar: 'أوروبا', en: 'Europe' },
  { id: 'americas', ar: 'الأمريكتان', en: 'The Americas' },
  { id: 'other', ar: 'وجهات أخرى', en: 'Other destinations' },
];

const REGION_ORDER = Object.fromEntries(REGIONS.map((r, i) => [r.id, i]));

// iso → [Arabic name, English name, region]
export const COUNTRIES = {
  ae: ['الإمارات', 'United Arab Emirates', 'gulf'],
  sa: ['السعودية', 'Saudi Arabia', 'gulf'],
  qa: ['قطر', 'Qatar', 'gulf'],
  bh: ['البحرين', 'Bahrain', 'gulf'],
  kw: ['الكويت', 'Kuwait', 'gulf'],
  om: ['سلطنة عُمان', 'Oman', 'gulf'],
  jo: ['الأردن', 'Jordan', 'mena'],
  lb: ['لبنان', 'Lebanon', 'mena'],
  sy: ['سوريا', 'Syria', 'mena'],
  eg: ['مصر', 'Egypt', 'mena'],
  tn: ['تونس', 'Tunisia', 'mena'],
  ma: ['المغرب', 'Morocco', 'mena'],
  dz: ['الجزائر', 'Algeria', 'mena'],
  ir: ['إيران', 'Iran', 'asia'],
  tr: ['تركيا', 'Türkiye', 'caucasus'],
  az: ['أذربيجان', 'Azerbaijan', 'caucasus'],
  am: ['أرمينيا', 'Armenia', 'caucasus'],
  ge: ['جورجيا', 'Georgia', 'caucasus'],
  my: ['ماليزيا', 'Malaysia', 'asia'],
  id: ['إندونيسيا', 'Indonesia', 'asia'],
  th: ['تايلاند', 'Thailand', 'asia'],
  sg: ['سنغافورة', 'Singapore', 'asia'],
  mv: ['جزر المالديف', 'Maldives', 'asia'],
  lk: ['سريلانكا', 'Sri Lanka', 'asia'],
  kh: ['كمبوديا', 'Cambodia', 'asia'],
  vn: ['فيتنام', 'Vietnam', 'asia'],
  cn: ['الصين', 'China', 'asia'],
  in: ['الهند', 'India', 'asia'],
  jp: ['اليابان', 'Japan', 'asia'],
  kr: ['كوريا الجنوبية', 'South Korea', 'asia'],
  ru: ['روسيا', 'Russia', 'europe'],
  it: ['إيطاليا', 'Italy', 'europe'],
  fr: ['فرنسا', 'France', 'europe'],
  gb: ['المملكة المتحدة', 'United Kingdom', 'europe'],
  de: ['ألمانيا', 'Germany', 'europe'],
  es: ['إسبانيا', 'Spain', 'europe'],
  nl: ['هولندا', 'Netherlands', 'europe'],
  gr: ['اليونان', 'Greece', 'europe'],
  ch: ['سويسرا', 'Switzerland', 'europe'],
  at: ['النمسا', 'Austria', 'europe'],
  us: ['الولايات المتحدة الأمريكية', 'United States', 'americas'],
  ca: ['كندا', 'Canada', 'americas'],
  br: ['البرازيل', 'Brazil', 'americas'],
  mx: ['المكسيك', 'Mexico', 'americas'],
};

// Lower-cased English or Arabic spellings found in the data → iso.
const ALIASES = {
  'jordon': 'jo', 'jordan': 'jo', 'الاردن': 'jo', 'الأردن': 'jo',
  'usa': 'us', 'united states': 'us', 'united states of america': 'us', 'america': 'us', 'امريكا': 'us', 'أمريكا': 'us',
  'uae': 'ae', 'united arab emirates': 'ae', 'emirates': 'ae', 'الامارات': 'ae', 'الإمارات': 'ae',
  'oman': 'om', 'sultanate of oman': 'om', 'سلطنة عمان': 'om', 'عمان': 'om',
  'uk': 'gb', 'united kingdom': 'gb', 'britain': 'gb', 'great britain': 'gb', 'england': 'gb', 'بريطانيا': 'gb',
  'turkey': 'tr', 'türkiye': 'tr', 'turkiye': 'tr',
  'saudi arabia': 'sa', 'ksa': 'sa', 'south korea': 'kr', 'korea': 'kr',
  'sri lanka': 'lk', 'srilanka': 'lk', 'سيرلانكا': 'lk', 'سريلانكا': 'lk',
  'thailand': 'th', 'تايلند': 'th', 'تايلاند': 'th',
  'indonesia': 'id', 'اندونيسيا': 'id', 'إندونيسيا': 'id',
  'italy': 'it', 'ايطاليا': 'it', 'إيطاليا': 'it',
};
for (const [iso, [ar, en]] of Object.entries(COUNTRIES)) {
  ALIASES[en.toLowerCase()] = ALIASES[en.toLowerCase()] || iso;
  ALIASES[ar] = ALIASES[ar] || iso;
}

const clean = (s) => String(s || '').trim().replace(/\s+/g, ' ');

export function isoFromName(...names) {
  for (const n of names) {
    const k = clean(n);
    if (!k) continue;
    const hit = ALIASES[k.toLowerCase()] || ALIASES[k];
    if (hit) return hit;
  }
  return null;
}

export function countryInfo(iso) {
  const c = iso && COUNTRIES[iso];
  if (!c) return null;
  const region = REGIONS.find((r) => r.id === c[2]) || REGIONS[REGIONS.length - 1];
  return { iso, ar: c[0], en: c[1], regionId: region.id, regionAr: region.ar, regionEn: region.en };
}

export function regionRank(regionId) {
  return REGION_ORDER[regionId] ?? 99;
}

export function flagUrl(iso) {
  return iso ? `https://flagcdn.com/w80/${iso}.png` : '';
}

// Visa card / country row → same row with corrected names and region.
export function normalizeVisaCountry(row) {
  if (!row) return row;
  const short = clean(row.flag_code);
  const iso = isoFromName(row.country_name_en, row.country_name_ar) || (/^[a-z]{2}$/i.test(short) ? short.toLowerCase() : null);
  const info = countryInfo(iso);
  if (!info) return { ...row, country_name_ar: clean(row.country_name_ar), country_name_en: clean(row.country_name_en), country_iso: iso || '', region: row.region || REGIONS[REGIONS.length - 1].ar, region_en: '', region_id: 'other' };
  return {
    ...row,
    flag_code: row.flag_code || flagUrl(iso),
    country_iso: iso,
    country_name_ar: info.ar,
    country_name_en: info.en,
    region: info.regionAr,
    region_en: info.regionEn,
    region_id: info.regionId,
  };
}

// Words in a package's destination/title → the country it is in. Ordered so
// that city names are matched before generic words.
const PLACE_WORDS = [
  ['tr', ['إسطنبول', 'اسطنبول', 'طرابزون', 'أنطاليا', 'انطاليا', 'بورصة', 'تركيا', 'istanbul', 'trabzon', 'antalya', 'turkey', 'türkiye']],
  ['tn', ['تونس', 'سوسة', 'سوسه', 'حمامات', 'الحمامات', 'tunis', 'sousse', 'hammamet']],
  ['om', ['مسقط', 'صلالة', 'سلطنة عمان', 'عُمان', 'muscat', 'salalah', 'oman']],
  ['eg', ['شرم الشيخ', 'القاهرة', 'الغردقة', 'مصر', 'sharm', 'cairo', 'hurghada', 'egypt']],
  ['my', ['كوالالمبور', 'لنكاوي', 'بينانج', 'بورت ديكسون', 'ماليزيا', 'kuala lumpur', 'langkawi', 'penang', 'malaysia']],
  ['id', ['بالي', 'جاكرتا', 'إندونيسيا', 'اندونيسيا', 'bali', 'jakarta', 'indonesia']],
  ['mv', ['المالديف', 'maldives']],
  ['th', ['بانكوك', 'باتايا', 'بوكيت', 'تايلاند', 'تايلند', 'bangkok', 'pattaya', 'phuket', 'thailand']],
  ['sg', ['سنغافورة', 'singapore']],
  ['lb', ['بيروت', 'لبنان', 'beirut', 'lebanon']],
  ['ae', ['دبي', 'أبوظبي', 'ابوظبي', 'الإمارات', 'الامارات', 'dubai', 'abu dhabi', 'emirates']],
  ['ge', ['تبليسي', 'باتومي', 'جورجيا', 'tbilisi', 'batumi', 'georgia']],
  ['az', ['باكو', 'أذربيجان', 'اذربيجان', 'baku', 'azerbaijan']],
  ['am', ['يريفان', 'أرمينيا', 'ارمينيا', 'yerevan', 'armenia']],
  ['ir', ['مشهد', 'طهران', 'إيران', 'ايران', 'mashhad', 'tehran', 'iran']],
  ['sa', ['مكة', 'المدينة المنورة', 'عمرة', 'السعودية', 'mecca', 'makkah', 'umrah', 'saudi']],
  ['jo', ['عمّان', 'البتراء', 'العقبة', 'الأردن', 'الاردن', 'petra', 'aqaba', 'jordan']],
  ['ru', ['موسكو', 'روسيا', 'moscow', 'russia']],
  ['lk', ['كولومبو', 'سريلانكا', 'colombo', 'sri lanka']],
];

// Every country a package visits, in the order they appear in its title
// (so "كوالالمبور وجزيرة بالي" → Malaysia, then Indonesia).
export function packageCountries(p) {
  if (!p) return [];
  const listed = (Array.isArray(p.countries) ? p.countries : []).map((c) => String(c).toLowerCase()).filter((c) => COUNTRIES[c]);
  if (listed.length) return [...new Set(listed)];
  const text = [p.title_ar, p.dest_ar, p.title_en, p.dest_en].filter(Boolean).join(' | ').toLowerCase();
  const found = [];
  for (const [iso, words] of PLACE_WORDS) {
    let at = Infinity;
    for (const w of words) {
      const i = text.indexOf(w.toLowerCase());
      if (i >= 0 && i < at) at = i;
    }
    if (at < Infinity) found.push([at, iso]);
  }
  return found.sort((a, b) => a[0] - b[0]).map(([, iso]) => iso);
}

export function packageCountry(p) {
  return packageCountries(p)[0] || null;
}

// "7 ليالٍ" from the numeric nights column (the free-text nights_ar is often
// stale — e.g. a 9-night package still saying 7).
export function nightsLabel(p, lang = 'ar') {
  const n = Number(p && p.nights);
  if (!(n > 0)) return lang === 'en' ? (p && (p.nights_en || p.nights_ar)) || '' : (p && p.nights_ar) || '';
  if (lang === 'en') return n === 1 ? '1 night' : `${n} nights`;
  if (n === 1) return 'ليلة واحدة';
  if (n === 2) return 'ليلتان';
  if (n <= 10) return `${n} ليالٍ`;
  return `${n} ليلة`;
}

// Group a list of packages by country: countries with the most packages
// first, packages inside each country by length then price.
export function groupPackagesByCountry(list) {
  const byIso = new Map();
  for (const p of list || []) {
    const iso = packageCountry(p) || 'zz';
    if (!byIso.has(iso)) byIso.set(iso, []);
    byIso.get(iso).push(p);
  }
  const groups = [...byIso.entries()].map(([iso, items]) => {
    const info = countryInfo(iso) || { iso, ar: 'وجهات أخرى', en: 'Other destinations', regionId: 'other', regionAr: 'وجهات أخرى', regionEn: 'Other destinations' };
    items.sort((a, b) => (Number(a.nights) || 0) - (Number(b.nights) || 0) || (Number(a.price) || 0) - (Number(b.price) || 0));
    return { ...info, items };
  });
  // Most packages first; 'other' always last.
  groups.sort((a, b) => (a.iso === 'zz') - (b.iso === 'zz') || b.items.length - a.items.length || regionRank(a.regionId) - regionRank(b.regionId) || a.ar.localeCompare(b.ar, 'ar'));
  // Every country keeps its own name, however few packages it has, so the
  // traveller reads «دبي، الإمارات» instead of a shared «وجهات أخرى» block.
  // Only packages whose country could not be resolved stay in that block,
  // and it is always last.
  return groups;
}

// "كوالالمبور وجزيرة بالي، ماليزيا وإندونيسيا": the place names from the
// dashboard (without any country text they carried) + the resolved countries.
export function destinationLabel(p, lang = 'ar') {
  const en = lang === 'en';
  const isos = packageCountries(p);
  const raw = String((en ? p.dest_en || p.dest_ar : p.dest_ar) || '').trim();
  const place = raw.split(en ? ',' : /[،,]/)[0].trim();
  const names = isos.map((iso) => (countryInfo(iso) || {})[en ? 'en' : 'ar']).filter(Boolean);
  if (!names.length) return raw;
  const countries = en ? names.join(' & ') : names.join(' و');
  if (!place || names.includes(place)) return countries;
  return `${place}${en ? ', ' : '، '}${countries}`;
}

// "يوم عمل واحد" / "يوما عمل" / "5 أيام عمل" — visa issuing times are stored in days.
export function workDaysLabel(days, lang = 'ar') {
  const n = Math.round(Number(days));
  if (!(n > 0)) return '';
  if (lang === 'en') return n === 1 ? '1 working day' : `${n} working days`;
  if (n === 1) return 'يوم عمل واحد';
  if (n === 2) return 'يوما عمل';
  if (n <= 10) return `${n} أيام عمل`;
  return `${n} يوم عمل`;
}
