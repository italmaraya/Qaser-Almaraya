'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { activeSeason } from '../lib/seasons';

// Full-page seasonal decoration on the public site (never on /admin):
//   newyear  → string of hanging bells, stars and gifts, falling snowflakes,
//              reindeer pulling a sled across the sky
//   ramadan  → hanging crescents and stars, stars that glow once and fade
//   eid_fitr / eid_adha → hanging stars and confetti balls, falling confetti
// Artwork: Microsoft Fluent Emoji, Flat style (MIT, public/decor/CREDITS.txt).
// Shown only while the season is on (or previewed with ?season=...).
// Purely decorative: pointer-events off, hidden for print, and still
// (no motion) when the visitor prefers reduced motion.
//
// Light background music per season (public/audio/season-*.mp3). Browsers
// do not allow sound before the visitor's first tap/click/key, so it starts
// then, softly, and a small round button turns it off/on (remembered).

const rnd = (a, b) => a + Math.random() * (b - a);
const art = (name) => '/decor/' + name + '.svg';

// What hangs from the string at the top of the page, in turn.
const HANG = {
  newyear: ['bell', 'glowing_star', 'wrapped_gift', 'bell', 'star'],
  ramadan: ['crescent_moon', 'glowing_star', 'star', 'crescent_moon', 'glowing_star'],
  eid_fitr: ['glowing_star', 'confetti_ball', 'star', 'party_popper'],
  eid_adha: ['glowing_star', 'confetti_ball', 'star', 'party_popper'],
};
const CORD = [8, 24, 14, 32, 18];

function Garland({ id, width, mobile }) {
  const step = mobile ? 56 : 78;
  const size = mobile ? 24 : 32;
  const n = Math.ceil(width / step) + 1;
  const items = HANG[id] || [];
  return (
    <div className="sd-row">
      {Array.from({ length: n }, (_, i) => {
        const cord = CORD[i % CORD.length];
        return (
          <div key={i} className="sd-seg" style={{ width: step }}>
            <svg className="sd-string" width={step} height="14" viewBox={`0 0 ${step} 14`}>
              <path d={`M0 1 Q ${step / 2} 14 ${step} 1`} stroke="#c9a24a" strokeWidth="1.2" fill="none" />
            </svg>
            <div className="sd-hang" style={{ marginLeft: -size / 2, width: size, animationDelay: (i % 5) * 0.45 + 's' }}>
              <span className="sd-cord" style={{ height: cord }} />
              <img src={art(items[i % items.length])} width={size} height={size} alt="" draggable="false" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Particle({ kind, p }) {
  if (kind === 'snow') {
    return <img className="sd-fall" src={art('snowflake')} width={p.size} height={p.size} alt="" style={{ left: p.x + 'vw', animationDuration: p.d + 's', animationDelay: p.delay + 's', '--sd-drift': p.drift + 'px', opacity: p.o }} />;
  }
  if (kind === 'confetti') {
    return <span className="sd-fall sd-conf" style={{ left: p.x + 'vw', width: p.size * 0.5, height: p.size, background: p.color, animationDuration: p.d + 's', animationDelay: p.delay + 's', '--sd-drift': p.drift + 'px', borderRadius: 2 }} />;
  }
  // Ramadan stars: each one fades in once, glows, then disappears for good.
  return <img className="sd-star" src={art('glowing_star')} width={p.size} height={p.size} alt="" style={{ left: p.x + 'vw', top: p.y + 'vh', animationDuration: 2.4 + p.d / 6 + 's', animationDelay: Math.abs(p.delay) / 4.5 + 's' }} />;
}

function Sleigh({ mobile }) {
  const d = mobile ? 40 : 60;
  return (
    <div className="sd-team">
      <img src={art('deer')} width={d} height={d} alt="" />
      <img src={art('deer')} width={d} height={d} alt="" />
      <img src={art('sled')} width={d * 1.1} height={d * 1.1} alt="" />
      <img className="sd-trail" src={art('sparkles')} width={d * 0.5} height={d * 0.5} alt="" />
    </div>
  );
}

const KIND = { newyear: 'snow', ramadan: 'star', eid_fitr: 'confetti', eid_adha: 'confetti' };
const CONFETTI = ['#faab18', '#e0364f', '#34bbe1', '#11a36a', '#9b5de5', '#f5c451'];

const CSS = `
.sd-top{position:absolute;left:0;right:0;height:96px;overflow:hidden;pointer-events:none;z-index:39}
.sd-row{display:flex;align-items:flex-start;width:max-content}
.sd-seg{position:relative;flex:none;height:96px}
.sd-string{position:absolute;top:0;left:0;display:block;overflow:visible}
.sd-hang{position:absolute;top:7px;left:50%;display:flex;flex-direction:column;align-items:center;transform-origin:50% 0;animation:sd-swing 3.2s ease-in-out infinite alternate}
.sd-cord{display:block;width:1px;background:#c9a24a}
.sd-hang img,.sd-team img,.sd-layer img{display:block;user-select:none;-webkit-user-drag:none}
.sd-hang img{filter:drop-shadow(0 3px 4px rgba(1,42,55,.18))}
.sd-layer{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:35}
.sd-fall{position:absolute;top:-30px;animation-name:sd-fall;animation-timing-function:linear;animation-iteration-count:infinite;will-change:transform}
.sd-conf{display:block;animation-name:sd-fall-spin}
.sd-star{position:absolute;opacity:0;animation:sd-once ease-in-out 1 both}
.sd-fly{position:absolute;top:var(--sd-fly-top,14vh);right:-280px;animation:sd-fly 26s linear infinite;will-change:transform}
.sd-team{direction:ltr;display:flex;align-items:flex-end;gap:2px;animation:sd-bob 2.6s ease-in-out infinite alternate;filter:drop-shadow(0 6px 8px rgba(1,42,55,.18))}
.sd-trail{align-self:center;margin-inline-start:4px;opacity:.85}
@keyframes sd-fall{0%{transform:translate3d(0,0,0)}100%{transform:translate3d(var(--sd-drift,0),105vh,0)}}
@keyframes sd-fall-spin{0%{transform:translate3d(0,0,0) rotate(0)}100%{transform:translate3d(var(--sd-drift,0),105vh,0) rotate(720deg)}}
@keyframes sd-once{0%{opacity:0;transform:scale(.4)}30%{opacity:1;transform:scale(1.15)}65%{opacity:.9;transform:scale(1)}100%{opacity:0;transform:scale(.5)}}
@keyframes sd-swing{0%{transform:rotate(-7deg)}100%{transform:rotate(7deg)}}
@keyframes sd-fly{0%{transform:translateX(0)}55%{transform:translateX(calc(-100vw - 320px))}100%{transform:translateX(calc(-100vw - 320px))}}
@keyframes sd-bob{0%{transform:translateY(-6px)}100%{transform:translateY(6px)}}
@media (max-width:820px){.sd-top,.sd-seg{height:80px}.sd-fly{--sd-fly-top:18vh}}
@media (prefers-reduced-motion:reduce){.sd-layer{display:none}.sd-hang{animation:none}}
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
    const n = mobile ? 20 : 36;
    const parts = Array.from({ length: n }, () => ({
      x: rnd(0, 100), y: rnd(8, 92), d: rnd(9, 18), delay: -rnd(0, 18), size: rnd(14, 28), drift: rnd(-40, 40), o: rnd(0.6, 0.95),
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
  const kind = KIND[id];

  return createPortal(
    <>
      <div aria-hidden="true" data-season-decor={id}>
        <style>{CSS}</style>
        {HANG[id] && <div className="sd-top" style={{ top }}><Garland id={id} width={width} mobile={mobile} /></div>}
        <div className="sd-layer">
          {parts.map((p, i) => <Particle key={i} kind={kind} p={p} />)}
          {id === 'newyear' && <div className="sd-fly"><Sleigh mobile={mobile} /></div>}
        </div>
      </div>
      {MUSIC[id] && <div style={{ '--sd-head': head + 'px' }}><MusicButton id={id} /></div>}
    </>,
    document.body,
  );
}
