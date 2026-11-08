'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

// Public-site motion: a reading-progress bar plus fade-up reveal of page
// sections as they scroll into view. Everything is scoped to
// html[data-area=site] and the classes are added by JS only, so the dashboard,
// no-JS visitors and reduced-motion users always see plain, static content.

const EASE = 'cubic-bezier(.22,1,.36,1)';
const CSS = `
.qs-sp{display:none}
html[data-area=site] .qs-sp.on{display:block;position:fixed;top:0;inset-inline:0;height:3px;z-index:2147483000;pointer-events:none;transform-origin:right center;background:linear-gradient(to left,#049dc5,#00b8f8 55%,#faab18)}
html[data-area=site][dir=ltr] .qs-sp.on{transform-origin:left center;background:linear-gradient(to right,#049dc5,#00b8f8 55%,#faab18)}
@media (prefers-reduced-motion:no-preference){
html[data-area=site] .qs-rv{opacity:0;transform:translate3d(0,28px,0);transition:opacity .7s ${EASE},transform .7s ${EASE}}
html[data-area=site] .qs-rv .qs-rv-c{opacity:0;transform:translate3d(0,18px,0);transition:opacity .6s ${EASE} calc(var(--qs-i,0)*70ms + 120ms),transform .6s ${EASE} calc(var(--qs-i,0)*70ms + 120ms)}
html[data-area=site] .qs-rv.qs-in,html[data-area=site] .qs-rv.qs-in .qs-rv-c{opacity:1;transform:none}
}
@media print{.qs-sp{display:none!important}.qs-rv,.qs-rv-c{opacity:1!important;transform:none!important}}
`;

const SKIP_PATH = /^\/(admin|staff|api)(\/|$)/;
const CARD = '[class*=card]';                  // q-card, qa-testi-card, qs-ig-card...
const NOPE = 'section, header, [data-no-reveal], .qs-st-view';
const DONE_MS = 1500;                           // longest stagger + transition, then untag

export default function ScrollReveal() {
  const path = usePathname() || '/';
  const bar = useRef(null);

  useEffect(() => {
    if (SKIP_PATH.test(path)) return;
    const root = document.documentElement;
    const isSite = () => root.dataset.area === 'site';
    const el = bar.current;
    let alive = true, raf = 0, pend = 0, io = null, mo = null, ro = null;
    const timers = [];

    // ---- Progress bar: rAF-throttled, hidden when the page can't scroll ----
    const paint = () => {
      raf = 0;
      if (!el) return;
      const max = root.scrollHeight - window.innerHeight;
      const on = alive && isSite() && max > 8;
      el.classList.toggle('on', on);
      if (on) el.style.transform = `scaleX(${Math.min(1, Math.max(0, window.scrollY / max))})`;
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(paint); };

    // ---- Reveal ----
    const seen = new WeakSet();   // checked once: in-view elements are never hidden later
    const live = new Set();       // tagged and still hidden
    const all = new Set();        // everything we touched, for cleanup
    const motion = 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Drop our classes entirely so the element is back to its own styles
    // (no lingering transform, so fixed/sticky descendants behave normally).
    const finish = (n) => {
      n.classList.remove('qs-rv', 'qs-in');
      n.querySelectorAll('.qs-rv-c').forEach((c) => { c.classList.remove('qs-rv-c'); c.style.removeProperty('--qs-i'); });
      all.delete(n);
    };
    const reveal = (n) => {
      if (!live.delete(n)) return;
      if (io) io.unobserve(n);
      n.classList.add('qs-in');
      timers.push(setTimeout(() => finish(n), DONE_MS));
    };
    // Stagger the outermost card-like descendants of a still-hidden section.
    const tagCards = (n) => {
      let i = n.querySelectorAll('.qs-rv-c').length;
      n.querySelectorAll(CARD).forEach((c) => {
        if (i >= 24 || c.classList.contains('qs-rv-c')) return;
        const outer = c.parentElement && c.parentElement.closest(CARD);
        if (outer && n.contains(outer)) return;
        c.classList.add('qs-rv-c');
        c.style.setProperty('--qs-i', String(Math.min(i++, 8)));
      });
    };
    const scan = () => {
      pend = 0;
      if (!alive || !isSite()) return;
      const vh = window.innerHeight;
      document.querySelectorAll('section, footer').forEach((n) => {
        if (seen.has(n)) return;
        seen.add(n);
        if (n.matches('[data-no-reveal]') || (n.parentElement && n.parentElement.closest(NOPE)) || n.querySelector('header')) return;
        if (n.getBoundingClientRect().top < vh) return;   // in view (or above): leave it alone
        n.classList.add('qs-rv');
        live.add(n); all.add(n);
        io.observe(n);
      });
      live.forEach(tagCards);   // cards that arrived late in a still-hidden section
    };
    const revealAll = () => { [...live].forEach(reveal); [...all].forEach(finish); };

    const start = () => {
      if (!alive || !isSite()) return;
      if (motion) {
        // Fire when the top edge crosses ~88% of the viewport (works for very tall sections too).
        io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && reveal(e.target)),
          { rootMargin: '0px 0px -12% 0px' });
        scan();
        window.addEventListener('beforeprint', revealAll);
      }
      // Sections render late (client fetches): rescan, throttled, on DOM changes.
      mo = new MutationObserver(() => { if (motion && !pend) pend = setTimeout(scan, 120); queue(); });
      mo.observe(document.body, { childList: true, subtree: true });
      if ('ResizeObserver' in window) { ro = new ResizeObserver(queue); ro.observe(document.body); }
      window.addEventListener('scroll', queue, { passive: true });
      window.addEventListener('resize', queue, { passive: true });
      queue();
    };
    // Defer a tick so AreaMark has updated data-area after client navigation.
    const t0 = setTimeout(start, 60);

    return () => {
      alive = false;
      clearTimeout(t0); clearTimeout(pend); timers.forEach(clearTimeout);
      if (raf) cancelAnimationFrame(raf);
      if (io) io.disconnect();
      if (mo) mo.disconnect();
      if (ro) ro.disconnect();
      window.removeEventListener('beforeprint', revealAll);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      [...all].forEach(finish);
      if (el) el.classList.remove('on');
    };
  }, [path]);

  return (
    <>
      <style>{CSS}</style>
      <div ref={bar} className="qs-sp" aria-hidden="true" />
    </>
  );
}
