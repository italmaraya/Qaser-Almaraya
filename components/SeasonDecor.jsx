'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { activeSeason } from '../lib/seasons';

// Full-page seasonal decoration on the public site (never on /admin):
//   newyear  → pine garland with lights and swinging bells, falling snow,
//              reindeer pulling a sleigh across the sky
//   ramadan  → hanging lanterns and crescents, stars that glow once and fade
//   eid_fitr / eid_adha → bunting flags with hanging stars, falling confetti
// Shown only while the season is on (or previewed with ?season=...).
// Purely decorative: pointer-events off, hidden for print, and still
// (no motion) when the visitor prefers reduced motion.
//
// Light background music per season (public/audio/season-*.mp3). Browsers
// do not allow sound before the visitor's first tap/click/key, so it starts
// then, softly, and a small round button turns it off/on (remembered).

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
  // Ramadan stars: each one fades in once, glows, then disappears for good.
  return (
    <svg className="sd-star" width={p.size} height={p.size} viewBox="-10 -10 20 20" style={{ left: p.x + 'vw', top: p.y + 'vh', animationDuration: 2.4 + p.d / 6 + 's', animationDelay: Math.abs(p.delay) / 4.5 + 's' }}>
      <path d="M0 -10 Q 1.5 -1.5 10 0 Q 1.5 1.5 0 10 Q -1.5 1.5 -10 0 Q -1.5 -1.5 0 -10 Z" fill="#f5c451" />
    </svg>
  );
}

const KIND = { newyear: 'snow', ramadan: 'star', eid_fitr: 'confetti', eid_adha: 'confetti' };
const CONFETTI = ['#faab18', '#e0364f', '#34bbe1', '#11a36a', '#9b5de5', '#f5c451'];

const CSS = `
.sd-top{position:absolute;left:0;right:0;height:96px;overflow:hidden;pointer-events:none;z-index:39}
.sd-row{display:flex;align-items:flex-start;width:max-content}
.sd-layer{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:35}
.sd-fall{position:absolute;top:-24px;animation-name:sd-fall;animation-timing-function:linear;animation-iteration-count:infinite;will-change:transform}
.sd-conf{display:block;animation-name:sd-fall-spin}
.sd-star{position:absolute;opacity:0;animation:sd-once ease-in-out 1 both}
.sd-swing{transform-box:fill-box;transform-origin:50% 0;animation:sd-swing 3.2s ease-in-out infinite alternate}
.sd-twinkle{transform-box:fill-box;transform-origin:center;animation:sd-tw 1.4s ease-in-out infinite alternate}
.sd-fly{position:absolute;top:var(--sd-fly-top,14vh);right:-480px;animation:sd-fly 26s linear infinite;will-change:transform}
.sd-fly svg{width:450px;height:auto}
.sd-fly>*{animation:sd-bob 2.6s ease-in-out infinite alternate}
@keyframes sd-fall{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(var(--sd-drift,0),105vh,0)}}
@keyframes sd-fall-spin{0%{transform:translate3d(0,0,0) rotate(0)}100%{transform:translate3d(var(--sd-drift,0),105vh,0) rotate(720deg)}}
@keyframes sd-once{0%{opacity:0;transform:scale(.4)}30%{opacity:1;transform:scale(1.15)}65%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(.5)}}
@keyframes sd-tw{0%{opacity:.25;transform:scale(.7)}100%{opacity:1;transform:scale(1.1)}}
@keyframes sd-swing{0%{transform:rotate(-7deg)}100%{transform:rotate(7deg)}}
@keyframes sd-fly{0%{transform:translateX(0)}55%{transform:translateX(calc(-100vw - 560px))}100%{transform:translateX(calc(-100vw - 560px))}}
@keyframes sd-bob{0%{transform:translateY(-6px)}100%{transform:translateY(6px)}}
@media (max-width:820px){.sd-top{height:80px}.sd-fly{--sd-fly-top:18vh}.sd-fly svg{width:270px;height:auto}}
@media (prefers-reduced-motion:reduce){.sd-layer{display:none}.sd-swing,.sd-twinkle{animation:none}}
.sd-music{position:fixed;left:18px;bottom:18px;z-index:880;width:46px;height:46px;border-radius:50%;border:1px solid rgba(4,157,197,.25);background:#fff;color:#049dc5;box-shadow:0 8px 22px rgba(1,42,55,.18);display:grid;place-items:center;cursor:pointer;padding:0;font-family:inherit}
.sd-music:hover{transform:scale(1.06)}
.sd-music.on{background:#049dc5;color:#fff;border-color:#049dc5}
.sd-eq{position:absolute;right:-3px;top:-3px;display:flex;gap:1.5px;align-items:flex-end;height:12px;padding:2px 3px;border-radius:6px;background:#faab18}
.sd-eq i{display:block;width:2px;background:#fff;border-radius:1px;animation:sd-eq .9s ease-in-out infinite alternate}
.sd-eq i:nth-child(2){animation-delay:.3s}.sd-eq i:nth-child(3){animation-delay:.6s}
@keyframes sd-eq{0%{height:2px}100%{height:8px}}
@media (max-width:820px){.sd-music{left:10px;bottom:auto;top:calc(var(--sd-head,60px) + 10px);width:40px;height:40px}}
@media print{.sd-top,.sd-layer,.sd-music{display:none!important}}
`;

// ── Background music ─────────────────────────────────────────────────────
const MUSIC = { newyear: '/audio/season-newyear.mp3', ramadan: '/audio/season-ramadan.mp3', eid_fitr: '/audio/season-eid.mp3', eid_adha: '/audio/season-eid.mp3' };
const MUSIC_KEY = 'qa_season_music'; // 'off' once the visitor turns it off
const VOLUME = 0.22;
let player = null; // one shared player, kept across client-side page changes
let users = 0; // how many SeasonDecor instances are mounted

function readPref() {
  try { return localStorage.getItem(MUSIC_KEY); } catch { return null; }
}
function writePref(v) {
  try { localStorage.setItem(MUSIC_KEY, v); } catch { /* storage blocked */ }
}

function fade(a, to, ms, done) {
  const from = a.volume;
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    try { a.volume = from + (to - from) * k; } catch { /* iOS: volume is read-only */ }
    if (k < 1) requestAnimationFrame(step);
    else if (done) done();
  };
  requestAnimationFrame(step);
}

function startMusic(src) {
  if (!player || !player.src.endsWith(src)) {
    if (player) player.pause();
    player = new Audio(src);
    player.loop = true;
    player.preload = 'auto';
  }
  if (!player.paused) return Promise.resolve(true);
  try { player.volume = 0; } catch { /* iOS */ }
  return player.play().then(() => { fade(player, VOLUME, 1500); return true; }).catch(() => false);
}

function stopMusic() {
  if (!player || player.paused) return;
  const a = player;
  fade(a, 0, 500, () => a.pause());
}

function MusicButton({ id }) {
  const src = MUSIC[id];
  const [on, setOn] = useState(false);

  useEffect(() => {
    users += 1;
    let alive = true;
    if (player && !player.paused && player.src.endsWith(src)) setOn(true);
    const first = (e) => {
      if (e && e.target && e.target.closest && e.target.closest('.sd-music')) return;
      if (readPref() === 'off') { cleanup(); return; }
      // A touch that ends a scroll is not a "real" tap for the browser, so
      // play() can be refused: keep listening until it works.
      startMusic(src).then((ok) => { if (ok) cleanup(); if (alive && ok) setOn(true); });
    };
    const evs = ['pointerup', 'keydown', 'touchend', 'click'];
    const cleanup = () => evs.forEach((ev) => window.removeEventListener(ev, first, true));
    if (!(player && !player.paused) && readPref() !== 'off') evs.forEach((ev) => window.addEventListener(ev, first, true));
    return () => {
      alive = false;
      cleanup();
      users -= 1;
      // Leaving the public site (e.g. to /admin): stop. Moving between
      // public pages: the next page mounts again and the music carries on.
      setTimeout(() => { if (users === 0) stopMusic(); }, 400);
    };
  }, [src]);

  const toggle = () => {
    if (on) {
      writePref('off');
      stopMusic();
      setOn(false);
    } else {
      writePref('on');
      startMusic(src).then(setOn);
    }
  };

  return (
    <button type="button" className={'sd-music' + (on ? ' on' : '')} onClick={toggle} aria-pressed={on} aria-label={on ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'} title={on ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى'}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 18V5l11-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="17" cy="16" r="3" />
        {!on && <path d="M3 3l18 18" />}
      </svg>
      {on && <span className="sd-eq" aria-hidden="true"><i /><i /><i /></span>}
    </button>
  );
}

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
      const head = h ? Math.round(h.getBoundingClientRect().height) : 60;
      setState({ id, parts, top, head, width: window.innerWidth, mobile: window.innerWidth < 821 });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  if (!state) return null;
  const { id, parts, top, head, width, mobile } = state;
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
    <>
      <div aria-hidden="true" data-season-decor={id}>
        <style>{CSS}</style>
        {defs}
        {topRow && <div className="sd-top" style={{ top }}>{topRow}</div>}
        <div className="sd-layer">
          {parts.map((p, i) => <Particle key={i} kind={kind} p={p} />)}
          {id === 'newyear' && <div className="sd-fly"><Sleigh /></div>}
        </div>
      </div>
      {MUSIC[id] && <div style={{ '--sd-head': head + 'px' }}><MusicButton id={id} /></div>}
    </>,
    document.body,
  );
}
