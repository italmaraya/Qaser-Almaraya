'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import FlyingPlaneArt from './FlyingPlaneArt';

// A plane that flies once across the screen when a visitor first opens the
// site (once per browser tab session). Purely decorative: it never blocks a
// tap, skips visitors who ask for reduced motion, and stays off staff pages.
//
// Sound: browsers do not let a page play sound before the visitor taps
// something. If the browser already allows it (the site was used before), a
// soft jet "whoosh" plays with the flight; otherwise the first tap during the
// flight plays it.

const HIDE_ON = ['/admin', '/staff', '/login'];
const SEEN_KEY = 'qa_plane_seen';
const FLIGHT_MS = 5200;

function whoosh(ctx) {
  try {
    const t = ctx.currentTime + 0.02;
    const len = Math.floor(ctx.sampleRate * 3.2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.9;
    band.frequency.setValueAtTime(300, t);
    band.frequency.exponentialRampToValueAtTime(1400, t + 1.4);
    band.frequency.exponentialRampToValueAtTime(260, t + 3.1);
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 2200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 1.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.15);
    src.connect(band).connect(low).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + 3.2);
  } catch {
    /* sound is optional */
  }
}

export default function FlyingPlane() {
  const path = usePathname() || '/';
  const hidden = HIDE_ON.some((p) => path.startsWith(p));
  const [fly, setFly] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (hidden) return;
    try {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const force = /[?&]fly=1\b/.test(window.location.search); // owner test link
      if (!force && sessionStorage.getItem(SEEN_KEY)) return;
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      return; // no storage → don't risk replaying on every page
    }
    const id = setTimeout(() => setFly(true), 900);
    return () => clearTimeout(id);
  }, [hidden]);

  useEffect(() => {
    if (!fly || !boxRef.current) return;
    const el = boxRef.current;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const phone = W < 820;
    const size = phone ? 110 : 170;
    const y0 = H * (phone ? 0.3 : 0.34);
    // Right → left (Arabic reading direction), a gentle climb then a dip.
    const pts = [
      [W + 40, y0 + 40, 4],
      [W * 0.72, y0 - H * 0.04, -3],
      [W * 0.45, y0 - H * 0.1, -6],
      [W * 0.2, y0 - H * 0.06, 2],
      [-size - 220, y0 + 10, 6],
    ];
    const frames = pts.map(([x, y, r], i) => ({
      transform: `translate(${x}px, ${y}px) rotate(${r}deg)`,
      offset: i / (pts.length - 1),
    }));
    let anim;
    try {
      anim = el.animate(frames, { duration: FLIGHT_MS, easing: 'cubic-bezier(.45,.05,.4,1)', fill: 'forwards' });
      anim.onfinish = () => setTimeout(() => setFly(false), 1800); // let the vapour fade
    } catch {
      setFly(false);
      return;
    }

    // Vapour trail: soft white puffs left behind the engines; each one grows
    // and fades where the plane has just been.
    const layer = el.parentElement;
    const plane = el.querySelector('svg');
    let raf = 0;
    let last = 0;
    const tick = (now) => {
      if (now - last > 16 && plane) {
        last = now;
        const r = plane.getBoundingClientRect();
        if (r.right > -40 && r.left < W + 40) {
          const puff = document.createElement('span');
          puff.className = 'qa-vapor';
          const s = phone ? 10 : 13;
          puff.style.cssText = `left:${r.right - r.width * 0.12 - s / 2}px;top:${r.top + r.height * 0.56 - s / 2}px;width:${s}px;height:${s}px`;
          layer.appendChild(puff);
          setTimeout(() => puff.remove(), 1900);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // Sound, only when the browser allows it.
    let ctx = null;
    let played = false;
    const playOnce = () => {
      if (played) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = ctx || new AC();
        if (ctx.state === 'suspended') ctx.resume();
        if (ctx.state === 'running' || ctx.state === 'suspended') {
          played = true;
          whoosh(ctx);
        }
      } catch {
        /* ignore */
      }
    };
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        ctx = new AC();
        if (ctx.state === 'running') { played = true; whoosh(ctx); }
      }
    } catch {
      /* ignore */
    }
    const onTap = () => playOnce();
    window.addEventListener('pointerdown', onTap, { once: true, capture: true });
    return () => {
      window.removeEventListener('pointerdown', onTap, { capture: true });
      cancelAnimationFrame(raf);
      try { anim && anim.cancel(); } catch { /* ignore */ }
      setTimeout(() => { try { ctx && ctx.close(); } catch { /* ignore */ } }, 3500);
    };
  }, [fly]);

  if (hidden || !fly) return null;
  return (
    <div aria-hidden="true" className="qa-flyplane-layer">
      <div ref={boxRef} className="qa-flyplane">
        <FlyingPlaneArt width={typeof window !== 'undefined' && window.innerWidth < 820 ? 110 : 170} style={{ transform: 'scaleX(-1)', display: 'block' }} />
      </div>
    </div>
  );
}
