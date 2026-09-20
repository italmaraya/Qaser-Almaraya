'use client';
import { useEffect, useRef, useState } from 'react';

// Destinations with a hand-prepared photo sequence showing the landmark
// "growing" into frame. Add more by dropping numbered frames under
// /public/assets/showcase/<key>/frame-1.jpg, frame-2.jpg, ... and adding an
// entry here.
const SCENES = {
  dubai: {
    label_ar: 'دبي', label_en: 'Dubai',
    frames: Array.from({ length: 9 }, (_, i) => `/assets/showcase/dubai/frame-${i + 1}.jpg`),
  },
};

function detectScene(name = '') {
  const s = String(name).toLowerCase();
  if (/dubai|إمارات|دبي|uae|أبوظبي|abu dhabi/.test(s)) return 'dubai';
  return null;
}

export default function DestinationShowcase({ destinationName, lang = 'ar', fallbackImage, fallbackLabel }) {
  const sceneKey = detectScene(destinationName);
  const scene = sceneKey ? SCENES[sceneKey] : null;
  const [frameIdx, setFrameIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    clearInterval(timerRef.current);
    setFrameIdx(0);
    if (!scene) return undefined;
    let i = 0;
    timerRef.current = setInterval(() => {
      i += 1;
      if (i >= scene.frames.length) {
        clearInterval(timerRef.current);
        return;
      }
      setFrameIdx(i);
    }, 220);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationName]);

  // No prepared photo sequence yet for this destination — fall back to its
  // own package photo with a gentle Ken Burns zoom instead of a fake scene.
  if (!scene) {
    if (!fallbackImage) return null;
    return (
      <div className="qa-showcase">
        <img key={destinationName} src={fallbackImage} alt="" className="qa-showcase-kenburns" />
        <div className="qa-showcase-gradient" />
        {fallbackLabel ? <span className="qa-showcase-label">{fallbackLabel}</span> : null}
        <style jsx>{`
          .qa-showcase { position: relative; width: 100%; height: clamp(200px,30vw,320px); border-radius: 24px; overflow: hidden; background: #0d2b36; }
          .qa-showcase-kenburns { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: qa-kenburns 6s ease-out forwards; }
          .qa-showcase-gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(1,20,28,.6) 0%, transparent 55%); }
          .qa-showcase-label { position: absolute; bottom: 16px; inset-inline-start: 20px; color: #fff; font-weight: 800; font-size: 18px; text-shadow: 0 2px 10px rgba(0,0,0,.4); }
          @keyframes qa-kenburns { from { transform: scale(1); } to { transform: scale(1.09); } }
        `}</style>
      </div>
    );
  }

  const label = lang === 'en' ? scene.label_en : scene.label_ar;

  return (
    <div className="qa-showcase">
      {scene.frames.map((src, i) => (
        <img key={src} src={src} alt="" className="qa-showcase-frame" style={{ opacity: i === frameIdx ? 1 : 0 }} />
      ))}
      <div className="qa-showcase-gradient" />
      {label ? <span className="qa-showcase-label">{label}</span> : null}
      <style jsx>{`
        .qa-showcase { position: relative; width: 100%; height: clamp(200px,30vw,320px); border-radius: 24px; overflow: hidden; background: #0d2b36; }
        .qa-showcase-frame { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity .35s ease; }
        .qa-showcase-gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(1,20,28,.55) 0%, transparent 55%); }
        .qa-showcase-label { position: absolute; bottom: 16px; inset-inline-start: 20px; color: #fff; font-weight: 800; font-size: 18px; text-shadow: 0 2px 10px rgba(0,0,0,.4); }
      `}</style>
    </div>
  );
}
