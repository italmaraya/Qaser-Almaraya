'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { COUNTRY_GEO } from '../lib/geoData';
import { findCountryIso } from '../lib/visaPdf';

const Globe3D = dynamic(() => import('./Globe3D'), { ssr: false, loading: () => <div style={{ height: 420 }} /> });

const BAGHDAD = { lat: 33.31, lng: 44.36 };

// Homepage globe: glowing flight lines from Baghdad to every country we serve
// (visa countries + package destinations). Tapping a point opens a small card
// with links to that country's visas and packages.
export default function HomeGlobe({ lang = 'ar' }) {
  const en = lang === 'en';
  const [visaCards, setVisaCards] = useState([]);
  const [packages, setPackages] = useState([]);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    fetch('/api/visa/cards').then((r) => r.json()).then((d) => Array.isArray(d) && setVisaCards(d)).catch(() => {});
    fetch('/api/packages').then((r) => r.json()).then((d) => Array.isArray(d) && setPackages(d)).catch(() => {});
  }, []);

  const pins = useMemo(() => {
    const byIso = {};
    const ensure = (iso) => {
      const g = COUNTRY_GEO[iso];
      if (!g || iso === 'iq') return null;
      if (!byIso[iso]) byIso[iso] = { iso, lat: g[0], lng: g[1], name: en ? g[4] : g[3], visaCountryId: null, visas: 0, packages: 0, flag: '' };
      return byIso[iso];
    };
    visaCards.forEach((c) => {
      const iso = findCountryIso(c);
      const p = iso && ensure(iso);
      if (!p) return;
      p.visas += 1;
      p.visaCountryId = c.country_id;
      p.name = en ? c.country_name_en || p.name : c.country_name_ar || p.name;
      if (/^(https?:|\/)/.test(c.flag_code || '')) p.flag = c.flag_code;
    });
    packages.forEach((pk) => {
      (Array.isArray(pk.countries) ? pk.countries : []).forEach((code) => {
        const p = ensure(String(code).toLowerCase());
        if (p) p.packages += 1;
      });
    });
    return Object.values(byIso).map((p) => ({ ...p, flag: p.flag || '/assets/flags/' + p.iso + '.png' }));
  }, [visaCards, packages, en]);

  if (!pins.length) return null;

  return (
    <section className="qa-sec" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,.8fr) 1.2fr', gap: 32, alignItems: 'center' }} dir={en ? 'ltr' : 'rtl'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#049dc5' }}>{en ? 'From Baghdad to the world' : 'من بغداد إلى العالم'}</span>
        <h2 style={{ margin: 0, fontSize: 'clamp(24px,3vw,34px)', lineHeight: 1.25 }}>{en ? `${pins.length} destinations, one call away` : `${pins.length} وجهة… على بُعد رسالة واحدة`}</h2>
        <p style={{ margin: 0, color: '#3d4650', lineHeight: 1.8 }}>
          {en ? 'Spin the globe and tap any glowing point to see its visas and trips.' : 'أدر الكرة الأرضية واضغط على أي نقطة مضيئة لتشاهد تأشيراتها ورحلاتها.'}
        </p>
        {picked ? (
          <div className="qa-card" style={{ display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid #d9e9ef' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={picked.flag} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: 38, height: 26, objectFit: 'cover', borderRadius: 5, border: '1px solid #ececed' }} />
              <b style={{ fontSize: 18 }}>{picked.name}</b>
              <button type="button" onClick={() => setPicked(null)} style={{ marginInlineStart: 'auto', border: 0, background: 'none', cursor: 'pointer', fontSize: 18, color: '#7b8087' }} aria-label="close">×</button>
            </div>
            <span style={{ fontSize: 13, color: '#7b8087' }}>
              {picked.visas > 0 && (en ? `${picked.visas} visa type${picked.visas > 1 ? 's' : ''}` : `${picked.visas} نوع تأشيرة`)}
              {picked.visas > 0 && picked.packages > 0 && ' · '}
              {picked.packages > 0 && (en ? `${picked.packages} package${picked.packages > 1 ? 's' : ''}` : `${picked.packages} باقة سياحية`)}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {picked.visas > 0 && picked.visaCountryId && (
                <Link href={`/visa/country/${picked.visaCountryId}`} className="qa-btn qa-cyan" style={{ textDecoration: 'none', padding: '9px 18px', fontSize: 14 }}>{en ? 'View visas' : 'عرض التأشيرات'}</Link>
              )}
              {picked.packages > 0 && (
                <Link href={`/packages?q=${encodeURIComponent(picked.name)}`} className="qa-btn qa-amber" style={{ textDecoration: 'none', padding: '9px 18px', fontSize: 14 }}>{en ? 'View packages' : 'عرض الباقات'}</Link>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {pins.slice(0, 12).map((p) => (
              <button key={p.iso} type="button" onClick={() => setPicked(p)} style={{ border: '1px solid #ececed', background: '#fff', borderRadius: 999, padding: '5px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>{p.name}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ position: 'relative', borderRadius: 24, background: 'radial-gradient(circle at 50% 45%,#0d3d52 0%,#062433 60%,#04161f 100%)', overflow: 'hidden' }}>
        <Globe3D pins={pins} origin={BAGHDAD} startLng={BAGHDAD.lng - 12} startLat={28} cameraZ={7.4} onSelectPin={setPicked} height={420} />
        <span style={{ position: 'absolute', bottom: 12, insetInlineStart: 16, fontSize: 12, color: 'rgba(255,255,255,.75)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5a5f', display: 'inline-block' }} /> {en ? 'Baghdad' : 'بغداد'}
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#faab18', display: 'inline-block', marginInlineStart: 10 }} /> {en ? 'Our destinations' : 'وجهاتنا'}
        </span>
      </div>
    </section>
  );
}
