'use client';
import Icon from './Icon';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '../lib/currency';
import { nightsLabel, destinationLabel } from '../lib/destinations';
import { loadPackages } from '../lib/publicPackages';
import { siteUrgency } from '../lib/packageUrgency';

// "Featured offers" strip on the homepage: the first packages in the order
// set in the dashboard, with photo, duration and starting price. Hidden when
// there are no packages (or the list fails to load).
const MAX = 6;

export default function HomeOffers({ lang = 'ar' }) {
  const en = lang === 'en';
  const [items, setItems] = useState(null);

  useEffect(() => {
    let alive = true;
    loadPackages().then((list) => { if (alive) setItems(list.slice(0, MAX)); });
    return () => { alive = false; };
  }, []);

  if (items && items.length === 0) return null;
  const nm = (ar, enText) => (en && enText ? enText : ar);

  return (
    <section className="qa-sec qa-offers" data-no-i18n="" dir={en ? 'ltr' : 'rtl'} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
.qa-offer{display:flex;flex-direction:column;background:#fff;border:1px solid #ececed;border-radius:var(--tw-radius,16px);overflow:hidden;box-shadow:var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06));color:inherit;transition:transform .2s ease,box-shadow .2s ease}
.qa-offer:hover{transform:translateY(-2px);box-shadow:var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06));color:inherit}
.qa-offer-img{position:relative;aspect-ratio:16/10;background:#e4f5fb;overflow:hidden}
.qa-offer-urg{position:absolute;top:10px;inset-inline-start:10px;display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;color:#fff;font-size:12px;font-weight:700;box-shadow:var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))}
.qa-offer-img img{width:100%;height:100%;object-fit:cover}
.qa-offer-skel{background:linear-gradient(90deg,#eef6f9 25%,#f7fbfc 50%,#eef6f9 75%);background-size:200% 100%;animation:qa-skel 1.2s linear infinite;min-height:300px;border-radius:var(--tw-radius,16px)}
@keyframes qa-skel{to{background-position:-200% 0}}
@media (max-width:820px){.qa-offers-grid{display:flex!important;overflow-x:auto;scroll-snap-type:x mandatory;gap:12px!important;padding-bottom:8px;scrollbar-width:none}.qa-offers-grid::-webkit-scrollbar{display:none}.qa-offers-grid>*{flex:0 0 78%;scroll-snap-align:start}.qa-offers .qa-btn{white-space:nowrap!important;padding:9px 16px!important;min-height:0!important;font-size:14px!important}}
`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <h2 style={{ fontSize: 34, fontWeight: 700 }}>{en ? 'Featured offers' : 'أبرز العروض'}</h2>
          <p style={{ fontSize: 16, color: '#5f666e' }}>{en ? 'Ready-made trips from Baghdad, one price per person.' : 'رحلات جاهزة من بغداد بسعر واحد للفرد.'}</p>
        </div>
        <Link href="/packages" className="qa-btn qa-cyan" style={{ padding: '11px 24px', fontSize: 15, whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'center' }}>{en ? 'All packages' : 'كل الباقات'}</Link>
      </div>
      <div className="qa-offers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 20 }}>
        {items === null
          ? [0, 1, 2].map((i) => <div key={i} className="qa-offer-skel" aria-hidden="true" />)
          : items.map((p) => (
            <Link key={p.id} href={'/packages/' + p.id} className="qa-offer">
              <div className="qa-offer-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image_url ? <img src={p.image_url} alt={nm(p.title_ar, p.title_en)} loading="lazy" /> : null}
                {(() => {
                  const u = siteUrgency(p, lang);
                  if (!u || !u.label) return null;
                  return <span className={'qa-offer-urg' + (u.hot && !u.soldOut ? ' qa-urg-badge' : '')} style={{ background: u.soldOut ? '#1d2733' : u.hot ? '#e0364f' : '#faab18' }}><Icon name={u.soldOut ? 'ban' : 'clock'} size={12} />{u.label}</span>;
                })()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 16px 16px', flex: 1 }}>
                <span style={{ fontSize: 13, color: '#5f666e' }}>{[destinationLabel(p, lang), nightsLabel(p, lang)].filter(Boolean).join(' · ')}</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1d2733', lineHeight: 1.35 }}>{nm(p.title_ar, p.title_en)}</h3>
                <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#5f666e' }}>{en ? 'From' : 'يبدأ من'}</span>
                  <span style={{ fontSize: 19, fontWeight: 700, color: '#036f8c' }}>{formatPrice(p.price, 'IQD', lang)}</span>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </section>
  );
}
