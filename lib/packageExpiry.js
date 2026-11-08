// Expired packages leave the public site by themselves (owner, 8 Nov 2026).
// Nothing is deleted: the row stays in the dashboard exactly as it is, the
// public queries just skip it. Staff can add new dates later and the package
// comes back on its own.
import { dateOnly, baghdadToday } from './packageUrgency';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

// Valid dates (YYYY-MM-DD) from the package's dates list.
function listDates(p) {
  return (Array.isArray(p && p.available_dates) ? p.available_dates : [])
    .map((d) => dateOnly((d && d.date) || d))
    .filter((d) => ISO.test(d));
}

// A package is expired when it has departure dates and every one of them is
// before today (Baghdad). A date stays on the site through its own day.
// Packages with no dates at all are open-ended and never expire here.
// (A single departure_date in the past is already filtered in SQL.)
export function isPackageExpired(p, today = baghdadToday()) {
  const own = dateOnly(p && p.departure_date);
  if (ISO.test(own) && own >= today) return false;
  const dates = listDates(p);
  if (dates.length === 0) return false;
  return !dates.some((d) => d >= today);
}

// The customer only sees dates that have not passed yet, so a past date can
// no longer be picked on the package page.
export function withUpcomingDates(p, today = baghdadToday()) {
  if (!p || !Array.isArray(p.available_dates)) return p;
  const upcoming = p.available_dates.filter((d) => {
    const v = dateOnly((d && d.date) || d);
    return !ISO.test(v) || v >= today;
  });
  return { ...p, available_dates: upcoming };
}

// Rows from the packages table → only the ones customers may still see, with
// past dates removed.
export function livePackages(rows, today = baghdadToday()) {
  return (rows || []).filter((r) => !isPackageExpired(r, today)).map((r) => withUpcomingDates(r, today));
}

// Same rule as the public site, including a single departure_date in the
// past. The dashboard moves these packages to its «المنتهية» archive view.
export function isPackageArchived(p, today = baghdadToday()) {
  const own = dateOnly(p && p.departure_date);
  if (ISO.test(own) && own < today) return true;
  return isPackageExpired(p, today);
}

// Owner, 8 Nov 2026: an expired package stays in the dashboard archive for
// 30 days after its last date, then the daily job deletes it for good.
export const PURGE_AFTER_DAYS = 30;

// The latest date the package has (departure_date or the dates list), or ''.
export function lastPackageDate(p) {
  const own = dateOnly(p && p.departure_date);
  return [...listDates(p), ...(ISO.test(own) ? [own] : [])].sort().pop() || '';
}

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// The day the daily job deletes an archived package ('' when it never will).
export function purgeDate(p, today = baghdadToday()) {
  if (!isPackageArchived(p, today)) return '';
  const last = lastPackageDate(p);
  return last ? addDays(last, PURGE_AFTER_DAYS + 1) : '';
}

export function isPurgeDue(p, today = baghdadToday()) {
  const d = purgeDate(p, today);
  return !!d && d <= today;
}

// Whole days from today to the purge date (0 = deleted tonight).
export function daysUntilPurge(p, today = baghdadToday()) {
  const d = purgeDate(p, today);
  if (!d) return null;
  return Math.max(0, Math.round((new Date(d + 'T00:00:00Z') - new Date(today + 'T00:00:00Z')) / 86400000));
}
