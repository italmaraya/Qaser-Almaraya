'use client';
import { useEffect, useState } from 'react';
import HeroCinematic from './HeroCinematic';

// Chooses the homepage hero slides:
//   1. slides uploaded in the dashboard (Homepage tab)
//   2. otherwise, built automatically from package and country cover photos
//   3. otherwise, the original hero (passed as children)
export default function HomeHero({ hero, lang = 'ar', onPrimary, children }) {
  const en = lang === 'en';
  const saved = (hero && Array.isArray(hero.slides) ? hero.slides : []).filter((s) => s && s.url);
  const [auto, setAuto] = useState(null);

  useEffect(() => {
    if (saved.length) return;
    let alive = true;
    Promise.all([
      fetch('/api/packages').then((r) => r.json()).catch(() => []),
      fetch('/api/visa/cards').then((r) => r.json()).catch(() => []),
    ]).then(([pk, vc]) => {
      if (!alive) return;
      const seen = new Set();
      const out = [];
      (Array.isArray(pk) ? pk : []).forEach((p) => {
        const url = p.pdf_banner_url || p.image_url;
        if (!url || seen.has(url)) return;
        seen.add(url);
        out.push({ type: 'image', url, caption: en ? p.dest_en || p.dest_ar : p.dest_ar });
      });
      (Array.isArray(vc) ? vc : []).forEach((c) => {
        const url = c.pdf_banner_url || c.card_image_url;
        if (!url || seen.has(url)) return;
        seen.add(url);
        out.push({ type: 'image', url, caption: en ? c.country_name_en || c.country_name_ar : c.country_name_ar });
      });
      setAuto(out.slice(0, 6));
    });
    return () => { alive = false; };
  }, [saved.length, en]); // eslint-disable-line react-hooks/exhaustive-deps

  const slides = saved.length
    ? saved.map((s) => ({ ...s, caption: en ? s.captionEn || s.captionAr : s.captionAr || s.captionEn }))
    : auto || [];

  if (!slides.length) return auto === null && !saved.length ? <div style={{ height: 'min(92vh,860px)', background: '#04161f' }} /> : children;

  const h = hero || {};
  return (
    <HeroCinematic
      slides={slides}
      lang={lang}
      kicker={en ? h.kickerEn || 'Your trusted travel partner' : h.kickerAr || 'شريكك الموثوق في السفر'}
      title={en ? h.titleEn || 'Your journey starts with us' : h.titleAr || 'رحلتك تبدأ معنا'}
      subtitle={en ? h.subtitleEn || 'Visas, holidays and flights, planned for you from Baghdad to the world.' : h.subtitleAr || 'تأشيرات ورحلات وطيران… نخطط لك كل شيء من بغداد إلى العالم.'}
      primary={{ label: en ? 'Start your journey' : 'ابدأ رحلتك الآن', onClick: onPrimary }}
      secondary={{ label: en ? 'Browse packages' : 'تصفّح الباقات', href: '/packages' }}
    />
  );
}
