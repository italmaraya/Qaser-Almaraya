'use client';

import { useEffect } from 'react';

// A short airport-style "ding-dong", made in the browser with Web Audio
// (no sound file, no licence). It plays only after a click — when a visitor
// taps a WhatsApp booking button or opens the Skylo chat — never on page load.
let ctx = null;
let lastAt = 0;

function tone(ac, freq, start, dur, peak) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  g.connect(ac.destination);
  // Bell colour: the note plus two soft overtones.
  [[1, 1], [2.01, 0.28], [3.02, 0.1]].forEach(([mult, amp]) => {
    const o = ac.createOscillator();
    const og = ac.createGain();
    o.type = 'sine';
    o.frequency.value = freq * mult;
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(start);
    o.stop(start + dur + 0.05);
  });
}

export function playChime() {
  try {
    const now = Date.now();
    if (now - lastAt < 4000) return; // once per tap burst
    lastAt = now;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime + 0.02;
    tone(ctx, 659.25, t, 1.1, 0.16); // E5 — "ding"
    tone(ctx, 523.25, t + 0.42, 1.5, 0.14); // C5 — "dong"
  } catch {
    /* sound is a nice-to-have; never break a click */
  }
}

const TRIGGERS = 'a[href*="wa.me/"],a[href*="api.whatsapp.com"],[data-chime],#zsiq_float,.qa-chat-label';

export default function AirportChime() {
  useEffect(() => {
    window.qaChime = playChime;
    const onClick = (e) => {
      const el = e.target && e.target.closest ? e.target.closest(TRIGGERS) : null;
      if (!el) return;
      // Sharing an article on WhatsApp is not a booking — stay quiet there.
      if (el.matches('a[href^="https://wa.me/?"]')) return;
      playChime();
    };
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      if (window.qaChime === playChime) delete window.qaChime;
    };
  }, []);
  return null;
}
