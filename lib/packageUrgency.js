// Countdown + seats-left helpers for packages (used on cards and the details page).

// DATE columns may arrive as "2026-10-12", an ISO string or a Date.
export function dateOnly(v) {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

// Today's date in Baghdad, as YYYY-MM-DD.
export function baghdadToday() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baghdad', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function daysUntil(dateStr) {
  const d = dateOnly(dateStr);
  if (!d) return null;
  const ms = new Date(d + 'T00:00:00Z') - new Date(baghdadToday() + 'T00:00:00Z');
  return Math.round(ms / 86400000);
}

function arDays(n) {
  if (n === 1) return 'يوم واحد';
  if (n === 2) return 'يومان';
  if (n <= 10) return n + ' أيام';
  return n + ' يوماً';
}

// How many days before a date from the dates list the countdown appears
// (the single departure date always shows it).
const DATES_LIST_WINDOW = 30;

// The departure date the countdown counts to: the package's own departure
// date, otherwise the nearest upcoming date from its dates list when that is
// within DATES_LIST_WINDOW days.
export function nextDeparture(pkg) {
  const own = dateOnly(pkg?.departure_date);
  if (own && daysUntil(own) >= 0) return own;
  // From tomorrow: a group leaving today can no longer be booked.
  const today = baghdadToday();
  const next = (Array.isArray(pkg?.available_dates) ? pkg.available_dates : [])
    .map((d) => dateOnly((d && d.date) || d))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d > today)
    .sort()[0];
  if (next && daysUntil(next) <= DATES_LIST_WINDOW) return next;
  return own || '';
}

// Returns null when the package has neither a departure date nor a seat count.
export function packageUrgency(pkg, lang = 'ar') {
  const en = lang === 'en';
  const date = nextDeparture(pkg);
  const days = daysUntil(date);
  // Dates from the list repeat (weekly groups), so they read as "next
  // departure" and are not marked urgent by themselves.
  const fromList = !!date && date !== dateOnly(pkg?.departure_date);
  const seats = pkg?.seats_left === null || pkg?.seats_left === undefined || pkg?.seats_left === '' ? null : Number(pkg.seats_left);
  if (days === null && seats === null) return null;
  const parts = [];
  if (days !== null && days >= 0) {
    if (fromList) parts.push(en ? 'Next departure in ' + days + (days === 1 ? ' day' : ' days') : 'أقرب انطلاق بعد ' + arDays(days));
    else parts.push(days === 0 ? (en ? 'Departs today' : 'الانطلاق اليوم') : en ? days + (days === 1 ? ' day left' : ' days left') : 'باقي ' + arDays(days));
  }
  if (seats !== null) parts.push(seats <= 0 ? (en ? 'Sold out' : 'نفدت المقاعد') : en ? seats + (seats === 1 ? ' seat left' : ' seats left') : (seats === 1 ? 'مقعد واحد متبقٍ' : seats === 2 ? 'مقعدان متبقيان' : seats + ' مقاعد متبقية'));
  const soldOut = seats !== null && seats <= 0;
  const hot = soldOut || (!fromList && days !== null && days <= 14) || (seats !== null && seats <= 10);
  return { days, date, fromList, seats, soldOut, hot, label: parts.join(' · ') };
}
