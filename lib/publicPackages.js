// One shared /api/packages request per page view: the homepage offers strip,
// the season spotlight and the trip finder all read the same list.
let pending = null;

export function loadPackages() {
  if (!pending) {
    pending = fetch('/api/packages')
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => (Array.isArray(list) ? list : []))
      .catch(() => { pending = null; return []; });
  }
  return pending;
}

// Upcoming departure dates (YYYY-MM-DD, sorted) from the dates list and the
// single departure date.
export function upcomingDates(p, today = new Date().toISOString().slice(0, 10)) {
  const out = (Array.isArray(p && p.available_dates) ? p.available_dates : [])
    .map((d) => String((d && d.date) || d || '').slice(0, 10));
  if (p && p.departure_date) out.push(String(p.departure_date).slice(0, 10));
  return [...new Set(out.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= today))].sort();
}
