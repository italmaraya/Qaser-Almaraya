'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { loadPackages } from '../lib/publicPackages';
import { destinationLabel, nightsLabel } from '../lib/destinations';
import { formatPrice } from '../lib/currency';
import { dateOnly, baghdadToday } from '../lib/packageUrgency';

// The one rich moment of /links: a boarding pass listing the next real group
// departures from Baghdad (each package's nearest bookable date, one row per
// destination). Hidden until there is at least one upcoming date.
const ROWS = 4;

function nextDate(p, today) {
  const own = dateOnly(p.departure_date);
  const list = (Array.isArray(p.available_dates) ? p.available_dates : []).map((d) => dateOnly((d && d.date) || d));
  return [own, ...list].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d > today).sort()[0] || '';
}
function fmtMonth(ymd) {
  try {
    return new Intl.DateTimeFormat('ar-IQ-u-nu-latn', { month: 'long', timeZone: 'UTC' }).format(new Date(ymd + 'T00:00:00Z'));
  } catch { return ''; }
}

export default function LinksDepartures() {
  const [pkgs, setPkgs] = useState(null);
  useEffect(() => {
    let alive = true;
    loadPackages().then((l) => { if (alive) setPkgs(l); });
    return () => { alive = false; };
  }, []);

  const rows = useMemo(() => {
    if (!pkgs) return [];
    const today = baghdadToday();
    const seen = new Set();
    return pkgs
      .map((p) => ({ p, date: nextDate(p, today), dest: destinationLabel(p, 'ar') }))
      .filter((r) => r.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter((r) => (seen.has(r.dest) ? false : (seen.add(r.dest), true)))
      .slice(0, ROWS);
  }, [pkgs]);

  if (!rows.length) return null;
  return (
    <section className="ql-pass" aria-label="الرحلات القادمة من بغداد">
      <div className="ql-pass-top">
        <span className="ql-pass-from"><b dir="ltr">BGD</b><small>بغداد</small></span>
        <span className="ql-pass-route" aria-hidden="true"><i /><Icon name="plane" size={16} /><i /></span>
        <span className="ql-pass-title">الرحلات القادمة</span>
      </div>
      <ol className="ql-pass-rows">
        {rows.map(({ p, date, dest }) => (
          <li key={p.id}>
            <Link href={'/packages/' + p.id}>
              <span className="ql-pass-date"><b>{Number(date.slice(8, 10))}</b><small>{fmtMonth(date)}</small></span>
              <span className="ql-pass-dest"><b>{dest}</b><small>{nightsLabel(p, 'ar')}</small></span>
              <span className="ql-pass-price"><small>من</small>{formatPrice(p.price, 'IQD', 'ar')}</span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="ql-pass-foot">
        <Link href="/packages">كل الباقات</Link>
      </div>
    </section>
  );
}
