'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { activeSeason } from '../lib/seasons';
import Icon from './Icon';

// Seasonal background music on the public site (never on /admin), with a
// small round button to turn it off/on (remembered). The hanging garlands,
// falling particles and the sleigh were removed on 6 Nov 2026: the site keeps
// only purposeful motion (transitions, state changes, loading), no looping
// decoration.
//
// Browsers do not allow sound before the visitor's first tap/click/key, so the
// music starts then, softly.

const CSS = `
.sd-music{position:fixed;left:18px;bottom:18px;z-index:880;width:46px;height:46px;border-radius:50%;border:1px solid rgba(4,157,197,.25);background:#fff;color:#049dc5;box-shadow:var(--tw-pop-shadow,0 6px 20px rgba(1,42,55,.10));display:grid;place-items:center;cursor:pointer;padding:0;font-family:inherit;transition:transform .15s ease,background .15s ease}
.sd-music:hover{transform:scale(1.06)}
.sd-music.on{background:#049dc5;color:#fff;border-color:#049dc5}
@media (max-width:820px){.sd-music{left:10px;bottom:auto;top:calc(var(--sd-head,60px) + 10px);width:40px;height:40px}}
@media print{.sd-music{display:none!important}}
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
      <Icon name={on ? 'volume-2' : 'volume-x'} size={20} />
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
    if (!MUSIC[id]) return undefined;
    const measure = () => {
      const h = document.querySelector('header');
      const head = h ? Math.round(h.getBoundingClientRect().height) : 60;
      setState({ id, head });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  if (!state) return null;
  const { id, head } = state;

  return createPortal(
    <div data-season-music={id} style={{ '--sd-head': head + 'px' }}>
      <style>{CSS}</style>
      <MusicButton id={id} />
    </div>,
    document.body,
  );
}
