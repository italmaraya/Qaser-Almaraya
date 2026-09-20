'use client';
import { useEffect, useRef, useState } from 'react';

const FRAME_COUNT = 9;
const FRAMES = Array.from({ length: FRAME_COUNT }, (_, i) => `/assets/showcase/dubai/frame-${i + 1}.jpg`);

export default function DubaiJourney({ lang = 'ar', onExplore }) {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    function measure() {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const p = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;
      setProgress(p);
    }
    function onScroll() {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    }
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const frameIdx = Math.min(FRAME_COUNT - 1, Math.floor(progress * FRAME_COUNT));
  const zoom = 1 + progress * 0.16;
  const parallaxY = progress * -26;
  const introOpacity = progress < 0.14 ? 1 - progress / 0.14 : 0;
  const outroOpacity = progress > 0.82 ? (progress - 0.82) / 0.18 : 0;

  return (
    <section ref={sectionRef} className="qa-sec" style={{ position: 'relative', height: '340vh', maxWidth: 1240, margin: '0 auto', padding: '8px 24px' }}>
      <div
        style={{
          position: 'sticky', top: 0, height: '92vh', maxHeight: 720, overflow: 'hidden', borderRadius: 28, background: '#050a10',
        }}
      >
        {FRAMES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: i === frameIdx ? 1 : 0,
              transform: `scale(${zoom}) translateY(${parallaxY}px)`,
              transition: 'opacity .35s ease',
              willChange: 'opacity, transform',
            }}
          />
        ))}

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(2,10,16,.72) 0%, rgba(2,10,16,.1) 38%, rgba(2,10,16,.35) 100%)' }} />

        {/* Intro title */}
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
            opacity: introOpacity, transition: 'opacity .2s linear', pointerEvents: 'none', textAlign: 'center', padding: '0 24px',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.1em', color: 'rgba(255,255,255,.75)' }}>
            {lang === 'en' ? 'SCROLL TO RISE' : 'مرر للأعلى لتصعد'}
          </span>
          <h2 style={{ margin: 0, fontSize: 'clamp(38px,7vw,72px)', fontWeight: 800, color: '#fff' }}>
            {lang === 'en' ? 'DUBAI' : 'دبي'}
          </h2>
          <span style={{ fontSize: 15, color: 'rgba(255,255,255,.85)' }}>
            {lang === 'en' ? 'Your journey starts here' : 'رحلتك تبدأ من هنا'}
          </span>
        </div>

        {/* Outro reveal + CTA */}
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 16,
            paddingBottom: 'clamp(40px,8vh,90px)', opacity: outroOpacity, transition: 'opacity .2s linear',
            pointerEvents: outroOpacity > 0.5 ? 'auto' : 'none', textAlign: 'center', padding: '0 24px clamp(40px,8vh,90px)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,32px)', fontWeight: 800, color: '#fff' }}>
            {lang === 'en' ? 'DUBAI — YOUR JOURNEY STARTS HERE' : 'دبي — رحلتك تبدأ من هنا'}
          </h3>
          <button
            type="button"
            onClick={onExplore}
            className="qa-btn qa-amber"
          >
            {lang === 'en' ? 'Explore Dubai packages' : 'استعرض باقات دبي'}
          </button>
        </div>

        {/* progress rail */}
        <div style={{ position: 'absolute', bottom: 18, insetInlineStart: '50%', transform: 'translateX(-50%)', width: 'min(280px,60%)', height: 3, background: 'rgba(255,255,255,.25)', borderRadius: 999 }}>
          <div style={{ width: `${progress * 100}%`, height: '100%', background: '#fff', borderRadius: 999 }} />
        </div>
      </div>
    </section>
  );
}
