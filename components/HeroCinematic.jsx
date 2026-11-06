'use client';
import Icon from './Icon';
import { useEffect, useRef, useState } from 'react';

const SLIDE_MS = 7000;
const FADE_MS = 1400;

/**
 * Full-screen cinematic hero.
 * slides: [{ type: 'video'|'image', url, poster?, caption? }]
 */
export default function HeroCinematic({ slides: allSlides = [], kicker, title, subtitle, primary, secondary, lang = 'ar' }) {
  const [active, setActive] = useState(0);
  // Pause only while the browser tab is hidden (the hero fills the screen, so
  // pausing on hover would stop it for good).
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const on = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  const [reduced, setReduced] = useState(false);
  const [lite, setLite] = useState(false);
  // Videos get their source only after the page knows the screen size, so a
  // phone never starts downloading a large hero video it will not show.
  const [ready, setReady] = useState(false);
  const videoRefs = useRef([]);

  useEffect(() => {
    try { setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch {}
    // Phones, data saver and slow connections get photos instead of the video
    // (the video is several MB; on mobile data it delayed the page by ~10 s).
    try {
      const c = navigator.connection;
      if (c && (c.saveData || /(^|-)2g|3g/.test(c.effectiveType || ''))) setLite(true);
    } catch {}
    try { if (window.matchMedia('(max-width: 820px)').matches) setLite(true); } catch {}
    setReady(true);
  }, []);

  // In lite mode a video slide shows its poster photo; a video with no poster
  // is skipped, unless it is the only slide.
  const photoOnly = allSlides.filter((s) => s.type !== 'video' || s.poster);
  const slides = (lite || reduced) && photoOnly.length ? photoOnly : allSlides;
  const count = slides.length;

  // Auto-advance
  useEffect(() => {
    if (count < 2 || paused) return undefined;
    const id = setTimeout(() => setActive((a) => (a + 1) % count), SLIDE_MS);
    return () => clearTimeout(id);
  }, [active, count, paused]);

  // Only the visible video plays (saves data on phones)
  useEffect(() => {
    if (!ready) return;
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) { v.currentTime = 0; const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
    });
  }, [active, ready, lite]);

  // Keep the active index valid when the slide list shrinks (lite mode)
  useEffect(() => { if (active >= count && count) setActive(0); }, [active, count]);

  const current = slides[active] || {};
  const dir = lang === 'en' ? 'ltr' : 'rtl';

  return (
    <section className="qh" dir={dir} data-no-i18n="">
      <style>{`
.qh{position:relative;height:min(92vh,860px);min-height:520px;overflow:hidden;background:#04161f;color:#fff;isolation:isolate}
.qh-slide{position:absolute;inset:0;opacity:0;transition:opacity ${FADE_MS}ms ease;z-index:0}
.qh-slide.on{opacity:1;z-index:1}
.qh-slide img,.qh-slide video{width:100%;height:100%;object-fit:cover;display:block}
.qh-shade{position:absolute;inset:0;z-index:2;background:radial-gradient(ellipse at 50% 45%,rgba(4,22,31,.10) 0%,rgba(4,22,31,.45) 70%),linear-gradient(to bottom,rgba(4,22,31,.35) 0%,rgba(4,22,31,.05) 35%,rgba(4,22,31,.55) 100%)}
.qh-copy{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:clamp(10px,1.4vw,18px);padding:0 6%}
.qh-logo{width:clamp(60px,5.6vw,88px);height:auto;filter:drop-shadow(0 4px 12px rgba(0,0,0,.35));animation:qh-up .9s ease both}
.qh-kicker{font-size:clamp(14px,1.25vw,20px);font-weight:500;letter-spacing:.02em;opacity:.95;animation:qh-up .9s .12s ease both}
.qh-title{margin:0;font-size:clamp(38px,6.4vw,104px);font-weight:700;line-height:1.05;letter-spacing:-.01em;text-shadow:0 2px 12px rgba(0,0,0,.3);animation:qh-up 1s .22s ease both}
.qh-sub{margin:0;max-width:640px;font-size:clamp(15px,1.2vw,19px);line-height:1.8;opacity:.92;animation:qh-up 1s .34s ease both}
.qh-ctas{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:6px;animation:qh-up 1s .46s ease both}
.qh-btn{display:inline-flex;align-items:center;gap:9px;border-radius:999px;padding:clamp(11px,.9vw,15px) clamp(22px,2vw,34px);font-weight:700;font-size:clamp(14px,1vw,17px);cursor:pointer;font-family:inherit;border:0;text-decoration:none;transition:transform .2s,background .2s}
.qh-btn:hover{transform:translateY(-1px)}
.qh-btn.pri{background:#faab18;color:#012a37;box-shadow:0 6px 16px rgba(250,171,24,.28)}
.qh-btn.sec{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.45);backdrop-filter:blur(6px)}
@keyframes qh-up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
.qh-bottom{position:absolute;z-index:5;left:0;right:0;bottom:clamp(18px,3vh,34px);display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 5%}
.qh-cap{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;min-height:22px}
.qh-cap span{animation:qh-up .7s ease both}
.qh-bars{display:flex;gap:6px}
.qh-bar{width:clamp(26px,3vw,46px);height:3px;border-radius:3px;background:rgba(255,255,255,.3);overflow:hidden;cursor:pointer;border:0;padding:0}
.qh-bar i{display:block;height:100%;width:0;background:#fff}
.qh-bar.done i{width:100%}
.qh-bar.on i{animation:qh-fill ${SLIDE_MS}ms linear forwards}
.qh.paused .qh-bar.on i{animation-play-state:paused}
@keyframes qh-fill{to{width:100%}}
@media (max-width:820px){.qh{height:calc(100svh - 150px);min-height:480px;max-height:720px}.qh-bottom{flex-direction:column-reverse;align-items:center;gap:10px;bottom:16px}.qh-ctas{flex-direction:column;align-items:stretch;width:100%;max-width:320px}.qh-btn{justify-content:center}}
@media (prefers-reduced-motion:reduce){.qh-bar.on i,.qh *{animation:none!important}}
`}</style>
      {slides.map((s, i) => (
        <div key={i} className={'qh-slide' + (i === active ? ' on' : '')} aria-hidden={i !== active}>
          {s.type === 'video' && !reduced && !(lite && s.poster) ? (
            <video
              ref={(el) => { videoRefs.current[i] = el; }}
              src={ready ? s.url : undefined}
              poster={s.poster || undefined}
              muted
              loop
              playsInline
              preload={ready ? (i === 0 ? 'auto' : 'metadata') : 'none'}
              autoPlay={ready && i === 0}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i === active ? 'on' + active : 'off'} src={s.type === 'video' ? s.poster || '' : s.url} alt="" loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'} decoding={i === 0 ? 'sync' : 'async'} />
          )}
        </div>
      ))}
      <div className="qh-shade" />

      <div className="qh-copy">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="qh-logo" src="/assets/logo-mark-hero.webp" alt="قصر المرايا" />
        {kicker && <span className="qh-kicker">{kicker}</span>}
        {title && <h1 className="qh-title">{title}</h1>}
        {subtitle && <p className="qh-sub">{subtitle}</p>}
        <div className="qh-ctas">
          {primary && (
            <button type="button" className="qh-btn pri" onClick={primary.onClick}>
              {primary.label}
              <Icon name="chevron-left" size={14} strokeWidth={2.6} style={{ transform: dir === 'ltr' ? 'scaleX(-1)' : undefined }} />
            </button>
          )}
          {secondary && <a className="qh-btn sec" href={secondary.href} {...(/^https?:/.test(secondary.href || '') ? { target: '_blank', rel: 'noopener' } : {})}>{secondary.label}</a>}
        </div>
      </div>

      <div className="qh-bottom">
        <div className="qh-cap" key={active}>
          {current.caption && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Icon name="map-pin" size={15} />
              {current.caption}
            </span>
          )}
        </div>
        {count > 1 && (
          <div className="qh-bars" role="tablist">
            {slides.map((_, i) => (
              <button key={i} type="button" aria-label={String(i + 1)} className={'qh-bar' + (i === active ? ' on' : i < active ? ' done' : '')} onClick={() => setActive(i)}>
                <i key={i === active ? 'a' + active : 'x'} style={paused && i === active ? { animationPlayState: 'paused' } : undefined} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
