'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { activeSeason, seasonPackages } from '../lib/seasons';
import { loadPackages } from '../lib/publicPackages';
import { formatPrice } from '../lib/currency';
import { nightsLabel, destinationLabel } from '../lib/destinations';

// Homepage seasonal banner + "season offers" strip. Appears by itself for
// Ramadan, Eid al-Fitr, Eid al-Adha, summer and New Year (and three weeks
// before each, as "coming soon"); hidden the rest of the year.
// Preview: add ?season=ramadan (eid_fitr, eid_adha, summer, newyear, off).

function Decor({ icon, accent }) {
  if (icon === 'crescent') {
    return (
      <svg className="qa-ss-art" viewBox="0 0 220 160" aria-hidden="true">
        <path d="M150 30a46 46 0 1 0 38 72 38 38 0 1 1-38-72Z" fill={accent} opacity=".95" />
        {[[40, 0, 46], [78, 0, 70], [112, 0, 38]].map(([x, , h], i) => (
          <g key={i} className="qa-ss-swing" style={{ transformOrigin: x + 'px 0px', animationDelay: i * 0.4 + 's' }}>
            <line x1={x} y1="0" x2={x} y2={h} stroke={accent} strokeWidth="1.5" />
            <path d={`M${x - 9} ${h + 6}h18l-3 22h-12z`} fill={accent} />
            <rect x={x - 6} y={h + 2} width="12" height="5" rx="2" fill={accent} />
            <rect x={x - 4} y={h + 11} width="8" height="12" rx="2" fill="#fff6d6" opacity=".85" />
          </g>
        ))}
        {[[20, 120], [190, 20], [200, 140], [60, 140]].map(([x, y], i) => <circle key={i} className="qa-ss-twinkle" style={{ animationDelay: i * 0.5 + 's' }} cx={x} cy={y} r="2.4" fill="#fff" />)}
      </svg>
    );
  }
  if (icon === 'sun') {
    return (
      <svg className="qa-ss-art" viewBox="0 0 220 160" aria-hidden="true">
        <g className="qa-ss-spin" style={{ transformOrigin: '150px 70px' }}>
          {Array.from({ length: 12 }).map((_, i) => <rect key={i} x="147" y="6" width="6" height="22" rx="3" fill="#fff" opacity=".8" transform={`rotate(${i * 30} 150 70)`} />)}
        </g>
        <circle cx="150" cy="70" r="30" fill="#fff" />
        <path d="M0 140c30-14 60-14 90 0s60 14 90 0 30-10 40-6v26H0z" fill="#fff" opacity=".35" />
      </svg>
    );
  }
  // stars (Eid) and sparkles (New Year)
  const pts = icon === 'sparkle' ? [[40, 30, 10], [100, 60, 16], [170, 30, 12], [150, 110, 18], [60, 120, 9], [200, 80, 8]] : [[50, 40, 14], [120, 30, 10], [180, 70, 18], [90, 110, 12], [160, 130, 9]];
  return (
    <svg className="qa-ss-art" viewBox="0 0 220 160" aria-hidden="true">
      {pts.map(([x, y, r], i) => (
        <path key={i} className="qa-ss-twinkle" style={{ animationDelay: i * 0.35 + 's', transformOrigin: x + 'px ' + y + 'px' }} d={`M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`} fill={i % 2 ? '#fff' : accent} />
      ))}
    </svg>
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
.qa-ss{position:relative;overflow:hidden;border-radius:26px;padding:30px 34px;display:flex;flex-direction:column;gap:18px;box-shadow:0 22px 50px rgba(1,42,55,.18);animation:qa-ss-in .6s cubic-bezier(.16,1,.3,1) both}
@keyframes qa-ss-in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.qa-ss h2{font-size:34px;font-weight:700;color:inherit}
.qa-ss-art{position:absolute;inset-inline-end:10px;top:0;width:260px;height:190px;pointer-events:none;opacity:.95}
[dir=rtl] .qa-ss-art{transform:scaleX(-1)}
.qa-ss-swing{animation:qa-ss-swing 3.2s ease-in-out infinite}
@keyframes qa-ss-swing{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
.qa-ss-twinkle{animation:qa-ss-tw 2.4s ease-in-out infinite}
@keyframes qa-ss-tw{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
.qa-ss-spin{animation:qa-ss-spin 24s linear infinite}
@keyframes qa-ss-spin{to{transform:rotate(360deg)}}
.qa-ss-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;position:relative}
.qa-ss-card{display:flex;gap:10px;background:#fff;color:#1d2733;border-radius:14px;overflow:hidden;min-height:84px}
.qa-ss-card:hover{color:#1d2733;transform:translateY(-2px)}
.qa-ss-card img{width:84px;flex-shrink:0;object-fit:cover}
.qa-ss .qa-btn{white-space:nowrap!important;min-height:0!important;line-height:1.3}
@media (max-width:820px){.qa-ss .qa-btn{padding:10px 20px!important;font-size:14.5px!important}.qa-ss{padding:22px 18px;border-radius:20px}.qa-ss h2{font-size:23px!important}.qa-ss-art{width:150px;height:110px;opacity:.55}.qa-ss-grid{display:flex!important;flex-direction:column}}
@media (prefers-reduced-motion:reduce){.qa-ss,.qa-ss-swing,.qa-ss-twinkle,.qa-ss-spin{animation:none}}
`}</style>
      <div className="qa-ss" style={{ background: season.bg, color: season.fg }}>
        <Decor icon={season.icon} accent={season.accent} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', maxWidth: 620 }}>
          <span style={{ alignSelf: 'flex-start', fontSize: 12.5, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)' }}>{tx.strip}{active.preview ? (en ? ' · preview' : ' · معاينة') : ''}</span>
          <h2>{soon ? tx.soon + inDays : tx.title}</h2>
          <p style={{ fontSize: 16.5, lineHeight: 1.7, opacity: 0.92 }}>{tx.text}</p>
          <Link href={cta} className="qa-btn" style={{ alignSelf: 'flex-start', marginTop: 6, background: season.accent, color: season.fg === '#fff' ? '#1d2733' : season.fg, fontWeight: 700, padding: '11px 24px', fontSize: 15 }}>{tx.cta}</Link>
        </div>
        {items.length > 0 && (
          <div className="qa-ss-grid">
            {items.map((p) => (
              <Link key={p.id} href={'/packages/' + p.id} className="qa-ss-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <span style={{ width: 84, background: '#e4f5fb' }} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '9px 0', paddingInlineEnd: 12, minWidth: 0, flex: 1 }}>
                  <b style={{ fontSize: 14.5, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nm(p.title_ar, p.title_en)}</b>
                  <span style={{ fontSize: 12, color: '#5f666e' }}>{[destinationLabel(p, lang), nightsLabel(p, lang)].filter(Boolean).join(' · ')}</span>
                  <span style={{ marginTop: 'auto', fontSize: 14.5, fontWeight: 700, color: '#036f8c' }}>{formatPrice(p.price, 'IQD', lang)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
