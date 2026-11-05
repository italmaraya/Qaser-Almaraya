'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { activeSeason } from '../lib/seasons';

// Full-page seasonal decoration on the public site (never on /admin):
//   newyear  → pine garland with lights and swinging bells, falling snow,
//              reindeer pulling a sleigh across the sky
//   ramadan  → hanging lanterns, crescents and stars, twinkling stars
//   eid_fitr / eid_adha → bunting flags with hanging stars, falling confetti
//   summer   → sun in the corner, rising bubbles, seagulls crossing
// Shown only while the season is on (or previewed with ?season=...).
// Purely decorative: pointer-events off, hidden for print, and still
// (no motion) when the visitor prefers reduced motion.

const rnd = (a, b) => a + Math.random() * (b - a);

function Bell({ x, delay }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <g className="sd-swing" style={{ animationDelay: delay + 's' }}>
        <line x1="0" y1="0" x2="0" y2="18" stroke="#8a6a1f" strokeWidth="1.2" />
        <g transform="translate(0 32)">
          <path d="M0 -15 C -8 -15 -10 -6 -10 2 L -13 9 L 13 9 L 10 2 C 10 -6 8 -15 0 -15 Z" fill="url(#sdGold)" stroke="#a7791a" strokeWidth="0.8" />
          <circle cx="0" cy="11" r="3" fill="#a7791a" />
          <path d="M-6 -16 Q -3 -21 0 -16 Q 3 -21 6 -16 Z" fill="#d62839" />
          <path d="M-5 -1 Q 0 1 5 -1" stroke="#fff3c4" strokeWidth="1" fill="none" opacity=".7" />
        </g>
      </g>
    </g>
  );
}

function PineSwag({ w, i }) {
  const colors = ['#e0364f', '#faab18', '#34bbe1', '#11a36a'];
  const pts = [0.12, 0.3, 0.5, 0.7, 0.88].map((t, k) => {
    const x = t * w;
    const y = 6 + 4 * 22 * t * (1 - t);
    return <circle key={k} className="sd-twinkle" style={{ animationDelay: (k * 0.37 + i * 0.21) % 2 + 's' }} cx={x} cy={y + 5} r="3.6" fill={colors[(k + i) % 4]} />;
  });
  return (
    <svg width={w} height="70" viewBox={`0 0 ${w} 70`} style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}>
      <path d={`M0 4 Q ${w / 2} 50 ${w} 4`} stroke="#1f6b3a" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d={`M0 4 Q ${w / 2} 50 ${w} 4`} stroke="#2f8f4e" strokeWidth="4" strokeDasharray="2 5" fill="none" strokeLinecap="round" />
      {pts}
      <Bell x={w} delay={i * 0.4} />
      <circle cx={w} cy="4" r="5" fill="#d62839" />
    </svg>
  );
}

function Lantern({ x, len, delay, crescent }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <g className="sd-swing" style={{ animationDelay: delay + 's' }}>
        <line x1="0" y1="0" x2="0" y2={len} stroke="#c9a24a" strokeWidth="1" />
        {crescent ? (
          <g transform={`translate(0 ${len + 14})`}>
            <circle r="12" fill="url(#sdGold)" mask="url(#sdCres)" />
            <path d="M8 -3 l1.6 3.4 3.6.4 -2.7 2.5.8 3.6 -3.3-1.9 -3.3 1.9.8-3.6 -2.7-2.5 3.6-.4 Z" fill="#f5c451" />
          </g>
        ) : (
          <g transform={`translate(-12 ${len})`}>
            <circle cx="12" cy="2.5" r="2.4" fill="none" stroke="#c9a24a" strokeWidth="1.3" />
            <path d="M8 5 L16 5 L19 10 L5 10 Z" fill="url(#sdGold)" />
            <path d="M5 12 L19 12 L22 24 L19 36 L5 36 L2 24 Z" fill="url(#sdGlow)" stroke="#b8862b" strokeWidth="1.4" />
            <path d="M9 12 L9 36 M15 12 L15 36 M2 24 L22 24" stroke="#b8862b" strokeWidth="0.9" opacity=".8" />
            <path d="M6 38 L18 38 L12 46 Z" fill="url(#sdGold)" />
            <circle className="sd-twinkle" cx="12" cy="24" r="9" fill="#ffd36b" opacity=".35" />
          </g>
        )}
      </g>
    </g>
  );
}

function Bunting({ w, i, palette }) {
  const n = Math.max(3, Math.round(w / 34));
  const flags = Array.from({ length: n }, (_, k) => {
    const t0 = k / n;
    const t1 = (k + 1) / n;
    const y = (t) => 4 + 4 * 26 * t * (1 - t);
    const xa = t0 * w + 2;
    const xb = t1 * w - 2;
    const xm = (xa + xb) / 2;
    const ym = (y(t0) + y(t1)) / 2;
    return <path key={k} d={`M${xa} ${y(t0)} L${xb} ${y(t1)} L${xm} ${ym + 22} Z`} fill={palette[(k + i) % palette.length]} />;
  });
  return (
    <svg width={w} height="70" viewBox={`0 0 ${w} 70`} style={{ display: 'block', flexShrink: 0, overflow: 'visible' }}>
      <path d={`M0 4 Q ${w / 2} 56 ${w} 4`} stroke="#8a6a1f" strokeWidth="1.4" fill="none" />
      {flags}
      <g transform={`translate(${w} 0)`}>
        <g className="sd-swing" style={{ animationDelay: i * 0.3 + 's' }}>
          <line x1="0" y1="0" x2="0" y2={22 + (i % 3) * 10} stroke="#c9a24a" strokeWidth="1" />
          <path transform={`translate(0 ${34 + (i % 3) * 10}) scale(1.25)`} d="M0 -10 L2.9 -3.6 9.8 -3.1 4.6 1.4 6.2 8.2 0 4.6 -6.2 8.2 -4.6 1.4 -9.8 -3.1 -2.9 -3.6 Z" fill="url(#sdGold)" />
        </g>
      </g>
    </svg>
  );
}

function Reindeer({ x }) {
  return (
    <g transform={`translate(${x} 0)`} fill="#1b2f4a" stroke="#1b2f4a" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="30" cy="20" rx="13" ry="6" stroke="none" />
      <path d="M19 18 L13 10 L17 8 L23 16 Z" stroke="none" />
      <ellipse cx="11" cy="9" rx="5.5" ry="3.2" stroke="none" />
      <circle cx="5.8" cy="9.5" r="1.6" fill="#e0364f" stroke="none" />
      <path d="M13 6 L11 0 M12 3 L8 1 M14 6 L17 0 M16 3 L19 1" strokeWidth="1.6" fill="none" />
      <path d="M21 23 L13 29 M24 24 L17 32 M38 23 L49 27 M36 24 L46 31" strokeWidth="2.4" fill="none" />
      <path d="M43 17 L47 14" strokeWidth="2" fill="none" />
    </g>
  );
}

function Sleigh() {
  return (
    <svg width="330" height="70" viewBox="0 0 330 70" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="sdTrail" x1="1" x2="0"><stop offset="0" stopColor="#f5c451" stopOpacity=".9" /><stop offset="1" stopColor="#f5c451" stopOpacity="0" /></linearGradient>
      </defs>
      <path d="M270 52 Q 300 46 330 52" stroke="url(#sdTrail)" strokeWidth="3" fill="none" strokeDasharray="1 6" strokeLinecap="round" />
      <path d="M58 22 L 214 42" stroke="#8a6a1f" strokeWidth="1" />
      <g transform="translate(0 10)"><Reindeer x={0} /><Reindeer x={56} /><Reindeer x={112} /></g>
      <g transform="translate(206 20)">
        <path d="M2 32 Q 0 40 10 40 L 58 40 Q 66 40 66 32" stroke="#c9a24a" strokeWidth="2.5" fill="none" />
        <path d="M8 32 L 12 12 L 44 12 Q 54 12 56 22 L 58 32 Z" fill="#c0262f" stroke="#8d1a22" strokeWidth="1" />
        <path d="M12 16 L 50 16" stroke="#f5c451" strokeWidth="1.5" />
        <rect x="18" y="0" width="13" height="12" rx="1.5" fill="#11a36a" />
        <rect x="23.5" y="0" width="2" height="12" fill="#f5c451" />
        <rect x="33" y="3" width="11" height="9" rx="1.5" fill="#34bbe1" />
        <rect x="37.5" y="3" width="2" height="9" fill="#fff" />
      </g>
    </svg>
  );
}

function Seagulls() {
  return (
    <svg width="120" height="40" viewBox="0 0 120 40" style={{ display: 'block' }}>
      {[[0, 14, 1], [38, 4, 0.8], [70, 20, 0.9]].map(([x, y, s], k) => (
        <path key={k} transform={`translate(${x} ${y}) scale(${s})`} d="M0 8 Q 8 0 16 8 Q 24 0 32 8" stroke="#1d2733" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".7" />
      ))}
    </svg>
  );
}

const SNOW = 'M0 -6 L0 6 M-5.2 -3 L5.2 3 M-5.2 3 L5.2 -3 M0 -6 L-1.5 -4.5 M0 -6 L1.5 -4.5 M0 6 L-1.5 4.5 M0 6 L1.5 4.5';

function Particle({ kind, p }) {
  if (kind === 'snow') {
    return (
      <svg className="sd-fall" width={p.size} height={p.size} viewBox="-7 -7 14 14" style={{ left: p.x + 'vw', animationDuration: p.d + 's', animationDelay: p.delay + 's', '--sd-drift': p.drift + 'px', opacity: p.o }}>
        <path d={SNOW} stroke="#5ab3d6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle r="1.2" fill="#fff" />
      </svg>
    );
  }
  if (kind === 'confetti') {
    return <span className="sd-fall sd-conf" style={{ left: p.x + 'vw', width: p.size * 0.5, height: p.size, background: p.color, animationDuration: p.d + 's', animationDelay: p.delay + 's', '--sd-drift': p.drift + 'px', borderRadius: 2 }} />;
  }
  if (kind === 'bubble') {
    return <span className="sd-rise" style={{ left: p.x + 'vw', width: p.size * 1.6, height: p.size * 1.6, animationDuration: p.d * 1.3 + 's', animationDelay: p.delay + 's', '--sd-drift': p.drift + 'px' }} />;
  }
  // twinkling stars (Ramadan)
  return (
    <svg className="sd-star" width={p.size} height={p.size} viewBox="-10 -10 20 20" style={{ left: p.x + 'vw', top: p.y + 'vh', animationDuration: p.d / 4 + 's', animationDelay: p.delay / 4 + 's' }}>
      <path d="M0 -10 Q 1.5 -1.5 10 0 Q 1.5 1.5 0 10 Q -1.5 1.5 -10 0 Q -1.5 -1.5 0 -10 Z" fill="#f5c451" />
    </svg>
  );
}

const KIND = { newyear: 'snow', ramadan: 'star', eid_fitr: 'confetti', eid_adha: 'confetti', summer: 'bubble' };
const CONFETTI = ['#faab18', '#e0364f', '#34bbe1', '#11a36a', '#9b5de5', '#f5c451'];

const CSS = `
.sd-top{position:absolute;left:0;right:0;height:96px;overflow:hidden;pointer-events:none;z-index:39}
.sd-row{display:flex;align-items:flex-start;width:max-content}
.sd-layer{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:35}
.sd-fall{position:absolute;top:-24px;animation-name:sd-fall;animation-timing-function:linear;animation-iteration-count:infinite;will-change:transform}
.sd-conf{display:block;animation-name:sd-fall-spin}
.sd-rise{position:absolute;bottom:-30px;border-radius:50%;border:1.5px solid rgba(52,187,225,.55);background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.9),rgba(180,230,246,.25) 60%,transparent 70%);animation:sd-rise linear infinite;will-change:transform}
.sd-star{position:absolute;animation:sd-tw ease-in-out infinite alternate}
.sd-swing{transform-box:fill-box;transform-origin:50% 0;animation:sd-swing 3.2s ease-in-out infinite alternate}
.sd-twinkle{transform-box:fill-box;transform-origin:center;animation:sd-tw 1.4s ease-in-out infinite alternate}
.sd-sun-rays{transform-box:view-box}
.sd-fly{position:absolute;top:var(--sd-fly-top,14vh);right:-480px;animation:sd-fly 26s linear infinite;will-change:transform}
.sd-fly svg{width:450px;height:auto}
.sd-fly>*{animation:sd-bob 2.6s ease-in-out infinite alternate}
.sd-gulls{position:absolute;top:22vh;left:-140px;animation:sd-gulls 30s linear infinite}
.sd-sun{position:absolute;top:8px;left:18px;width:120px;height:120px;pointer-events:none;z-index:39}
.sd-sun-rays{transform-origin:60px 60px;animation:sd-spin 40s linear infinite}
@keyframes sd-fall{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(var(--sd-drift,0),105vh,0)}}
@keyframes sd-fall-spin{0%{transform:translate3d(0,0,0) rotate(0)}100%{transform:translate3d(var(--sd-drift,0),105vh,0) rotate(720deg)}}
@keyframes sd-rise{0%{transform:translate3d(0,0,0);opacity:0}10%{opacity:1}100%{transform:translate3d(var(--sd-drift,0),-110vh,0);opacity:.2}}
@keyframes sd-tw{0%{opacity:.25;transform:scale(.7)}100%{opacity:1;transform:scale(1.1)}}
@keyframes sd-swing{0%{transform:rotate(-7deg)}100%{transform:rotate(7deg)}}
@keyframes sd-fly{0%{transform:translateX(0)}55%{transform:translateX(calc(-100vw - 560px))}100%{transform:translateX(calc(-100vw - 560px))}}
@keyframes sd-bob{0%{transform:translateY(-6px)}100%{transform:translateY(6px)}}
@keyframes sd-gulls{0%{transform:translateX(0)}60%{transform:translateX(calc(100vw + 160px))}100%{transform:translateX(calc(100vw + 160px))}}
@keyframes sd-spin{to{transform:rotate(360deg)}}
@media (max-width:820px){.sd-top{height:80px}.sd-fly{--sd-fly-top:18vh}.sd-fly svg{width:270px;height:auto}.sd-sun{width:84px;height:84px;top:4px;left:8px}}
@media (prefers-reduced-motion:reduce){.sd-layer{display:none}.sd-swing,.sd-twinkle,.sd-sun-rays{animation:none}}
@media print{.sd-top,.sd-layer,.sd-sun{display:none!important}}
`;

export default function SeasonDecor() {
  const [state, setState] = useState(null);

  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) return undefined;
    const a = activeSeason();
    if (!a || a.soon) return undefined;
    const id = a.season.id;
    const mobile = window.innerWidth < 821;
    const n = mobile ? 22 : 42;
    const parts = Array.from({ length: n }, () => ({
      x: rnd(0, 100), y: rnd(8, 92), d: rnd(9, 18), delay: -rnd(0, 18), size: rnd(11, 24), drift: rnd(-40, 40), o: rnd(0.55, 0.95),
      color: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
    }));
    const measure = () => {
      const h = document.querySelector('header');
      const top = h ? Math.round(h.getBoundingClientRect().bottom + window.scrollY) : 64;
      setState({ id, parts, top, width: window.innerWidth, mobile: window.innerWidth < 821 });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  if (!state) return null;
  const { id, parts, top, width, mobile } = state;
  const swag = mobile ? 130 : 200;
  const count = Math.ceil(width / swag) + 1;
  const kind = KIND[id];

  const defs = (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="sdGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe08a" /><stop offset=".5" stopColor="#f5c451" /><stop offset="1" stopColor="#c9962b" /></linearGradient>
        <mask id="sdCres" maskUnits="userSpaceOnUse" x="-14" y="-14" width="28" height="28"><circle r="12" fill="#fff" /><circle cx="6" cy="-3" r="10" fill="#000" /></mask>
        <radialGradient id="sdGlow"><stop offset="0" stopColor="#fff2c2" /><stop offset=".6" stopColor="#ffc94d" /><stop offset="1" stopColor="#f08c1a" /></radialGradient>
      </defs>
    </svg>
  );

  let topRow = null;
  if (id === 'newyear') {
    topRow = <div className="sd-row">{Array.from({ length: count }, (_, i) => <PineSwag key={i} w={swag} i={i} />)}</div>;
  } else if (id === 'ramadan') {
    const step = mobile ? 54 : 70;
    const m = Math.ceil(width / step) + 1;
    topRow = (
      <svg width={m * step} height="96" style={{ display: 'block', overflow: 'visible' }}>
        <path d={`M0 2 ${Array.from({ length: m }, (_, i) => `Q ${i * step + step / 2} 14 ${(i + 1) * step} 2`).join(' ')}`} stroke="#c9a24a" strokeWidth="1.2" fill="none" />
        {Array.from({ length: m }, (_, i) => <Lantern key={i} x={i * step + step / 2} len={[14, 30, 20, 38][i % 4]} delay={(i % 5) * 0.45} crescent={i % 3 === 1} />)}
      </svg>
    );
  } else if (id === 'eid_fitr' || id === 'eid_adha') {
    const palette = id === 'eid_adha' ? ['#12806a', '#f5c451', '#2fa58a', '#ffffff', '#0b5d4b'] : ['#049dc5', '#faab18', '#e0364f', '#34bbe1', '#9b5de5'];
    topRow = <div className="sd-row">{Array.from({ length: count }, (_, i) => <Bunting key={i} w={swag} i={i} palette={palette} />)}</div>;
  }

  return createPortal(
    <div aria-hidden="true" data-season-decor={id}>
      <style>{CSS}</style>
      {defs}
      {topRow && <div className="sd-top" style={{ top }}>{topRow}</div>}
      {id === 'summer' && (
        <svg className="sd-sun" viewBox="0 0 120 120" style={{ top: top + 8 }}>
          <g className="sd-sun-rays">
            {Array.from({ length: 12 }, (_, k) => <rect key={k} x="57" y="2" width="6" height="20" rx="3" fill="#faab18" opacity=".85" transform={`rotate(${k * 30} 60 60)`} />)}
          </g>
          <circle cx="60" cy="60" r="28" fill="#ffc94d" stroke="#faab18" strokeWidth="3" />
          <path d="M48 64 Q 60 74 72 64" stroke="#8a5a00" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="51" cy="55" r="3" fill="#8a5a00" /><circle cx="69" cy="55" r="3" fill="#8a5a00" />
        </svg>
      )}
      <div className="sd-layer">
        {parts.map((p, i) => <Particle key={i} kind={kind} p={p} />)}
        {id === 'newyear' && <div className="sd-fly"><Sleigh /></div>}
        {id === 'summer' && <div className="sd-gulls"><Seagulls /></div>}
      </div>
    </div>,
    document.body,
  );
}
