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

// Returns null when the package has neither a departure date nor a seat count.
export function packageUrgency(pkg, lang = 'ar') {
  const en = lang === 'en';
  const days = daysUntil(pkg?.departure_date);
  const seats = pkg?.seats_left === null || pkg?.seats_left === undefined || pkg?.seats_left === '' ? null : Number(pkg.seats_left);
  if (days === null && seats === null) return null;
  const parts = [];
  if (days !== null && days >= 0) parts.push(days === 0 ? (en ? 'Departs today' : 'الانطلاق اليوم') : en ? days + (days === 1 ? ' day left' : ' days left') : 'باقي ' + arDays(days));
  if (seats !== null) parts.push(seats <= 0 ? (en ? 'Sold out' : 'نفدت المقاعد') : en ? seats + (seats === 1 ? ' seat left' : ' seats left') : (seats === 1 ? 'مقعد واحد متبقٍ' : seats === 2 ? 'مقعدان متبقيان' : seats + ' مقاعد متبقية'));
  const soldOut = seats !== null && seats <= 0;
  const hot = soldOut || (days !== null && days <= 14) || (seats !== null && seats <= 10);
  return { days, seats, soldOut, hot, label: parts.join(' · ') };
}
