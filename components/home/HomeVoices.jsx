'use client';
import { useEffect, useState } from 'react';

// Customer words, read from the reviews kept in the dashboard (the same list
// the packages page shows). Nothing is written here; with no reviews the
// section does not render.
export default function HomeVoices({ lang = 'ar' }) {
  const en = lang === 'en';
  const [list, setList] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/packages/reviews').then((r) => (r.ok ? r.json() : [])).catch(() => []).then((l) => { if (alive) setList(Array.isArray(l) ? l : []); });
    return () => { alive = false; };
  }, []);
  const items = (list || []).filter((r) => (en ? r.text_en || r.text_ar : r.text_ar)).slice(0, 3);
  if (!items.length) return null;
  return (
    <section className="qs-band qs-white" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div className="qs-head">
          <div>
            <span className="qs-kicker">{en ? 'Travellers' : 'المسافرون'}</span>
            <h2 className="qs-h2">{en ? 'In our customers’ words' : 'بكلمات عملائنا'}</h2>
          </div>
        </div>
        <div className="qs-voices">
          {items.map((r) => (
            <figure key={r.id} className="qs-voice">
              <blockquote>{en ? r.text_en || r.text_ar : r.text_ar}</blockquote>
              <figcaption>
                {r.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image_url} alt="" loading="lazy" width={40} height={40} />
                ) : (
                  <span aria-hidden="true">{String((en ? r.name_en || r.name_ar : r.name_ar) || '·').charAt(0)}</span>
                )}
                {en ? r.name_en || r.name_ar : r.name_ar}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
