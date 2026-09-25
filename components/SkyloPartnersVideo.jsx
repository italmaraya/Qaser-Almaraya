'use client';
import { useEffect, useRef, useState } from 'react';

// Homepage band: Skylo × Flamingo "Partners and best friends" video.
// Plays muted when scrolled into view, pauses when off-screen; sound toggle.
export default function SkyloPartnersVideo({ lang = 'ar', onFlights }) {
  const en = lang === 'en';
  const ref = useRef(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } else v.pause();
    }, { threshold: 0.35 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  function toggleSound() {
    const v = ref.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
    if (muted) { v.currentTime = 0; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
  }

  return (
    <section className="qa-sec" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <style>{`
.qsp{display:grid;grid-template-columns:1.15fr .85fr;gap:clamp(24px,4vw,56px);align-items:center;background:linear-gradient(135deg,#fff6df 0%,#eaf8fd 100%);border-radius:28px;padding:clamp(18px,2.4vw,32px);position:relative;overflow:hidden}
.qsp-frame{position:relative;border-radius:20px;overflow:hidden;box-shadow:0 22px 50px rgba(1,42,55,.18);background:#34bbe1;transform:rotate(-1.2deg)}
.qsp-frame video{display:block;width:100%;height:auto;aspect-ratio:1144/804;object-fit:cover}
.qsp-sound{position:absolute;bottom:12px;inset-inline-start:12px;display:inline-flex;align-items:center;gap:7px;border:0;border-radius:999px;padding:8px 14px;background:rgba(1,42,55,.72);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;backdrop-filter:blur(6px)}
.qsp-copy{display:flex;flex-direction:column;gap:14px}
.qsp-kick{font-size:13px;font-weight:700;color:#e59a05;letter-spacing:.04em}
.qsp-copy h2{margin:0;font-size:clamp(26px,3vw,40px);line-height:1.2}
.qsp-copy p{margin:0;font-size:clamp(15px,1.15vw,18px);line-height:1.8;color:#3d4650}
.qsp-logos{display:flex;align-items:center;gap:14px}
.qsp-logos img{height:40px;width:auto}
.qsp-ctas{display:flex;gap:10px;flex-wrap:wrap}
@media (max-width:820px){.qsp{grid-template-columns:1fr}.qsp-frame{transform:none}}
`}</style>
      <div className="qsp">
        <div className="qsp-frame">
          <video ref={ref} src="/assets/skylo-flamingo-partners.mp4" poster="/assets/skylo-flamingo-partners-poster.jpg" muted loop playsInline preload="metadata" />
          <button type="button" className="qsp-sound" onClick={toggleSound} aria-label={muted ? 'sound on' : 'sound off'}>
            {muted ? '🔈' : '🔊'} {muted ? (en ? 'Play with sound' : 'شغّل الصوت') : (en ? 'Mute' : 'كتم الصوت')}
          </button>
        </div>
        <div className="qsp-copy">
          <span className="qsp-kick">{en ? 'PARTNERS & BEST FRIENDS' : 'شركاء وأصدقاء'}</span>
          <div className="qsp-logos">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-mark.webp" alt="Qaser Almaraya" style={{ background: '#fff', borderRadius: '50%', padding: 4 }} />
            <span style={{ fontSize: 26, color: '#7b8087' }}>×</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-flamingo.png" alt="Flamingo" style={{ height: 34 }} />
          </div>
          <h2>{en ? 'Skylo & Flamingo, your travel companions' : 'سكايلو وفلامنغو… رفيقا رحلتك'}</h2>
          <p>
            {en
              ? 'Qaser Almaraya is Flamingo’s official partner. Book flights and hotels on Flamingo, and our team stays with you from the first search to the boarding pass.'
              : 'قصر المرايا هي الشريك الرسمي لفلامنغو. احجز طيرانك وفندقك عبر فلامنغو، ويبقى فريقنا معك من أول بحث حتى بطاقة الصعود.'}
          </p>
          <div className="qsp-ctas">
            <a className="qa-btn qa-cyan" href="https://flamingo.iq" target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>{en ? 'Book on Flamingo' : 'احجز عبر فلامنغو'}</a>
            <button type="button" className="qa-btn" onClick={onFlights} style={{ fontFamily: 'inherit', background: '#fff', color: '#036f8c', border: '1px solid #cfe9f2' }}>{en ? 'Flights & hotels' : 'الطيران والفنادق'}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
