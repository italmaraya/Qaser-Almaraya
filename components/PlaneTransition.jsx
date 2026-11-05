'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import FlyingPlaneArt from './FlyingPlaneArt';

// When a visitor moves to another page, the page slides in as usual and a
// plane flies across the screen above it: it swoops, banks and climbs, leaving
// a vapour trail. It never blocks the page or a tap, does not run on the first
// page load, skips staff pages and visitors who ask for reduced motion.

const HIDE_ON = ['/admin', '/staff', '/login'];

function whoosh(dur) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = window.__qaPlaneCtx || (window.__qaPlaneCtx = new AC());
    if (ctx.state === 'suspended') ctx.resume();
    if (ctx.state !== 'running') return; // browser has not allowed sound yet
    const t = ctx.currentTime + 0.02;
    const s = dur / 1000;
    const len = Math.floor(ctx.sampleRate * s);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.9;
    band.frequency.setValueAtTime(300, t);
    band.frequency.exponentialRampToValueAtTime(1300, t + s * 0.45);
    band.frequency.exponentialRampToValueAtTime(260, t + s * 0.97);
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + s * 0.42);
    g.gain.exponentialRampToValueAtTime(0.0001, t + s * 0.98);
    src.connect(band).connect(low).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + s);
  } catch {
    /* sound is optional */
  }
}

export default function PlaneTransition() {
  const path = usePathname() || '/';
  const hidden = HIDE_ON.some((p) => path.startsWith(p));
  const [flight, setFlight] = useState(0); // bumps on every page change
  const first = useRef(true);
  const boxRef = useRef(null);
  const artRef = useRef(null);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (hidden) return;
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    } catch { /* ignore */ }
    setFlight((n) => n + 1);
  }, [path, hidden]);

  useEffect(() => {
    if (!flight || !boxRef.current) return undefined;
    const el = boxRef.current;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const phone = W < 820;
    const size = phone ? 104 : 160;
    const dur = phone ? 2900 : 3400;
    let en = false;
    try { en = localStorage.getItem('qa_lang') === 'en'; } catch { /* ignore */ }
    // Arabic reads right to left, so the plane flies right → left.
    // [x share of width, y share of height, bank deg, scale]
    const route = [
      [1.08, 0.40, 10, 0.82],
      [0.84, 0.25, -4, 0.94],
      [0.64, 0.17, -13, 1.04],
      [0.46, 0.24, 2, 1.12],
      [0.30, 0.36, 12, 1.06],
      [0.14, 0.27, -8, 0.96],
      [-0.12, 0.13, -15, 0.86],
    ];
    const frames = route.map(([fx, fy, r, sc], i) => {
      const x = en ? W - fx * W - size : fx * W;
      const y = fy * H;
      return { transform: `translate(${x}px, ${y}px) rotate(${en ? -r : r}deg) scale(${sc})`, offset: i / (route.length - 1) };
    });
    let anim;
    try {
      anim = el.animate(frames, { duration: dur, easing: 'cubic-bezier(.42,0,.58,1)', fill: 'forwards' });
      anim.onfinish = () => setTimeout(() => setFlight((f) => (f === flight ? 0 : f)), 1700); // let the vapour fade
    } catch {
      setFlight(0);
      return undefined;
    }
    whoosh(dur);

    // Vapour trail: puffs left behind the tail; each grows and fades.
    const layer = el.parentElement;
    const art = artRef.current;
    let raf = 0;
    let last = 0;
    const tick = (now) => {
      if (now - last > 18 && art) {
        last = now;
        const r = art.getBoundingClientRect();
        if (r.right > -40 && r.left < W + 40) {
          const puff = document.createElement('span');
          puff.className = 'qa-vapor';
          const s = phone ? 10 : 14;
          const tailX = en ? r.left + r.width * 0.1 : r.right - r.width * 0.1;
          puff.style.cssText = `left:${tailX - s / 2}px;top:${r.top + r.height * 0.55 - s / 2}px;width:${s}px;height:${s}px`;
          layer.appendChild(puff);
          setTimeout(() => puff.remove(), 1700);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      try { anim.cancel(); } catch { /* ignore */ }
      layer && layer.querySelectorAll('.qa-vapor').forEach((p) => p.remove());
    };
  }, [flight]);

  if (hidden || !flight) return null;
  const phone = typeof window !== 'undefined' && window.innerWidth < 820;
  let en = false;
  try { en = localStorage.getItem('qa_lang') === 'en'; } catch { /* ignore */ }
  return (
    <div aria-hidden="true" className="qa-flyplane-layer">
      <div ref={boxRef} className="qa-flyplane">
        <div ref={artRef} className="qa-flyplane-art">
          <FlyingPlaneArt width={phone ? 104 : 160} style={{ display: 'block', transform: en ? 'none' : 'scaleX(-1)' }} />
        </div>
      </div>
    </div>
  );
}
