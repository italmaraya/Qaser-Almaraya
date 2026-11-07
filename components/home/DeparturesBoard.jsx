'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Icon from '../Icon';
import { loadPackages } from '../../lib/publicPackages';
import { destinationLabel, nightsLabel } from '../../lib/destinations';
import { formatPrice } from '../../lib/currency';
import { dateOnly, baghdadToday, daysUntil } from '../../lib/packageUrgency';

// "Departures from Baghdad": an airport-style board of the next real group
// departures (each package's nearest bookable date from the dashboard). Every
// cell flips like a split-flap board when its value changes; the board pages
// through the list every few seconds. Rows open the package. Hidden when no
// package has an upcoming date. Reduced-motion visitors get no flips.
const PAGE = 6;
const MAX_ROWS = 18;
const TURN_MS = 7000;
const PER_DEST = 2;

function nextDate(p, today) {
  const own = dateOnly(p.departure_date);
  const list = (Array.isArray(p.available_dates) ? p.available_dates : []).map((d) => dateOnly((d && d.date) || d));
  return [own, ...list].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d > today).sort()[0] || '';
}

function fmtDate(ymd, en) {
  try {
    return new Intl.DateTimeFormat(en ? 'en-GB' : 'ar-IQ-u-nu-latn', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(ymd + 'T00:00:00Z'));
  } catch { return ymd; }
}

function status(days, en) {
  if (days === 1) return { soon: true, text: en ? 'Departs tomorrow' : 'يغادر غداً' };
  if (days === 2) return { soon: true, text: en ? 'Departs in 2 days' : 'يغادر بعد يومين' };
  if (days <= 7) return { soon: true, text: en ? `Departs in ${days} days` : `يغادر بعد ${days} أيام` };
  return { soon: false, text: en ? 'Booking open' : 'الحجز مفتوح' };
}

// One flap: re-mounts (and so re-animates) whenever its text changes.
// `short` is shown instead of `text` on phones.
function Flap({ text, short, delay = 0, className = '' }) {
  return (
    <span className={'qs-db-cell ' + className}>
      <span key={text} className="qs-db-flap" style={{ animationDelay: delay + 'ms' }}>
        {short ? <><span className="qs-db-long">{text}</span><span className="qs-db-short" dir="ltr">{short}</span></> : text}
      </span>
    </span>
  );
}

function shortDate(ymd) {
  const [, m, d] = ymd.split('-');
  return Number(d) + '/' + Number(m);
}

function useBaghdadClock() {
  const [now, setNow] = useState('');
  useEffect(() => {
    const fmt = () => {
      try { return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baghdad' }).format(new Date()); } catch { return ''; }
    };
    setNow(fmt());
    const id = setInterval(() => setNow(fmt()), 15000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function DeparturesBoard({ lang = 'ar' }) {
  const en = lang === 'en';
  const [pkgs, setPkgs] = useState(null);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const clock = useBaghdadClock();

  useEffect(() => {
    let alive = true;
    loadPackages().then((l) => { if (alive) setPkgs(l); });
    return () => { alive = false; };
  }, []);

  const rows = useMemo(() => {
    const today = baghdadToday();
    const sorted = (pkgs || [])
      .map((p) => ({ p, date: nextDate(p, today), dest: destinationLabel(p, 'ar') }))
      .filter((r) => r.date)
      .sort((a, b) => a.date.localeCompare(b.date) || (Number(a.p.price) || 0) - (Number(b.p.price) || 0));
    // One row per destination and date (its cheapest package, which the sort
    // puts first), and at most PER_DEST rows per destination, so the board
    // shows the range of places instead of one city's many hotel options.
    const seenKey = new Set();
    const perDest = new Map();
    const out = [];
    for (const r of sorted) {
      const key = r.dest + '|' + r.date;
      if (seenKey.has(key)) continue;
      const n = perDest.get(r.dest) || 0;
      if (n >= PER_DEST) continue;
      seenKey.add(key);
      perDest.set(r.dest, n + 1);
      out.push(r);
      if (out.length >= MAX_ROWS) break;
    }
    return out;
  }, [pkgs]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));

  useEffect(() => {
    if (pages < 2 || paused) return undefined;
    const id = setInterval(() => setPage((n) => (n + 1) % pages), TURN_MS);
    return () => clearInterval(id);
  }, [pages, paused]);

  if (!rows.length) return null;
  const shown = rows.slice((page % pages) * PAGE, (page % pages) * PAGE + PAGE);

  return (
    <section className="qs-band qs-db-band" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div className="qs-head">
          <div>
            <span className="qs-kicker">{en ? 'Departures' : 'المغادرة'}</span>
            <h2 className="qs-h2">{en ? 'Next departures from Baghdad' : 'لوحة المغادرة من بغداد'}</h2>
            <p className="qs-lead">{en ? 'The next group departures, live from our schedule. Tap a row for the full programme.' : 'أقرب مواعيد رحلاتنا الجماعية كما وردت في جدولنا. اضغط على أي رحلة لعرض برنامجها كاملاً.'}</p>
          </div>
          <Link href="/packages" className="qs-link">{en ? 'All packages' : 'كل الباقات'}</Link>
        </div>

        <div className="qs-db" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
          <div className="qs-db-top">
            <span className="qs-db-title"><Icon name="plane" size={18} strokeWidth={2} />{en ? 'DEPARTURES · BAGHDAD' : 'المغادرة · بغداد'}</span>
            <span className="qs-db-clock" dir="ltr" data-keep-dir="">{clock ? clock + (en ? ' Baghdad' : ' بغداد') : ''}</span>
          </div>
          <div className="qs-db-head" aria-hidden="true">
            <span>{en ? 'Date' : 'التاريخ'}</span>
            <span>{en ? 'Destination' : 'الوجهة'}</span>
            <span className="qs-db-hide">{en ? 'Stay' : 'المدة'}</span>
            <span>{en ? 'From' : 'يبدأ من'}</span>
            <span className="qs-db-hide">{en ? 'Status' : 'الحالة'}</span>
          </div>
          <ol className="qs-db-rows">
            {shown.map(({ p, date }, i) => {
              const st = status(daysUntil(date), en);
              const title = (en && p.title_en) || p.title_ar;
              return (
                <li key={i}>
                  <Link href={'/packages/' + p.id} className="qs-db-row" aria-label={[fmtDate(date, en), destinationLabel(p, lang), title].filter(Boolean).join(' — ')}>
                    <Flap text={fmtDate(date, en)} short={shortDate(date)} delay={i * 90} className="qs-db-date" />
                    <Flap text={destinationLabel(p, lang) || title} delay={i * 90 + 60} className="qs-db-dest" />
                    <Flap text={nightsLabel(p, lang)} delay={i * 90 + 120} className="qs-db-hide" />
                    <Flap text={formatPrice(p.price, 'IQD', lang)} delay={i * 90 + 180} className="qs-db-price" />
                    <span className={'qs-db-st qs-db-hide' + (st.soon ? ' soon' : '')}><i aria-hidden="true" />{st.text}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
          {pages > 1 ? (
            <div className="qs-db-pages" role="tablist" aria-label={en ? 'Board pages' : 'صفحات اللوحة'}>
              {Array.from({ length: pages }, (_, n) => (
                <button key={n} type="button" role="tab" aria-selected={n === page % pages} aria-label={(en ? 'Page ' : 'صفحة ') + (n + 1)} onClick={() => setPage(n)} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
