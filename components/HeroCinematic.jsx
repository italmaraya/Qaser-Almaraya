'use client';
import Icon from './Icon';
import { useEffect, useRef, useState } from 'react';

const SLIDE_MS = 7000;
const FADE_MS = 1400;

/**
 * Destination hero: one photograph, one copy column, two actions.
 *
 * Desktop  — the photo fills the section; the copy sits on the inline-start
 *            edge over a one-sided gradient, so the picture stays visible.
 * Mobile   — a 4:5 crop of the same photo on top, the copy below it on white,
 *            which is the only way the Arabic stays comfortably readable.
 *
 * slides: [{ type: 'video'|'image', url, poster?, caption? }]
 */
export default function HeroCinematic({ slides: allSlides = [], kicker, title, subtitle, primary, secondary, lang = 'ar' }) {
  const [active, setActive] = useState(0);
  // Pause only while the browser tab is hidden (the hero owns the first
  // screen, so pausing on hover would stop it for good).
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const on = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  const [reduced, setReduced] = useState(false);
  const [lite, setLite] = useState(false);
  // Videos get their source only once the client has mounted, so the poster
  // photo paints first and the download never blocks the first screen.
  const [ready, setReady] = useState(false);
  const videoRefs = useRef([]);

  useEffect(() => {
    try { setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch {}
    // Phones get the video too (the owner asked for it back on 6 Nov 2026).
    // Only data saver and genuinely slow connections fall back to the poster
    // photos, because the video is several megabytes.
    try {
      const c = navigator.connection;
      if (c && (c.saveData || /(^|-)2g/.test(c.effectiveType || ''))) setLite(true);
    } catch {}
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
    <section className={'qh' + (paused ? ' paused' : '')} dir={dir} data-no-i18n="">
      <style>{`
.qh{position:relative;height:min(78vh,720px);min-height:520px;overflow:hidden;background:#04161f;color:#fff;isolation:isolate}
.qh-media{position:absolute;inset:0;z-index:0;overflow:hidden;background:#04161f}
.qh-slide{position:absolute;inset:0;opacity:0;transition:opacity ${FADE_MS}ms ease;z-index:0}
.qh-slide.on{opacity:1;z-index:1}
.qh-slide img,.qh-slide video{width:100%;height:100%;object-fit:cover;object-position:50% 40%;display:block}
/* One-sided scrim: dark at the text edge, gone by 62% across, so the
   photograph is never veiled and the Arabic still clears 4.5:1. */
.qh-scrim{position:absolute;inset:0;z-index:2;background:linear-gradient(to left,rgba(4,22,31,.78) 0%,rgba(4,22,31,.62) 26%,rgba(4,22,31,.18) 48%,rgba(4,22,31,0) 62%)}
.qh[dir="ltr"] .qh-scrim{background:linear-gradient(to right,rgba(4,22,31,.78) 0%,rgba(4,22,31,.62) 26%,rgba(4,22,31,.18) 48%,rgba(4,22,31,0) 62%)}
.qh-copy{position:absolute;z-index:4;top:55%;transform:translateY(-50%);inset-inline-start:clamp(20px,5vw,72px);inset-inline-end:auto;max-width:560px;display:flex;flex-direction:column;align-items:flex-start;text-align:start;gap:var(--q-s2,16px);animation:qh-fade .45s ease both}
@keyframes qh-fade{from{opacity:0}to{opacity:1}}
.qh-eyebrow{margin:0;font-size:var(--q-t6,13px);font-weight:700;letter-spacing:.08em;color:#5bd0ef}
.qh-title{margin:0;font-size:clamp(32px,4.4vw,56px);font-weight:700;line-height:1.14;letter-spacing:-.01em}
.qh-sub{margin:0;max-width:480px;font-size:clamp(16px,1.15vw,19px);line-height:1.75;color:rgba(255,255,255,.92)}
.qh-ctas{display:flex;gap:var(--q-s1,8px);flex-wrap:wrap;margin-top:var(--q-s1,8px)}
.qh-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;border-radius:999px;border:1px solid transparent;padding:12px 26px;font-family:inherit;font-size:var(--q-t5,15px);font-weight:700;cursor:pointer;text-decoration:none;transition:background .16s ease,border-color .16s ease,color .16s ease}
.qh-btn.pri{background:var(--q-amber,#faab18);color:#2b1d00}
.qh-btn.pri:hover{background:#eb9d0c}
.qh-btn.sec{background:transparent;border-color:rgba(255,255,255,.55);color:#fff}
.qh-btn.sec:hover{border-color:#fff}
.qh-btn:focus-visible{outline:2px solid #5bd0ef;outline-offset:3px}
.qh-foot{position:absolute;z-index:5;inset-inline:0;bottom:var(--q-s3,24px);display:flex;align-items:center;justify-content:space-between;gap:var(--q-s2,16px);padding-inline:clamp(20px,5vw,72px)}
.qh-cap{display:inline-flex;align-items:center;gap:7px;font-size:var(--q-t5,15px);font-weight:600;min-height:22px}
.qh-bars{display:flex;gap:6px}
.qh-bar{width:clamp(26px,3vw,46px);height:3px;border-radius:3px;background:rgba(255,255,255,.3);overflow:hidden;cursor:pointer;border:0;padding:0}
.qh-bar i{display:block;height:100%;width:0;background:#fff}
.qh-bar.done i{width:100%}
.qh-bar.on i{animation:qh-fill ${SLIDE_MS}ms linear forwards}
.qh.paused .qh-bar.on i{animation-play-state:paused}
@keyframes qh-fill{to{width:100%}}
/* Phones get a different crop, not a squeeze: a 4:5 portrait of the photo,
   then the copy on white underneath. */
@media (max-width:820px){
  .qh{height:auto;min-height:0;max-height:none;background:#fff;color:var(--q-ink,#1d2733);overflow:visible}
  .qh-media{position:relative;inset:auto;width:100%;aspect-ratio:4/5}
  .qh-slide img,.qh-slide video{object-position:50% 30%}
  .qh-scrim,.qh[dir="ltr"] .qh-scrim{background:none}
  .qh-copy{position:static;transform:none;inset:auto;max-width:none;top:auto;padding:var(--q-s3,24px) var(--q-s2,16px) var(--q-s4,40px);gap:var(--q-s2,16px);background:#fff}
  .qh-eyebrow{color:var(--q-cyan-dark,#036f8c)}
  .qh-sub{max-width:none;color:var(--q-ink-2,#5f666e)}
  .qh-ctas{flex-direction:column;align-items:stretch;width:100%;gap:10px}
  .qh-btn{width:100%}
  .qh-btn.sec{border-color:var(--q-line,#e6e9eb);color:var(--q-ink,#1d2733)}
  .qh-btn.sec:hover{border-color:#cfd6da}
  /* Caption and bars move onto the photo's bottom edge. */
  .qh-foot{bottom:0;padding:28px var(--q-s2,16px) 12px;color:#fff;background:linear-gradient(to top,rgba(4,22,31,.62) 0%,rgba(4,22,31,0) 100%)}
}
@media (prefers-reduced-motion:reduce){
  .qh-copy{animation:none}
  .qh-slide{transition:none}
  .qh-bar.on i{animation:none;width:100%}
}
`}</style>
      <div className="qh-media">
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
              <img src={s.type === 'video' ? s.poster || '' : s.url} alt="" loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'} decoding={i === 0 ? 'sync' : 'async'} />
            )}
          </div>
        ))}
        <div className="qh-scrim" />

        <div className="qh-foot">
          <div className="qh-cap">
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
      </div>

      <div className="qh-copy">
        {kicker && <p className="qh-eyebrow">{kicker}</p>}
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
    </section>
  );
}
