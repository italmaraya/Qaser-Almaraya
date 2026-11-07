'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { activeSeason, seasonPackages } from '../lib/seasons';
import { loadPackages } from '../lib/publicPackages';
import { formatPrice } from '../lib/currency';
import { nightsLabel, destinationLabel } from '../lib/destinations';

// Homepage seasonal banner + "season offers" strip. Appears by itself for
// Ramadan, Eid al-Fitr, Eid al-Adha and New Year (and three weeks
// before each, as "coming soon"); hidden the rest of the year.
// Preview: add ?season=ramadan (eid_fitr, eid_adha, newyear, off).

// Banner artwork: one photo per season designed in Canva (public/season/*.webp),
// shaded on the text side so the Arabic/English copy stays readable. If the
// photo is missing the card simply keeps its gradient.
function Photo({ id, base }) {
  return (
    <div className="qa-ss-photo" aria-hidden="true" style={{ '--ss-a': base, '--ss-b': base + 'c8', '--ss-c': base + '00' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={'/season/' + id + '.webp'} alt="" draggable="false" decoding="async" onError={(e) => { e.currentTarget.parentNode.style.display = 'none'; }} />
      <span className="qa-ss-shade" />
    </div>
  );
}

export default function SeasonSpotlight({ lang = 'ar' }) {
  const en = lang === 'en';
  const nm = (ar, enText) => (en && enText ? enText : ar);
  const [active, setActive] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const a = activeSeason();
    setActive(a);
    if (!a) return undefined;
    let alive = true;
    loadPackages().then((list) => { if (alive) setItems(seasonPackages(list, a).slice(0, 3)); });
    return () => { alive = false; };
  }, []);

  if (!active) return null;
  const { season, soon, daysToStart } = active;
  const tx = en ? season.en : season.ar;
  const cta = '/packages' + (season.cats.length === 1 && items.some((p) => p.cat === season.cats[0]) ? '?cat=' + season.cats[0] : '');
  const inDays = soon ? (en ? ` — in ${daysToStart} day${daysToStart === 1 ? '' : 's'}` : ` — بعد ${daysToStart} ${daysToStart === 1 ? 'يوم' : daysToStart === 2 ? 'يومين' : daysToStart <= 10 ? 'أيام' : 'يوماً'}`) : '';

  return (
    <section className="qa-sec qa-ss-sec" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <style>{`
.qa-ss-sec{padding-bottom:0!important}
.qa-ss{position:relative;overflow:hidden;border-radius:var(--tw-radius,16px);padding:30px 34px;display:flex;flex-direction:column;gap:18px;animation:qa-ss-in .6s cubic-bezier(.16,1,.3,1) both}
@keyframes qa-ss-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.qa-ss h2{font-size:34px;font-weight:700;color:inherit}
.qa-ss-photo{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit}
.qa-ss-photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:left center;display:block;user-select:none}
[dir=ltr] .qa-ss-photo img{object-position:right center}
.qa-ss-shade{position:absolute;inset:0;background:linear-gradient(to left,var(--ss-a) 0%,var(--ss-a) 36%,var(--ss-b) 54%,var(--ss-c) 80%)}
[dir=ltr] .qa-ss-shade{background:linear-gradient(to right,var(--ss-a) 0%,var(--ss-a) 36%,var(--ss-b) 54%,var(--ss-c) 80%)}
.qa-ss-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;position:relative}
.qa-ss-card{display:flex;gap:10px;background:#fff;color:#1d2733;border-radius:var(--tw-radius-sm,10px);overflow:hidden;min-height:84px;transition:transform .15s}
.qa-ss-card:hover{color:#1d2733;transform:translateY(-2px)}
.qa-ss-card img{width:84px;flex-shrink:0;object-fit:cover}
.qa-ss .qa-btn{white-space:nowrap!important;min-height:0!important;line-height:1.3}
@media (max-width:820px){.qa-ss .qa-btn{padding:10px 20px!important;font-size:14.5px!important}.qa-ss{padding:150px 18px 22px}.qa-ss h2{font-size:23px!important}.qa-ss-photo img{object-position:center 30%}.qa-ss-shade,[dir=ltr] .qa-ss-shade{background:linear-gradient(to bottom,var(--ss-c) 0px,var(--ss-c) 60px,var(--ss-b) 120px,var(--ss-a) 175px)}.qa-ss-grid{display:flex!important;flex-direction:column}}
@media (prefers-reduced-motion:reduce){.qa-ss{animation:none}}
`}</style>
      <div className="qa-ss" style={{ background: season.bg, color: season.fg }}>
        <Photo id={season.id} base={season.base || '#036f8c'} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', maxWidth: 620 }}>
          <span style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 500, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)' }}>{tx.strip}{active.preview ? (en ? ' · preview' : ' · معاينة') : ''}</span>
          <h2>{soon ? tx.soon + inDays : tx.title}</h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, opacity: 0.92 }}>{tx.text}</p>
          <Link href={cta} className="qa-btn" style={{ alignSelf: 'flex-start', marginTop: 6, background: season.accent, color: season.fg === '#fff' ? '#1d2733' : season.fg, fontWeight: 700, padding: '12px 24px', fontSize: 15 }}>{tx.cta}</Link>
        </div>
        {items.length > 0 && (
          <div className="qa-ss-grid">
            {items.map((p) => (
              <Link key={p.id} href={'/packages/' + p.id} className="qa-ss-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <span style={{ width: 84, background: '#e4f5fb' }} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '8px 0', paddingInlineEnd: 12, minWidth: 0, flex: 1 }}>
                  <b style={{ fontSize: 14, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nm(p.title_ar, p.title_en)}</b>
                  <span style={{ fontSize: 12, color: '#5f666e' }}>{[destinationLabel(p, lang), nightsLabel(p, lang)].filter(Boolean).join(' · ')}</span>
                  <span style={{ marginTop: 'auto', fontSize: 14, fontWeight: 700, color: '#036f8c' }}>{formatPrice(p.price, 'IQD', lang)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
