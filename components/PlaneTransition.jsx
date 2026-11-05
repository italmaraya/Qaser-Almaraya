'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import FlyingPlaneArt from './FlyingPlaneArt';

// Page transition: a plane flies in from the reading side towing a big
// advertising banner, like the banner planes over a beach. The banner covers
// the screen, the next page loads behind it, then the plane pulls it away.
// Off on staff pages and for visitors who ask for reduced motion.

const HIDE_ON = ['/admin', '/staff', '/login'];
const LABELS = [
  ['/packages', 'الباقات', 'Packages'],
  ['/visa', 'التأشيرات', 'Visas'],
  ['/flights', 'الطيران والفنادق', 'Flights & hotels'],
  ['/contact', 'تواصل معنا', 'Contact us'],
  ['/faq', 'الأسئلة الشائعة', 'FAQ'],
  ['/jobs', 'الوظائف', 'Careers'],
  ['/news', 'المدونة', 'Blog'],
];

function labelFor(path, en) {
  const hit = LABELS.find(([p]) => path === p || path.startsWith(p + '/'));
  if (hit) return en ? hit[2] : hit[1];
  return en ? 'Qaser Al-Maraya' : 'قصر المرايا';
}

function whoosh() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = window.__qaPlaneCtx || (window.__qaPlaneCtx = new AC());
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime + 0.02;
    const len = Math.floor(ctx.sampleRate * 1.8);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.8;
    band.frequency.setValueAtTime(320, t);
    band.frequency.exponentialRampToValueAtTime(1300, t + 0.7);
    band.frequency.exponentialRampToValueAtTime(280, t + 1.7);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.75);
    src.connect(band).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + 1.8);
  } catch {
    /* sound is optional */
  }
}

export default function PlaneTransition() {
  const router = useRouter();
  const path = usePathname() || '/';
  const hidden = HIDE_ON.some((p) => path.startsWith(p));
  const [run, setRun] = useState(null); // { href, label, en }
  const boxRef = useRef(null);
  const busy = useRef(false);
  const pathRef = useRef(path);
  const waiters = useRef([]);

  useEffect(() => {
    pathRef.current = path;
    const w = waiters.current;
    waiters.current = [];
    w.forEach((fn) => fn());
  }, [path]);

  const go = useCallback((href) => {
    let url;
    try { url = new URL(href, window.location.href); } catch { router.push(href); return; }
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (busy.current || reduce || url.pathname === window.location.pathname) {
      if (!busy.current) router.push(url.pathname + url.search + url.hash);
      return;
    }
    let en = false;
    try { en = localStorage.getItem('qa_lang') === 'en'; } catch { /* ignore */ }
    busy.current = true;
    setRun({ href: url.pathname + url.search + url.hash, path: url.pathname, label: labelFor(url.pathname, en), en });
  }, [router]);

  // Links: catch ordinary same-site clicks before Next's <Link> handles them.
  useEffect(() => {
    if (hidden) return undefined;
    window.qaPlaneGo = go;
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || a.target && a.target !== '_self' || a.hasAttribute('download')) return;
      const raw = a.getAttribute('href') || '';
      if (!raw.startsWith('/') || raw.startsWith('//')) return;
      const url = new URL(raw, window.location.href);
      if (url.pathname === window.location.pathname) return;
      if (HIDE_ON.some((p) => url.pathname.startsWith(p))) return;
      e.preventDefault();
      go(raw);
    };
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      if (window.qaPlaneGo === go) delete window.qaPlaneGo;
    };
  }, [hidden, go]);

  useEffect(() => {
    if (!run || !boxRef.current) return undefined;
    const el = boxRef.current;
    const W = window.innerWidth;
    const phone = W < 820;
    const plane = phone ? 104 : 168;
    const rope = phone ? 46 : 84;
    const banner = W + 40;
    const coverX = -(plane + rope);
    const endX = -(plane + rope + banner + 40);
    const en = run.en;
    // Arabic reads right to left, so the plane comes from the right.
    const startX = en ? -(plane + rope + banner) - 20 : W + 20;
    const covX = en ? 0 : coverX; // when flying right, the banner trails on the left
    const exitX = en ? W + plane + rope + 40 : endX;
    let cancelled = false;
    const timers = [];

    const a1 = el.animate(
      [{ transform: `translateX(${startX}px)` }, { transform: `translateX(${covX}px)` }],
      { duration: phone ? 620 : 720, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' },
    );
    whoosh();
    a1.onfinish = () => {
      if (cancelled) return;
      const target = run.path;
      const release = () => {
        if (cancelled) return;
        timers.push(setTimeout(() => {
          if (cancelled) return;
          window.scrollTo(0, 0);
          const a2 = el.animate(
            [{ transform: `translateX(${covX}px)` }, { transform: `translateX(${exitX}px)` }],
            { duration: phone ? 680 : 800, easing: 'cubic-bezier(.5,0,.75,.4)', fill: 'forwards' },
          );
          a2.onfinish = () => { busy.current = false; setRun(null); };
        }, 120));
      };
      router.push(run.href);
      if (pathRef.current === target) release();
      else {
        waiters.current.push(release);
        timers.push(setTimeout(release, 4500)); // never stay covered
      }
    };
    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [run, router]);

  if (hidden || !run) return null;
  const phone = typeof window !== 'undefined' && window.innerWidth < 820;
  const planeW = phone ? 104 : 168;
  const ropeW = phone ? 46 : 84;
  return (
    <div aria-hidden="true" className="qa-tow-layer">
      <div ref={boxRef} className={'qa-tow' + (run.en ? ' qa-tow-en' : '')}>
        <div className="qa-tow-plane" style={{ width: planeW }}>
          <FlyingPlaneArt width={planeW} style={{ display: 'block', transform: run.en ? 'none' : 'scaleX(-1)' }} />
        </div>
        <svg className="qa-tow-rope" width={ropeW} height="100%" viewBox={`0 0 ${ropeW} 100`} preserveAspectRatio="none">
          <path d={run.en ? `M${ropeW} 50 L0 1 M${ropeW} 50 L0 99` : `M0 50 L${ropeW} 1 M0 50 L${ropeW} 99`} stroke="#1d2733" strokeOpacity=".55" strokeWidth="1.2" vectorEffect="non-scaling-stroke" fill="none" />
        </svg>
        <div className="qa-tow-banner">
          <div className="qa-tow-cloth">
            <img src="/assets/logo-mark-white.webp" alt="" />
            <b>{run.label}</b>
            <span>{run.en ? 'Qaser Al-Maraya Travel & Tourism' : 'قصر المرايا للسفر والسياحة'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
