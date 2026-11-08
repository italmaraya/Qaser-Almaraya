'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon';
import { WA_ICON } from '../WhatsAppButton';
import { loadPackages } from '../../lib/publicPackages';
import { groupPackagesByCountry, destinationLabel, nightsLabel } from '../../lib/destinations';
import { formatPrice } from '../../lib/currency';
import { waLink, packageMessage } from '../../lib/whatsapp';
import { optimized } from '../../lib/img';

// Instagram-style "stories" for the offers: one ring per destination country
// (from the live packages), each opening a full-screen story whose slides are
// that country's packages: photo, nights, starting price, WhatsApp booking and
// a link to the programme. Slides advance by themselves; tap the sides to move,
// hold to pause, swipe down or Esc to close. Watched rings turn grey (kept in
// this browser only). Hidden when there are no packages with photos.
// A package with a "story video" (uploaded in the package editor) plays it
// muted instead of the photo, with a sound button; the photo stays as the
// poster and comes back if the video fails. Photos move slowly (CSS).
const SLIDE_MS = 5500;
const VIDEO_MAX_S = 20;
const MAX_STORIES = 12;
const MAX_SLIDES = 5;
const SEEN_KEY = 'qa-stories-seen';

function readSeen() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch (e) { return new Set(); }
}
function saveSeen(set) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...set].slice(-60))); } catch (e) { /* storage blocked */ }
}
const photo = (url, w) => (url ? optimized(url, w) || url : '');
// If the image optimiser refuses a photo, fall back to the original file once.
const fallback = (orig) => (e) => { const im = e.currentTarget; if (!im.dataset.fallback) { im.dataset.fallback = '1'; im.src = orig; } };

export default function OfferStories({ lang = 'ar' }) {
  const en = lang === 'en';
  const [pkgs, setPkgs] = useState(null);
  const [seen, setSeen] = useState(() => new Set());
  const [open, setOpen] = useState(null); // { s: story index, i: slide index }
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadedId, setLoadedId] = useState(null); // the slide timer waits for its photo
  const [muted, setMuted] = useState(true);
  const [badVideo, setBadVideo] = useState(() => new Set());
  const [reduce, setReduce] = useState(false);
  const vidRef = useRef(null);
  const vidDone = useRef(null); // id of the video slide that already moved on
  const touch = useRef(null);
  const holdTimer = useRef(null);
  const held = useRef(false); // true while a press-and-hold has paused the story

  useEffect(() => {
    let alive = true;
    setSeen(readSeen());
    setReduce(!!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches));
    loadPackages().then((l) => { if (alive) setPkgs(l); });
    return () => { alive = false; };
  }, []);

  const stories = useMemo(() => groupPackagesByCountry(pkgs || [])
    .filter((g) => g.iso !== 'zz')
    .map((g) => ({ ...g, items: g.items.filter((p) => p.image_url || p.story_video_url).slice(0, MAX_SLIDES) }))
    .filter((g) => g.items.length)
    .slice(0, MAX_STORIES), [pkgs]);

  const close = useCallback(() => { setOpen(null); setPaused(false); setProgress(0); }, []);
  const markSeen = useCallback((iso) => setSeen((prev) => {
    if (prev.has(iso)) return prev;
    const next = new Set(prev); next.add(iso); saveSeen(next); return next;
  }), []);

  const go = useCallback((dir) => {
    setProgress(0);
    setOpen((o) => {
      if (!o) return o;
      const st = stories[o.s];
      if (dir > 0) {
        if (o.i + 1 < st.items.length) return { s: o.s, i: o.i + 1 };
        if (o.s + 1 < stories.length) return { s: o.s + 1, i: 0 };
        return null;
      }
      if (o.i > 0) return { s: o.s, i: o.i - 1 };
      if (o.s > 0) return { s: o.s - 1, i: stories[o.s - 1].items.length - 1 };
      return { s: o.s, i: 0 };
    });
  }, [stories]);

  const curItem = open && stories[open.s] ? stories[open.s].items[open.i] : null;
  const curId = curItem ? curItem.id : null;
  const isVideo = !!(curItem && curItem.story_video_url && !reduce && !badVideo.has(curItem.id));
  const ready = curId !== null && loadedId === curId;
  // Timer: fills the bar of the current slide (once its photo is in), then moves on.
  // A video slide is timed by the video itself (see onTimeUpdate / onEnded).
  useEffect(() => {
    if (!open || paused || !ready || isVideo) return undefined;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return undefined;
    const step = 50;
    const id = setInterval(() => {
      setProgress((p) => {
        const n = p + step / SLIDE_MS;
        if (n >= 1) { setTimeout(() => go(1), 0); return 1; }
        return n;
      });
    }, step);
    return () => clearInterval(id);
  }, [open, paused, ready, isVideo, go]);

  useEffect(() => { vidDone.current = null; }, [curId]);
  // Hold / pause button also pauses the video.
  useEffect(() => {
    const v = vidRef.current;
    if (!v || !isVideo) return;
    if (paused) v.pause(); else v.play().catch(() => {});
  }, [paused, isVideo, curId]);
  const onVideoTime = (e) => {
    const v = e.currentTarget;
    const len = Math.min(VIDEO_MAX_S, v.duration || VIDEO_MAX_S);
    const n = Math.min(1, v.currentTime / len);
    setProgress(n);
    if (v.currentTime >= VIDEO_MAX_S) videoDone(curId);
  };
  const videoDone = (id) => { if (vidDone.current === id) return; vidDone.current = id; go(1); };
  const onVideoFail = (id) => setBadVideo((prev) => { const n = new Set(prev); n.add(id); return n; });

  useEffect(() => { if (open) markSeen(stories[open.s].iso); }, [open, stories, markSeen]);

  // Keys, body scroll lock, and preloading the next photo.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(en ? -1 : 1);
      else if (e.key === 'ArrowRight') go(en ? 1 : -1);
      else if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const st = stories[open.s];
    const nxt = st.items[open.i + 1] || (stories[open.s + 1] && stories[open.s + 1].items[0]);
    if (nxt && nxt.image_url) { const im = new Image(); im.src = photo(nxt.image_url, 828); }
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, stories, close, go, en]);

  if (!stories.length) return null;

  const cur = open ? stories[open.s] : null;
  const p = cur ? cur.items[open.i] : null;
  const title = p ? (en && p.title_en) || p.title_ar : '';
  const url = p && typeof window !== 'undefined' ? window.location.origin + '/packages/' + p.id : '';

  // Tap zones: the reading-start side goes back, the other side goes forward.
  const onTap = (e) => {
    if (e.target.closest('a,button')) return;
    if (held.current) { held.current = false; return; } // releasing a hold doesn't change slide
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const startSide = en ? x < 0.33 : x > 0.67;
    go(startSide ? -1 : 1);
  };
  const holdStart = (e) => {
    if (e.target.closest('a,button')) return;
    clearTimeout(holdTimer.current);
    held.current = false;
    holdTimer.current = setTimeout(() => { held.current = true; setPaused(true); }, 180);
    if (e.touches) touch.current = { y: e.touches[0].clientY, x: e.touches[0].clientX };
  };
  const holdEnd = (e) => {
    clearTimeout(holdTimer.current);
    if (touch.current && e.changedTouches) {
      const dy = e.changedTouches[0].clientY - touch.current.y;
      touch.current = null;
      if (dy > 90) { close(); return; }
    }
    // Only a hold un-pauses on release; the pause button keeps its own state.
    if (held.current) setPaused(false);
  };

  return (
    <section className="qs-st-band" data-no-i18n="" dir={en ? 'ltr' : 'rtl'} aria-label={en ? 'Offer stories' : 'قصص العروض'}>
      <div className="qs-st-row">
        {stories.map((g, s) => (
          <button key={g.iso} type="button" className={'qs-st-ring' + (seen.has(g.iso) ? ' seen' : '')} onClick={() => { setProgress(0); setOpen({ s, i: 0 }); }}>
            <span className="qs-st-ring-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {g.items[0].image_url
                ? <img src={photo(g.items[0].image_url, 384)} onError={fallback(g.items[0].image_url)} alt="" loading="lazy" decoding="async" />
                : <video src={g.items[0].story_video_url + '#t=0.5'} muted playsInline preload="metadata" aria-hidden="true" />}
            </span>
            <span className="qs-st-name">{en ? g.en : g.ar}</span>
          </button>
        ))}
      </div>

      {open && p ? createPortal(
        <div className="qs-st-view" role="dialog" aria-modal="true" data-no-i18n="" dir={en ? 'ltr' : 'rtl'} aria-label={(en ? cur.en : cur.ar) + ' — ' + title}>
          <div
            style={p.image_url ? { backgroundImage: `url("${photo(p.image_url, 384)}")` } : undefined}
            className="qs-st-card"
            onClick={onTap}
            onMouseDown={holdStart}
            onMouseUp={holdEnd}
            onMouseLeave={() => { clearTimeout(holdTimer.current); if (held.current) { held.current = false; setPaused(false); } }}
            onTouchStart={holdStart}
            onTouchEnd={holdEnd}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {isVideo ? (
              <video
                key={'v' + p.id}
                ref={vidRef}
                className="qs-st-photo qs-st-video"
                src={p.story_video_url}
                poster={p.image_url ? photo(p.image_url, 828) : undefined}
                muted={muted}
                playsInline
                autoPlay
                preload="auto"
                onPlaying={() => setLoadedId(p.id)}
                onTimeUpdate={onVideoTime}
                onEnded={() => videoDone(p.id)}
                onError={() => onVideoFail(p.id)}
              />
            ) : (
              <img key={p.id} className={'qs-st-photo kb' + ((open.s + open.i) % 4) + (paused ? ' hold' : '')} src={photo(p.image_url, 1080)} onLoad={() => setLoadedId(p.id)} onError={(e) => { if (e.currentTarget.dataset.fallback) setLoadedId(p.id); fallback(p.image_url)(e); }} alt="" />
            )}
            <div className="qs-st-shade" aria-hidden="true" />
            <div className="qs-st-bars" aria-hidden="true">
              {cur.items.map((x, n) => (
                <span key={x.id}><i style={{ transform: `scaleX(${n < open.i ? 1 : n === open.i ? progress : 0})` }} /></span>
              ))}
            </div>
            <div className="qs-st-top">
              <span className="qs-st-who">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logo-mark-tight.webp" alt="" width="32" height="32" />
                <span><b>{en ? cur.en : cur.ar}</b><small>{en ? 'Qaser Almaraya' : 'قصر المرايا'}</small></span>
              </span>
              <span className="qs-st-ctl">
                {isVideo ? (
                  <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? (en ? 'Sound on' : 'تشغيل الصوت') : (en ? 'Sound off' : 'كتم الصوت')}>
                    <Icon name={muted ? 'volume-x' : 'volume-2'} size={18} strokeWidth={2.2} />
                  </button>
                ) : null}
                <button type="button" onClick={() => setPaused((x) => !x)} aria-label={paused ? (en ? 'Play' : 'تشغيل') : (en ? 'Pause' : 'إيقاف مؤقت')}>
                  {paused ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>}
                </button>
                <button type="button" onClick={close} aria-label={en ? 'Close' : 'إغلاق'}><Icon name="x" size={20} strokeWidth={2.4} /></button>
              </span>
            </div>
            <div className="qs-st-info" key={'i' + p.id}>
              <span className="qs-st-meta">{[destinationLabel(p, lang), nightsLabel(p, lang)].filter(Boolean).join(' · ')}</span>
              <h3>{title}</h3>
              <span className="qs-st-price"><small>{en ? 'From' : 'يبدأ من'}</small>{formatPrice(p.price, 'IQD', lang)}<small>{en ? ' per person' : ' للفرد'}</small></span>
              <div className="qs-st-acts">
                <a className="qs-st-wa" href={waLink(packageMessage({ title, dest: destinationLabel(p, lang), nights: nightsLabel(p, lang), url }, lang))} target="_blank" rel="noopener">{WA_ICON}{en ? 'Book on WhatsApp' : 'احجز عبر واتساب'}</a>
                <a className="qs-st-more" href={'/packages/' + p.id}>{en ? 'Programme' : 'البرنامج'}<Icon name={en ? 'chevron-right' : 'chevron-left'} size={16} strokeWidth={2.4} /></a>
              </div>
            </div>
          </div>
          <button type="button" className="qs-st-nav prev" onClick={() => go(-1)} aria-label={en ? 'Previous' : 'السابق'}><Icon name={en ? 'chevron-left' : 'chevron-right'} size={22} strokeWidth={2.4} /></button>
          <button type="button" className="qs-st-nav next" onClick={() => go(1)} aria-label={en ? 'Next' : 'التالي'}><Icon name={en ? 'chevron-right' : 'chevron-left'} size={22} strokeWidth={2.4} /></button>
        </div>,
        document.body,
      ) : null}
    </section>
  );
}
