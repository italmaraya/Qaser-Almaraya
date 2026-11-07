'use client';
import { useEffect, useState } from 'react';
import HeroCinematic from './HeroCinematic';
import { waLink } from '../lib/whatsapp';
import { loadPackages, upcomingDates } from '../lib/publicPackages';
import { destinationLabel, nightsLabel } from '../lib/destinations';
import { formatPrice } from '../lib/currency';
import { baghdadToday } from '../lib/packageUrgency';

// The next real group departures for the glass panel in the hero: one per
// destination, nearest first, from the same packages list as the rest of
// the homepage.
function nextDepartures(list, lang) {
  const en = lang === 'en';
  const today = baghdadToday();
  const rows = (Array.isArray(list) ? list : [])
    .map((p) => ({ p, date: upcomingDates(p, today).filter((d) => d > today)[0], dest: destinationLabel(p, lang) || (en && p.title_en) || p.title_ar }))
    .filter((r) => r.date && r.dest)
    .sort((a, b) => a.date.localeCompare(b.date) || (Number(a.p.price) || 0) - (Number(b.p.price) || 0));
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (seen.has(r.dest)) continue;
    seen.add(r.dest);
    const d = new Date(r.date + 'T00:00:00Z');
    let month = '';
    try { month = new Intl.DateTimeFormat(en ? 'en-GB' : 'ar-IQ', { month: 'short', timeZone: 'UTC' }).format(d); } catch { month = r.date.slice(5, 7); }
    out.push({ href: '/packages/' + r.p.id, day: String(d.getUTCDate()), month, dest: r.dest, nights: nightsLabel(r.p, lang), price: formatPrice(r.p.price, 'IQD', lang) });
    if (out.length >= 3) break;
  }
  return out;
}

// Chooses the homepage hero slides:
//   1. slides uploaded in the dashboard (Homepage tab)
//   2. otherwise, built automatically from package and country cover photos
//   3. otherwise, the original hero (passed as children)
export default function HomeHero({ hero, lang = 'ar', onPrimary, children }) {
  const en = lang === 'en';
  const saved = (hero && Array.isArray(hero.slides) ? hero.slides : []).filter((s) => s && s.url);
  const [auto, setAuto] = useState(null);
  const [pkgs, setPkgs] = useState([]);

  useEffect(() => {
    let alive = true;
    loadPackages().then((l) => { if (alive) setPkgs(l); });
    return () => { alive = false; };
  }, []);

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

  const slides = saved.length
    ? saved.map((s) => ({ ...s, caption: en ? s.captionEn || s.captionAr : s.captionAr || s.captionEn }))
    : auto || [];

  // Placeholder matches the hero's new height so the page does not jump.
  if (!slides.length) return auto === null && !saved.length ? <div style={{ height: 'min(78vh,720px)', minHeight: 520, background: '#04161f' }} /> : children;

  const h = hero || {};
  return (
    <HeroCinematic
      slides={slides}
      lang={lang}
      live={nextDepartures(pkgs, lang)}
      liveTitle={en ? 'Next departures' : 'أقرب المغادرات'}
      kicker={en ? h.kickerEn || 'Your trusted travel partner' : h.kickerAr || 'شريكك الموثوق في السفر'}
      title={en ? h.titleEn || 'Your journey starts with us' : h.titleAr || 'رحلتك تبدأ معنا'}
      subtitle={en ? h.subtitleEn || 'Your memories begin with us.' : h.subtitleAr || 'نأخذك إلى حيث تتمنى، لنصنع ذكريات لا تُنسى.'}
      primary={{ label: en ? 'Browse packages' : 'تصفّح الباقات', onClick: onPrimary }}
      secondary={{ label: en ? 'Ask us on WhatsApp' : 'اسألنا على واتساب', href: waLink(en ? 'Hello Qaser Almaraya, I would like some help planning my trip.' : 'مرحباً قصر المرايا، أرغب بالمساعدة في التخطيط لرحلتي.') }}
    />
  );
}
