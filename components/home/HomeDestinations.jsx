'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { loadPackages } from '../../lib/publicPackages';
import { groupPackagesByCountry } from '../../lib/destinations';
import { formatPrice } from '../../lib/currency';

// "Where we travel": the countries that have packages right now, most
// packages first, each with a photo from one of its own packages and the
// lowest current price. Everything comes from the dashboard data; the
// section hides itself when there is nothing to show.
const MAX = 5;

export default function HomeDestinations({ lang = 'ar' }) {
  const en = lang === 'en';
  const [list, setList] = useState(null);
  useEffect(() => { let alive = true; loadPackages().then((l) => { if (alive) setList(l); }); return () => { alive = false; }; }, []);

  const groups = useMemo(() => groupPackagesByCountry(list || [])
    .filter((g) => g.iso !== 'zz')
    .map((g) => {
      const withPhoto = g.items.find((p) => p.image_url);
      const prices = g.items.map((p) => Number(p.price)).filter((n) => n > 0);
      return { ...g, photo: withPhoto ? withPhoto.image_url : '', from: prices.length ? Math.min(...prices) : 0 };
    })
    .filter((g) => g.photo)
    .slice(0, MAX), [list]);

  if (list && groups.length < 3) return null;
  const count = (n) => (en ? (n === 1 ? '1 package' : `${n} packages`) : n === 1 ? 'باقة واحدة' : n === 2 ? 'باقتان' : n <= 10 ? `${n} باقات` : `${n} باقة`);

  return (
    <section className="qs-band qs-white" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div className="qs-head">
          <div>
            <span className="qs-kicker">{en ? 'Destinations' : 'الوجهات'}</span>
            <h2 className="qs-h2">{en ? 'Where our travellers are going' : 'إلى أين يسافر عملاؤنا'}</h2>
            <p className="qs-lead">{en ? 'The countries with ready packages from Baghdad right now. Pick one to see every trip and its dates.' : 'الدول التي لدينا إليها باقات جاهزة من بغداد الآن. اختر وجهة لترى رحلاتها ومواعيدها.'}</p>
          </div>
          <Link href="/packages" className="qs-link">{en ? 'All destinations' : 'كل الوجهات'}</Link>
        </div>
        <div className="qs-dest-grid">
          {list === null
            ? [0, 1, 2, 3].map((i) => <div key={i} className="qs-dest qs-skel" aria-hidden="true" />)
            : groups.map((g, i) => (
              <Link key={g.iso} href={'/packages?q=' + encodeURIComponent(g.en)} className={'qs-dest' + (i === 0 ? ' lead' : '')}>
                <div className="qs-photo qs-shade">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.photo} alt={en ? g.en : g.ar} loading="lazy" decoding="async" />
                </div>
                <div className="qs-dest-copy">
                  <h3>{en ? g.en : g.ar}</h3>
                  <span>{count(g.items.length)}{g.from ? (en ? ' · from ' : ' · تبدأ من ') + formatPrice(g.from, 'IQD', lang) : ''}</span>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
