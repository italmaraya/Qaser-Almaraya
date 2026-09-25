'use client';
import { useEffect, useRef, useState } from 'react';

const SLIDE_MS = 7000;
const FADE_MS = 1400;

// Thin "globe" lines drifting over the footage: meridians are ellipses whose
// width breathes in and out, which reads as a slowly turning globe.
function GlobeLines() {
  const meridians = [0, 1, 2, 3, 4, 5];
  return (
    <svg className="qh-lines" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" stroke="rgba(255,255,255,.11)" strokeWidth="1">
        <circle cx="500" cy="500" r="430" />
        {meridians.map((i) => (
          <ellipse key={i} cx="500" cy="500" rx="430" ry="430" className="qh-mer" style={{ animationDelay: `${-i * 4}s` }} />
        ))}
        {[-250, 0, 250].map((y) => {
          const r = Math.sqrt(430 * 430 - y * y);
          return <ellipse key={y} cx="500" cy={500 + y} rx={r} ry={r * 0.08} />;
        })}
      </g>
    </svg>
  );
}

/**
 * Full-screen cinematic hero.
 * slides: [{ type: 'video'|'image', url, poster?, caption? }]
 */
export default function HeroCinematic({ slides = [], kicker, title, subtitle, primary, secondary, lang = 'ar' }) {
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
  const videoRefs = useRef([]);
  const count = slides.length;

  useEffect(() => {
    try { setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch {}
  }, []);

  // Auto-advance
  useEffect(() => {
    if (count < 2 || paused) return undefined;
    const id = setTimeout(() => setActive((a) => (a + 1) % count), SLIDE_MS);
    return () => clearTimeout(id);
  }, [active, count, paused]);

  // Only the visible video plays (saves data on phones)
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) { v.currentTime = 0; const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
    });
  }, [active]);

  const current = slides[active] || {};
  const dir = lang === 'en' ? 'ltr' : 'rtl';

  return (
    <section className="qh" dir={dir} data-no-i18n="">
      <style>{`
.qh{position:relative;height:min(92vh,860px);min-height:520px;overflow:hidden;background:#04161f;color:#fff;isolation:isolate}
.qh-slide{position:absolute;inset:0;opacity:0;transition:opacity ${FADE_MS}ms ease;z-index:0}
.qh-slide.on{opacity:1;z-index:1}
.qh-slide img,.qh-slide video{width:100%;height:100%;object-fit:cover;display:block}
.qh-slide.on img{animation:qh-zoom ${SLIDE_MS + FADE_MS}ms ease-out forwards}
@keyframes qh-zoom{from{transform:scale(1.02)}to{transform:scale(1.12)}}
.qh-shade{position:absolute;inset:0;z-index:2;background:radial-gradient(ellipse at 50% 45%,rgba(4,22,31,.10) 0%,rgba(4,22,31,.45) 70%),linear-gradient(to bottom,rgba(4,22,31,.35) 0%,rgba(4,22,31,.05) 35%,rgba(4,22,31,.55) 100%)}
.qh-lines{position:absolute;left:50%;top:50%;width:max(118vh,100%);height:max(118vh,100%);transform:translate(-50%,-50%);z-index:3;pointer-events:none}
.qh-mer{animation:qh-turn 24s linear infinite}
@keyframes qh-turn{0%{rx:430px}25%{rx:0px}50%{rx:430px}75%{rx:0px}100%{rx:430px}}
.qh-copy{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:clamp(10px,1.4vw,18px);padding:0 6%}
.qh-logo{width:clamp(52px,5vw,78px);height:auto;filter:drop-shadow(0 4px 14px rgba(0,0,0,.3));animation:qh-up .9s ease both}
.qh-kicker{font-size:clamp(14px,1.25vw,20px);font-weight:500;letter-spacing:.02em;opacity:.95;animation:qh-up .9s .12s ease both}
.qh-title{margin:0;font-size:clamp(38px,6.4vw,104px);font-weight:700;line-height:1.05;letter-spacing:-.01em;text-shadow:0 6px 30px rgba(0,0,0,.35);animation:qh-up 1s .22s ease both}
.qh-sub{margin:0;max-width:640px;font-size:clamp(15px,1.2vw,19px);line-height:1.8;opacity:.92;animation:qh-up 1s .34s ease both}
.qh-ctas{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:6px;animation:qh-up 1s .46s ease both}
.qh-btn{display:inline-flex;align-items:center;gap:9px;border-radius:999px;padding:clamp(11px,.9vw,15px) clamp(22px,2vw,34px);font-weight:700;font-size:clamp(14px,1vw,17px);cursor:pointer;font-family:inherit;border:0;text-decoration:none;transition:transform .2s,background .2s}
.qh-btn:hover{transform:translateY(-2px)}
.qh-btn.pri{background:#faab18;color:#012a37;box-shadow:0 10px 26px rgba(250,171,24,.35)}
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
.qh-scroll{position:absolute;z-index:5;left:50%;bottom:clamp(14px,2.4vh,26px);transform:translateX(-50%);width:26px;height:40px;border:1.5px solid rgba(255,255,255,.6);border-radius:14px}
.qh-scroll:after{content:"";position:absolute;left:50%;top:7px;width:3px;height:8px;margin-left:-1.5px;border-radius:2px;background:#fff;animation:qh-wheel 1.8s ease-in-out infinite}
@keyframes qh-wheel{0%{opacity:0;transform:translateY(0)}30%{opacity:1}100%{opacity:0;transform:translateY(12px)}}
@media (max-width:640px){.qh{height:min(86vh,720px)}.qh-scroll{display:none}.qh-bottom{flex-direction:column-reverse;align-items:center}}
@media (prefers-reduced-motion:reduce){.qh-slide.on img,.qh-mer,.qh-bar.on i,.qh *{animation:none!important}}
`}</style>
      {slides.map((s, i) => (
        <div key={i} className={'qh-slide' + (i === active ? ' on' : '')} aria-hidden={i !== active}>
          {s.type === 'video' && !reduced ? (
            <video
              ref={(el) => { videoRefs.current[i] = el; }}
              src={s.url}
              poster={s.poster || undefined}
              muted
              loop
              playsInline
              preload={i === 0 ? 'auto' : 'metadata'}
              autoPlay={i === 0}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i === active ? 'on' + active : 'off'} src={s.type === 'video' ? s.poster || '' : s.url} alt="" loading={i === 0 ? 'eager' : 'lazy'} />
          )}
        </div>
      ))}
      <div className="qh-shade" />
      <GlobeLines />

      <div className="qh-copy">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="qh-logo" src="/assets/logo-mark-white.webp" alt="" />
        {kicker && <span className="qh-kicker">{kicker}</span>}
        {title && <h1 className="qh-title">{title}</h1>}
        {subtitle && <p className="qh-sub">{subtitle}</p>}
        <div className="qh-ctas">
          {primary && (
            <button type="button" className="qh-btn pri" onClick={primary.onClick}>
              {primary.label}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: dir === 'ltr' ? 'scaleX(-1)' : undefined }}><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
          {secondary && <a className="qh-btn sec" href={secondary.href}>{secondary.label}</a>}
        </div>
      </div>

      <div className="qh-bottom">
        <div className="qh-cap" key={active}>
          {current.caption && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
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
      <span className="qh-scroll" aria-hidden="true" />
    </section>
  );
}
