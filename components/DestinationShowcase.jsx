'use client';
import { useEffect, useState } from 'react';

// Matches a destination's free-text name (Arabic or English) to one of our
// hand-built landmark scenes. Falls back to a generic "sunrise over hills"
// scene for anything we don't have bespoke art for yet.
function detectScene(name = '') {
  const s = String(name).toLowerCase();
  if (/dubai|إمارات|دبي|uae|أبوظبي|abu dhabi/.test(s)) return 'dubai';
  if (/kuala|malaysia|ماليزيا|كوالالمبور|بيتروناس|petronas/.test(s)) return 'kl';
  if (/japan|tokyo|اليابان|طوكيو|kyoto|كيوتو|ياباني/.test(s)) return 'japan';
  if (/istanbul|turkey|إسطنبول|تركيا|turkiye/.test(s)) return 'istanbul';
  if (/paris|france|باريس|فرنسا/.test(s)) return 'paris';
  return 'default';
}

const SCENES = {
  dubai: { label_ar: 'دبي', label_en: 'Dubai', colors: ['#1b1240', '#5c2c86', '#f2a94e'] },
  kl: { label_ar: 'كوالالمبور', label_en: 'Kuala Lumpur', colors: ['#031e28', '#0d4658', '#22c3ab'] },
  japan: { label_ar: 'اليابان', label_en: 'Japan', colors: ['#2c0f22', '#6e2748', '#f6c9d9'] },
  istanbul: { label_ar: 'إسطنبول', label_en: 'Istanbul', colors: ['#0c1f33', '#28527a', '#e7a94c'] },
  paris: { label_ar: 'باريس', label_en: 'Paris', colors: ['#101a2e', '#33456e', '#f2d9a8'] },
  default: { label_ar: '', label_en: '', colors: ['#0a2530', '#0d4a5c', '#4fc7e8'] },
};

function BurjScene() {
  return (
    <svg viewBox="0 0 400 220" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', inset: 0 }}>
      {/* skyline haze */}
      <rect x="0" y="150" width="400" height="70" fill="rgba(0,0,0,.18)" />
      {/* small neighboring buildings */}
      <g className="qa-scene-rise" style={{ animationDelay: '.1s' }}>
        <rect x="60" y="150" width="26" height="60" fill="rgba(255,255,255,.14)" />
        <rect x="300" y="140" width="30" height="70" fill="rgba(255,255,255,.12)" />
        <rect x="330" y="160" width="20" height="50" fill="rgba(255,255,255,.16)" />
      </g>
      {/* Burj Khalifa silhouette, drawn in */}
      <path
        className="qa-scene-draw"
        d="M200 20 L206 60 L212 95 L208 130 L214 160 L206 190 L194 190 L186 160 L192 130 L188 95 L194 60 Z"
        fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round"
      />
      <path className="qa-scene-fill" d="M200 20 L206 60 L212 95 L208 130 L214 160 L206 190 L194 190 L186 160 L192 130 L188 95 L194 60 Z" fill="rgba(255,255,255,.92)" />
      {/* spire glow */}
      <circle className="qa-scene-glow" cx="200" cy="22" r="4" fill="#ffe9b0" />
    </svg>
  );
}

function PetronasScene() {
  return (
    <svg viewBox="0 0 400 220" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', inset: 0 }}>
      <rect x="0" y="150" width="400" height="70" fill="rgba(0,0,0,.18)" />
      <g className="qa-scene-tower-l" style={{ transformOrigin: '160px 195px' }}>
        <rect x="146" y="70" width="28" height="125" rx="4" fill="rgba(255,255,255,.94)" />
        <rect x="157" y="40" width="6" height="32" fill="rgba(255,255,255,.94)" />
      </g>
      <g className="qa-scene-tower-r" style={{ transformOrigin: '240px 195px' }}>
        <rect x="226" y="70" width="28" height="125" rx="4" fill="rgba(255,255,255,.94)" />
        <rect x="237" y="40" width="6" height="32" fill="rgba(255,255,255,.94)" />
      </g>
      <rect className="qa-scene-bridge" x="174" y="120" width="52" height="8" fill="rgba(255,255,255,.85)" />
      <circle className="qa-scene-glow" cx="160" cy="42" r="3" fill="#8ef0e0" />
      <circle className="qa-scene-glow" cx="240" cy="42" r="3" fill="#8ef0e0" style={{ animationDelay: '.5s' }} />
    </svg>
  );
}

function SakuraScene() {
  const petals = Array.from({ length: 14 });
  return (
    <svg viewBox="0 0 400 220" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <rect x="0" y="185" width="400" height="35" fill="rgba(0,0,0,.12)" />
      {/* trunk */}
      <path className="qa-scene-draw" d="M120 210 C120 170 130 150 140 130" fill="none" stroke="#5b3a3a" strokeWidth="7" strokeLinecap="round" />
      <path className="qa-scene-draw" d="M140 130 C150 118 165 112 178 108" fill="none" stroke="#5b3a3a" strokeWidth="5" strokeLinecap="round" style={{ animationDelay: '.3s' }} />
      <path className="qa-scene-draw" d="M140 130 C132 112 128 98 132 82" fill="none" stroke="#5b3a3a" strokeWidth="5" strokeLinecap="round" style={{ animationDelay: '.3s' }} />
      {/* canopy */}
      <g className="qa-scene-fill" style={{ animationDelay: '.5s' }}>
        <circle cx="132" cy="76" r="30" fill="#f6c9d9" />
        <circle cx="172" cy="98" r="26" fill="#f3b6cc" />
        <circle cx="100" cy="100" r="24" fill="#f3b6cc" />
        <circle cx="150" cy="60" r="22" fill="#fbd9e6" />
      </g>
      {petals.map((_, i) => (
        <circle
          key={i}
          className="qa-scene-petal"
          cx={40 + (i * 27) % 360}
          cy={-10 - (i % 4) * 20}
          r={i % 3 === 0 ? 3.2 : 2.2}
          fill="#f9d3e2"
          style={{ animationDelay: `${(i * 0.45).toFixed(2)}s`, animationDuration: `${5 + (i % 4)}s` }}
        />
      ))}
    </svg>
  );
}

function IstanbulScene() {
  return (
    <svg viewBox="0 0 400 220" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', inset: 0 }}>
      <rect x="0" y="165" width="400" height="55" fill="rgba(0,0,0,.16)" />
      <g className="qa-scene-rise">
        {/* mosque dome + minarets, simplified */}
        <path d="M140 165 Q140 120 190 120 Q240 120 240 165 Z" fill="rgba(255,255,255,.9)" />
        <circle cx="190" cy="118" r="3" fill="#f2c879" />
        <rect x="110" y="90" width="8" height="75" fill="rgba(255,255,255,.9)" />
        <circle cx="114" cy="88" r="5" fill="rgba(255,255,255,.9)" />
        <rect x="262" y="90" width="8" height="75" fill="rgba(255,255,255,.9)" />
        <circle cx="266" cy="88" r="5" fill="rgba(255,255,255,.9)" />
      </g>
      <circle className="qa-scene-glow" cx="190" cy="70" r="14" fill="#f2c879" opacity=".55" />
    </svg>
  );
}

function ParisScene() {
  return (
    <svg viewBox="0 0 400 220" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', inset: 0 }}>
      <rect x="0" y="165" width="400" height="55" fill="rgba(0,0,0,.16)" />
      <path
        className="qa-scene-draw"
        d="M200 40 L182 165 L192 165 L197 110 L203 110 L208 165 L218 165 Z M188 100 L212 100 M184 130 L216 130"
        fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round"
      />
      <path className="qa-scene-fill" style={{ animationDelay: '.4s' }} d="M200 40 L182 165 L192 165 L197 110 L203 110 L208 165 L218 165 Z" fill="rgba(255,255,255,.85)" />
      <circle className="qa-scene-glow" cx="200" cy="42" r="3" fill="#ffe9b0" />
    </svg>
  );
}

function GenericScene() {
  return (
    <svg viewBox="0 0 400 220" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', inset: 0 }}>
      <circle className="qa-scene-rise" cx="200" cy="150" r="46" fill="#ffe9b0" opacity=".9" />
      <path className="qa-scene-draw" d="M0 190 Q80 140 160 185 T400 175 V220 H0 Z" fill="rgba(255,255,255,.14)" />
      <path className="qa-scene-draw" d="M0 205 Q100 170 220 200 T400 195 V220 H0 Z" fill="rgba(255,255,255,.22)" style={{ animationDelay: '.2s' }} />
    </svg>
  );
}

const SCENE_COMPONENTS = {
  dubai: BurjScene,
  kl: PetronasScene,
  japan: SakuraScene,
  istanbul: IstanbulScene,
  paris: ParisScene,
  default: GenericScene,
};

export default function DestinationShowcase({ destinationName, lang = 'ar' }) {
  const [renderedKey, setRenderedKey] = useState(detectScene(destinationName));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const nextKey = detectScene(destinationName);
    if (nextKey === renderedKey) return;
    setVisible(false);
    const t = setTimeout(() => {
      setRenderedKey(nextKey);
      setVisible(true);
    }, 260);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationName]);

  const scene = SCENES[renderedKey] || SCENES.default;
  const Scene = SCENE_COMPONENTS[renderedKey] || GenericScene;
  const label = lang === 'en' ? scene.label_en : scene.label_ar;

  return (
    <div
      className="qa-showcase"
      style={{ '--c1': scene.colors[0], '--c2': scene.colors[1], '--c3': scene.colors[2] }}
    >
      <div className="qa-showcase-bg" />
      <div key={renderedKey} className={`qa-showcase-scene${visible ? ' qa-showcase-scene-in' : ' qa-showcase-scene-out'}`}>
        <Scene />
      </div>
      {label ? <span className="qa-showcase-label">{label}</span> : null}

      <style jsx>{`
        .qa-showcase {
          position: relative; width: 100%; height: clamp(200px, 30vw, 320px);
          border-radius: 24px; overflow: hidden; isolation: isolate;
        }
        .qa-showcase-bg {
          position: absolute; inset: 0;
          background: linear-gradient(165deg, var(--c1) 0%, var(--c2) 55%, var(--c3) 100%);
          transition: background 1.1s ease;
        }
        .qa-showcase-scene {
          position: absolute; inset: 0;
          transition: opacity .3s ease, transform .4s ease;
        }
        .qa-showcase-scene-in { opacity: 1; transform: translateY(0); }
        .qa-showcase-scene-out { opacity: 0; transform: translateY(8px); }
        .qa-showcase-label {
          position: absolute; bottom: 16px; insetInlineStart: 20px; color: #fff; font-weight: 800; font-size: 18px;
          text-shadow: 0 2px 10px rgba(0,0,0,.35);
        }

        .qa-scene-draw { stroke-dasharray: 420; stroke-dashoffset: 420; animation: qa-draw 1.1s ease forwards; }
        .qa-scene-fill { opacity: 0; animation: qa-fadein .7s ease forwards; animation-delay: .5s; }
        .qa-scene-rise { opacity: 0; transform: translateY(16px); animation: qa-rise .8s ease forwards; }
        .qa-scene-glow { opacity: 0; animation: qa-pulse 1.8s ease-in-out infinite; animation-delay: 1s; }
        .qa-scene-tower-l, .qa-scene-tower-r { transform: scaleY(0); animation: qa-tower .7s cubic-bezier(.22,1,.36,1) forwards; }
        .qa-scene-tower-r { animation-delay: .18s; }
        .qa-scene-bridge { opacity: 0; animation: qa-fadein .5s ease forwards; animation-delay: .9s; }
        .qa-scene-petal { opacity: 0; animation: qa-fall linear infinite; }

        @keyframes qa-draw { to { stroke-dashoffset: 0; } }
        @keyframes qa-fadein { to { opacity: 1; } }
        @keyframes qa-rise { to { opacity: 1; transform: translateY(0); } }
        @keyframes qa-pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
        @keyframes qa-tower { to { transform: scaleY(1); } }
        @keyframes qa-fall {
          0% { opacity: 0; transform: translate(0, 0) rotate(0deg); }
          8% { opacity: .9; }
          100% { opacity: 0; transform: translate(24px, 240px) rotate(200deg); }
        }
      `}</style>
    </div>
  );
}
