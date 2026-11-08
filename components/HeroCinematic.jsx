'use client';
import { imgProps } from '../lib/img';
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
// The last word of the headline carries the amber accent ("رحلتك تبدأ معنا").
function Title({ text }) {
  const t = String(text || '').trim();
  const cut = t.lastIndexOf(' ');
  if (cut < 1) return <span className="qh-accent">{t}</span>;
  return <>{t.slice(0, cut)} <span className="qh-accent">{t.slice(cut + 1)}</span></>;
}

export default function HeroCinematic({ slides: allSlides = [], kicker, title, subtitle, primary, secondary, live = [], liveTitle, lang = 'ar' }) {
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
  // Intrinsic width/height of each video slide, read from its own metadata.
  // On phones the media box takes the active video's ratio instead of the
  // 4:5 photo crop, so a cartoon frame is never cut in half.
  const [vidRatios, setVidRatios] = useState({});
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
  // Phones: a video keeps its own shape (within sane bounds); a photograph
  // keeps the deliberate 4:5 portrait crop.
  const showingVideo = current.type === 'video' && !reduced && !(lite && current.poster);
  const r = showingVideo ? vidRatios[active] : null;
  const mobileRatio = r ? `${Math.min(Math.max(r, 0.62), 1.78)}` : '0.8';

  return (
    <section className={'qh' + (paused ? ' paused' : '')} dir={dir} data-no-i18n="">
      <style>{`
.qh{position:relative;height:min(84vh,780px);min-height:560px;overflow:hidden;background:#0d141c;color:#fff;isolation:isolate}
.qh-media{position:absolute;inset:0;z-index:0;overflow:hidden;background:#0d141c}
.qh-slide{position:absolute;inset:0;opacity:0;transition:opacity ${FADE_MS}ms ease;z-index:0}
.qh-slide.on{opacity:1;z-index:1}
.qh-slide img,.qh-slide video{width:100%;height:100%;object-fit:cover;object-position:50% 40%;display:block}
.qh-slide.on img{animation:qh-zoom ${SLIDE_MS + FADE_MS}ms ease-out both}
@keyframes qh-zoom{from{transform:scale(1.08)}to{transform:scale(1)}}
/* Cinematic scrim: dark at the text edge and along the bottom, clear across
   the middle of the photograph. Charcoal, not teal (brand rule). */
.qh-scrim{position:absolute;inset:0;z-index:2;background:linear-gradient(to top,rgba(13,20,28,.72) 0%,rgba(13,20,28,0) 38%),linear-gradient(to left,rgba(13,20,28,.82) 0%,rgba(13,20,28,.6) 30%,rgba(13,20,28,.12) 56%,rgba(13,20,28,0) 70%)}
.qh[dir="ltr"] .qh-scrim{background:linear-gradient(to top,rgba(13,20,28,.72) 0%,rgba(13,20,28,0) 38%),linear-gradient(to right,rgba(13,20,28,.82) 0%,rgba(13,20,28,.6) 30%,rgba(13,20,28,.12) 56%,rgba(13,20,28,0) 70%)}
.qh-copy{position:absolute;z-index:4;top:50%;transform:translateY(-50%);inset-inline-start:clamp(20px,5vw,72px);inset-inline-end:auto;max-width:640px;display:flex;flex-direction:column;align-items:flex-start;text-align:start;gap:18px}
.qh-copy>*{animation:qh-rise .8s cubic-bezier(.2,.7,.2,1) both}
.qh-copy>:nth-child(2){animation-delay:.08s}.qh-copy>:nth-child(3){animation-delay:.16s}.qh-copy>:nth-child(4){animation-delay:.24s}
@keyframes qh-rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.qh-eyebrow{margin:0;display:inline-flex;align-items:center;gap:10px;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);font-size:14px;font-weight:600;color:#fff}
.qh-eyebrow::before{content:"";width:8px;height:8px;border-radius:50%;background:#faab18}
html[data-area] .qh .qh-title{margin:0;color:#fff;font-family:var(--qs-sans,inherit)!important;font-size:clamp(40px,5.4vw,76px)!important;font-weight:700!important;line-height:1.16!important;text-shadow:0 2px 16px rgba(0,0,0,.18)}
.qh-accent{position:relative;display:inline-block;color:#4fd1fb}
.qh-accent::after{content:"";position:absolute;inset-inline:2%;bottom:.02em;height:.09em;border-radius:99px;background:#faab18;transform-origin:right;transform:scaleX(0);animation:qh-line .9s .55s cubic-bezier(.2,.7,.2,1) forwards}
.qh[dir="ltr"] .qh-accent::after{transform-origin:left}
@keyframes qh-line{to{transform:scaleX(1)}}
.qh-sub{margin:0;max-width:500px;font-size:clamp(16px,1.25vw,20px);line-height:1.75;color:rgba(255,255,255,.92)}
.qh-ctas{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;max-width:100%}
.qh-btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;border-radius:14px;border:1px solid transparent;padding:12px 28px;font-family:inherit;font-size:16px;font-weight:700;cursor:pointer;text-decoration:none;transition:background .18s ease,border-color .18s ease,color .18s ease,transform .22s cubic-bezier(.2,.7,.2,1),box-shadow .22s ease}
.qh-btn.pri{background:#faab18;color:#1d2733;box-shadow:0 1px 2px rgba(0,0,0,.18)}
.qh-btn.pri:hover{background:#f09c05;transform:translateY(-2px);box-shadow:0 8px 18px -10px rgba(0,0,0,.4)}
.qh-btn.pri svg{transition:transform .22s ease}
.qh-btn.pri:hover svg{transform:translateX(-4px)}
.qh[dir="ltr"] .qh-btn.pri:hover svg{transform:scaleX(-1) translateX(-4px)}
.qh-btn.sec{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.4);color:#fff;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.qh-btn.sec:hover{border-color:#fff;background:rgba(255,255,255,.18);transform:translateY(-2px)}
.qh-btn:focus-visible{outline:2px solid #00b8f8;outline-offset:3px}
/* Glass panel: the next real departures from the packages list. */
.qh-live{position:absolute;z-index:4;inset-inline-end:clamp(20px,5vw,72px);bottom:clamp(64px,9vh,96px);width:min(340px,30vw);padding:16px;border-radius:20px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.24);-webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);box-shadow:0 18px 40px -24px rgba(0,0,0,.45);color:#fff;animation:qh-rise .9s .35s cubic-bezier(.2,.7,.2,1) both}
.qh-live-h{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 10px;font-size:14px;font-weight:700}
.qh-live-h span{display:inline-flex;align-items:center;gap:8px}
.qh-live-h span::before{content:"";width:8px;height:8px;border-radius:50%;background:#2fd47a;animation:qh-ping-g 2s ease-out infinite}
@keyframes qh-ping-g{0%{box-shadow:0 0 0 0 rgba(47,212,122,.6)}70%,100%{box-shadow:0 0 0 8px rgba(47,212,122,0)}}
.qh-live-h a{color:#fff;font-weight:600;font-size:13px;opacity:.85;text-decoration:none}
.qh-live-h a:hover{opacity:1;text-decoration:underline}
.qh-live ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.qh-live li a{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;padding:10px 12px;border-radius:14px;background:rgba(13,20,28,.28);color:#fff;text-decoration:none;transition:background .18s ease,transform .22s ease}
.qh-live li a:hover{background:rgba(13,20,28,.5);transform:translateX(-3px)}
.qh[dir="ltr"] .qh-live li a:hover{transform:translateX(3px)}
.qh-live-d{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:44px;padding:4px 6px;border-radius:10px;background:#faab18;color:#1d2733;font-weight:700;line-height:1.1}
.qh-live-d b{font-size:18px}.qh-live-d small{font-size:11px;font-weight:600}
.qh-live-t{display:flex;flex-direction:column;min-width:0}
.qh-live-t b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qh-live-t small{font-size:12px;opacity:.8}
.qh-live-p{font-size:13px;font-weight:700;white-space:nowrap;color:#ffd27a}
@media (min-width:821px) and (max-width:1100px){.qh-live{display:none}}
.qh-foot{position:absolute;z-index:5;inset-inline:0;bottom:var(--q-s3,24px);display:flex;align-items:center;justify-content:space-between;gap:var(--q-s2,16px);padding-inline:clamp(20px,5vw,72px)}
.qh-cap{display:inline-flex;align-items:center;gap:7px;font-size:var(--q-t5,15px);font-weight:600;min-height:22px}
.qh-bars{display:flex;gap:6px}
.qh-bar{width:clamp(26px,3vw,46px);height:4px;border-radius:4px;background:rgba(255,255,255,.3);overflow:hidden;cursor:pointer;border:0;padding:0}
.qh-bar i{display:block;height:100%;width:0;background:#fff}
.qh-bar.done i{width:100%;background:#fff}
.qh-bar.on i{animation:qh-fill ${SLIDE_MS}ms linear forwards}
.qh.paused .qh-bar.on i{animation-play-state:paused}
@keyframes qh-fill{to{width:100%}}
/* Phones: the photo (or a video at its own shape) on top, then the copy on
   a light-sky panel in the Instagram look (charcoal type, cyan accent), so
   the Arabic stays readable and nothing in a video frame is cut. */
@media (max-width:820px){
  .qh{height:auto;min-height:0;max-height:none;background:linear-gradient(180deg,#ffffff 0%,#e4f5fc 100%);color:#1d2733;overflow:visible;display:flex;flex-direction:column}
  .qh-media{order:1;position:relative;inset:auto;width:100%;aspect-ratio:var(--qh-mr,4/5);transition:aspect-ratio .3s ease}
  .qh-slide img{object-position:50% 30%}
  .qh-slide video{object-fit:contain;object-position:50% 50%;background:#0d141c}
  .qh-scrim,.qh[dir="ltr"] .qh-scrim{background:linear-gradient(to top,rgba(13,20,28,.55) 0%,rgba(13,20,28,0) 30%)}
  .qh-copy{order:2;position:relative;transform:none;inset:auto;max-width:none;top:auto;padding:22px 16px 28px;gap:14px;background:transparent}
  .qh-eyebrow{background:#fff;border-color:#cdeaf5;color:#049dc5;-webkit-backdrop-filter:none;backdrop-filter:none}
  html[data-area] .qh .qh-title{color:#1d2733;font-size:clamp(34px,10vw,46px)!important;text-shadow:none}
  .qh-accent{color:#049dc5}
  .qh-sub{max-width:none;font-size:16px;color:#3d4650}
  .qh-ctas{flex-direction:column;align-items:stretch;width:100%;gap:10px}
  .qh-btn{width:100%;max-width:100%;min-width:0}
  .qh-btn.sec{background:#fff;border-color:#c3d6df;color:#1d2733;-webkit-backdrop-filter:none;backdrop-filter:none}
  .qh-btn.sec:hover{border-color:#049dc5;background:#fff}
  .qh-foot{bottom:0;padding:24px 16px 12px;color:#fff;background:none}
  .qh-live{order:3;position:relative;inset:auto;width:auto;margin:0 16px 32px;bottom:auto;background:#fff;border-color:#dbe8ee;color:#1d2733;box-shadow:0 1px 2px rgba(29,39,51,.06);-webkit-backdrop-filter:none;backdrop-filter:none}
  .qh-live-h a{color:#049dc5}
  .qh-live li a{background:#f2f9fc;color:#1d2733}
  .qh-live li a:hover{background:#e3f5fc}
  .qh-live-p{color:#049dc5}
}
@media (prefers-reduced-motion:reduce){
  .qh-copy>*,.qh-live,.qh-slide.on img{animation:none}
  .qh-accent::after{animation:none;transform:none}
  .qh-eyebrow::before,.qh-live-h span::before{animation:none}
  .qh-slide{transition:none}
  .qh-bar.on i{animation:none;width:100%}
}
`}</style>
      <div className="qh-media" style={{ '--qh-mr': mobileRatio }}>
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
                onLoadedMetadata={(e) => {
                  const { videoWidth: w, videoHeight: h } = e.currentTarget;
                  if (w && h) setVidRatios((m) => (m[i] ? m : { ...m, [i]: w / h }));
                }}
                preload={ready ? (i === 0 ? 'auto' : 'metadata') : 'none'}
                autoPlay={ready && i === 0}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img {...imgProps(s.type === 'video' ? s.poster || '' : s.url, '100vw', [640, 1080, 1920])} alt="" loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'} decoding={i === 0 ? 'sync' : 'async'} />
            )}
          </div>
        ))}
        <div className="qh-scrim" />

        <div className="qh-foot">
          <div className="qh-cap">
            {current.caption && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
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

      {live.length ? (
        <aside className="qh-live" aria-label={liveTitle}>
          <p className="qh-live-h"><span>{liveTitle}</span><a href="/packages">{lang === 'en' ? 'All' : 'الكل'}</a></p>
          <ol>
            {live.map((r) => (
              <li key={r.href + r.day}>
                <a href={r.href}>
                  <span className="qh-live-d" dir="ltr" data-keep-dir=""><b>{r.day}</b><small>{r.month}</small></span>
                  <span className="qh-live-t"><b>{r.dest}</b><small>{r.nights}</small></span>
                  <span className="qh-live-p">{r.price}</span>
                </a>
              </li>
            ))}
          </ol>
        </aside>
      ) : null}

      <div className="qh-copy">
        {kicker && <p className="qh-eyebrow">{kicker}</p>}
        {title && <h1 className="qh-title"><Title text={title} /></h1>}
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
