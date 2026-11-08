'use client';
import { useEffect, useState } from 'react';
import HeroCinematic from './HeroCinematic';
import { waLink } from '../lib/whatsapp';
import { loadPackages } from '../lib/publicPackages';

// Owner, 8 Nov 2026: the Skylo-with-passport artwork (no text on it) plays
// right after the Skylo video. It is part of the code, not the dashboard
// slides, so it ships with the site like any other change.
const SKYLO_SLIDE = { type: 'image', url: '/assets/hero-skylo-passport.webp', posMobile: '25% 50%', builtIn: true };

function withSkylo(list) {
  if (!list.length || list.some((s) => s.url === SKYLO_SLIDE.url)) return list;
  const v = list.findIndex((s) => s.type === 'video');
  const at = v === -1 ? 0 : v + 1;
  return [...list.slice(0, at), SKYLO_SLIDE, ...list.slice(at)];
}

export default function HomeHero({ hero, lang = 'ar', onPrimary, children }) {
  const en = lang === 'en';
  const saved = (hero && Array.isArray(hero.slides) ? hero.slides : []).filter((s) => s && s.url);
  const [auto, setAuto] = useState(null);

  useEffect(() => {
    if (saved.length) return;
    let alive = true;
    Promise.all([
      loadPackages(),
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

  const slides = withSkylo(saved.length
    ? saved.map((s) => ({ ...s, caption: en ? s.captionEn || s.captionAr : s.captionAr || s.captionEn }))
    : auto || []);

  // Placeholder matches the hero's new height so the page does not jump.
  if (!slides.length) return auto === null && !saved.length ? <div style={{ height: 'min(78vh,720px)', minHeight: 520, background: '#04161f' }} /> : children;

  const h = hero || {};
  return (
    <HeroCinematic
      slides={slides}
      lang={lang}
      kicker={en ? h.kickerEn || 'Your trusted travel partner' : h.kickerAr || 'شريكك الموثوق في السفر'}
      title={en ? h.titleEn || 'Your journey starts with us' : h.titleAr || 'رحلتك تبدأ معنا'}
      subtitle={en ? h.subtitleEn || 'Your memories begin with us.' : h.subtitleAr || 'نأخذك إلى حيث تتمنى، لنصنع ذكريات لا تُنسى.'}
      primary={{ label: en ? 'Browse packages' : 'تصفّح الباقات', onClick: onPrimary }}
      secondary={{ label: en ? 'Ask us on WhatsApp' : 'اسألنا على واتساب', href: waLink(en ? 'Hello Qaser Almaraya, I would like some help planning my trip.' : 'مرحباً قصر المرايا، أرغب بالمساعدة في التخطيط لرحلتي.') }}
    />
  );
}
