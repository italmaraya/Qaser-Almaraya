// Seasonal themes (Ramadan, Eid al-Fitr, Eid al-Adha, New Year).
// Islamic seasons follow the Umm al-Qura Hijri calendar built into the
// browser (Intl), so the dates move by themselves every year: nothing to
// update by hand. Iraq can differ from Umm al-Qura by a day, which is fine
// for a banner. Preview any season with ?season=ramadan (or eid_fitr,
// eid_adha, newyear; ?season=off hides it); the choice is kept for
// the browser tab so it stays while you move between pages.

export const SEASONS = {
  ramadan: {
    id: 'ramadan',
    ar: { title: 'رمضان كريم', soon: 'رمضان يقترب', text: 'عمرة رمضان وأجواء روحانية من بغداد. احجز مكانك قبل امتلاء المقاعد.', cta: 'برامج رمضان والعمرة', strip: 'عروض رمضان' },
    en: { title: 'Ramadan Kareem', soon: 'Ramadan is coming', text: 'Ramadan Umrah and spiritual trips from Baghdad. Book before seats run out.', cta: 'Ramadan & Umrah trips', strip: 'Ramadan offers' },
    bg: 'linear-gradient(100deg,#1f1446 0%,#3b2a7a 55%,#5b3d99 100%)', base: '#1f1446', fg: '#fff', accent: '#f5c451', icon: 'crescent', cats: ['umrah'],
  },
  eid_fitr: {
    id: 'eid_fitr',
    ar: { title: 'عيد فطر مبارك', soon: 'عيد الفطر يقترب', text: 'عطلة العيد قريبة: باقات عائلية جاهزة بطيران وفندق وجولات.', cta: 'عروض العيد', strip: 'عروض عيد الفطر' },
    en: { title: 'Eid Mubarak', soon: 'Eid al-Fitr is coming', text: 'The Eid holiday is close: family packages with flights, hotel and tours.', cta: 'Eid offers', strip: 'Eid al-Fitr offers' },
    bg: 'linear-gradient(100deg,#036f8c 0%,#049dc5 60%,#34bbe1 100%)', base: '#036f8c', fg: '#fff', accent: '#faab18', icon: 'star', cats: ['family'],
  },
  eid_adha: {
    id: 'eid_adha',
    ar: { title: 'عيد أضحى مبارك', soon: 'عيد الأضحى يقترب', text: 'موسم الحج وعطلة الأضحى: احجز رحلتك العائلية مبكراً.', cta: 'عروض الأضحى', strip: 'عروض عيد الأضحى' },
    en: { title: 'Eid al-Adha Mubarak', soon: 'Eid al-Adha is coming', text: 'Hajj season and the Adha holiday: book your family trip early.', cta: 'Adha offers', strip: 'Eid al-Adha offers' },
    bg: 'linear-gradient(100deg,#0b5d4b 0%,#12806a 60%,#2fa58a 100%)', base: '#0b5d4b', fg: '#fff', accent: '#f5c451', icon: 'star', cats: ['umrah', 'family'],
  },
  newyear: {
    id: 'newyear',
    ar: { title: 'سنة جديدة سعيدة', soon: 'رأس السنة يقترب', text: 'احتفل برأس السنة برا البلد: دبي وإسطنبول وغيرها، طيران وفندق من بغداد.', cta: 'عروض رأس السنة', strip: 'عروض رأس السنة' },
    en: { title: 'Happy New Year', soon: 'New Year is coming', text: 'Celebrate New Year abroad: Dubai, Istanbul and more, flights and hotel from Baghdad.', cta: 'New Year offers', strip: 'New Year offers' },
    bg: 'linear-gradient(100deg,#0d1b2a 0%,#1b2f4a 55%,#274870 100%)', base: '#0d1b2a', fg: '#fff', accent: '#f5c451', icon: 'sparkle', cats: [],
  },
};

const DAY = 86400000;
const LEAD_DAYS = 21; // show "coming soon" this many days before a season starts

let hijriFmt = null;
function hijri(date) {
  try {
    if (!hijriFmt) hijriFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'Asia/Baghdad' });
    const parts = hijriFmt.formatToParts(date);
    const get = (t) => Number((parts.find((p) => p.type === t) || {}).value);
    return { y: get('year'), m: get('month'), d: get('day') };
  } catch {
    return null;
  }
}

function baghdadYMD(date) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baghdad', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

// Which season (if any) a given day belongs to. Religious seasons win.
function seasonOfDay(date) {
  const h = hijri(date);
  if (h) {
    if (h.m === 9) return 'ramadan';
    if (h.m === 10 && h.d <= 6) return 'eid_fitr';
    if (h.m === 12 && h.d <= 14) return 'eid_adha';
  }
  const md = baghdadYMD(date).slice(5);
  if (md >= '12-15' || md <= '01-03') return 'newyear';
  return null;
}

// Start and end (YYYY-MM-DD) of the run of days around `from` that belong
// to season `id`, looking up to `max` days ahead.
function seasonWindow(id, from, max = 100) {
  let start = from;
  let end = from;
  for (let i = 1; i < max && seasonOfDay(new Date(from.getTime() - i * DAY)) === id; i++) start = new Date(from.getTime() - i * DAY);
  for (let i = 1; i < max && seasonOfDay(new Date(from.getTime() + i * DAY)) === id; i++) end = new Date(from.getTime() + i * DAY);
  return { start: baghdadYMD(start), end: baghdadYMD(end) };
}

// { season, soon, daysToStart, start, end } or null.
export function currentSeason(now = new Date()) {
  const today = seasonOfDay(now);
  if (today) return { season: SEASONS[today], soon: false, daysToStart: 0, ...seasonWindow(today, now) };
  for (let i = 1; i <= LEAD_DAYS; i++) {
    const d = new Date(now.getTime() + i * DAY);
    const id = seasonOfDay(d);
    if (id) return { season: SEASONS[id], soon: true, daysToStart: i, ...seasonWindow(id, d) };
  }
  return null;
}

const KEY = 'qa_season_preview';

// Reads ?season=... (preview), remembers it for the tab, else uses the date.
export function activeSeason() {
  let forced = null;
  try {
    const q = new URLSearchParams(window.location.search).get('season');
    if (q) sessionStorage.setItem(KEY, q);
    forced = q || sessionStorage.getItem(KEY);
  } catch { /* storage blocked: fall back to the date */ }
  if (forced === 'off') return null;
  if (forced && SEASONS[forced]) {
    const now = new Date();
    return { season: SEASONS[forced], soon: false, daysToStart: 0, start: baghdadYMD(now), end: baghdadYMD(new Date(now.getTime() + 30 * DAY)), preview: true };
  }
  return currentSeason();
}

// Packages that fit the season: a departure date inside it, or (for
// Ramadan/Eid) the matching trip type.
export function seasonPackages(list, active) {
  if (!active || !Array.isArray(list)) return [];
  const { season, start, end } = active;
  const inWindow = (p) => {
    const dates = (Array.isArray(p.available_dates) ? p.available_dates : []).map((d) => String((d && d.date) || d || '').slice(0, 10));
    if (p.departure_date) dates.push(String(p.departure_date).slice(0, 10));
    return dates.some((d) => d >= start && d <= end);
  };
  const scored = list
    .map((p) => ({ p, s: (inWindow(p) ? 2 : 0) + (season.cats.includes(p.cat) ? 1 : 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return scored.map((x) => x.p);
}
