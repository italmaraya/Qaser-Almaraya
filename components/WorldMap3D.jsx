'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GRID_STEP, GRID_TOP, LAND_ROWS } from '../lib/geoData';

// Flat world map drawn in perspective (a tilted plane), with one landmark
// standing on every country we serve and flight lines fanning out of Baghdad.
// Pure SVG: no WebGL, no three.js, no per-frame work — so phones stay smooth.
// Artwork: Microsoft Fluent Emoji 3D (MIT) in /public/landmarks.

// One landmark per country. Where an emoji for the real monument does not
// exist, the closest matching scene is used (a fort for Nizwa, a desert for
// the pyramids, a lattice tower for the Eiffel).
export const LANDMARKS = {
  ae: 'cityscape',               // Burj Khalifa skyline
  bh: 'stadium',                 // Bahrain International Circuit
  cn: 'japanese_castle',         // pagoda
  eg: 'desert',                  // the pyramids
  fr: 'tokyo_tower',             // lattice tower
  gb: 'bridge_at_night',         // Tower Bridge
  ge: 'snow_capped_mountain',    // the Caucasus
  id: 'palm_tree',               // Bali
  iq: 'mosque',
  it: 'classical_building',      // the Colosseum
  jo: 'mountain',                // Petra
  kh: 'hindu_temple',            // Angkor Wat
  lb: 'sunrise_over_mountains',  // the Cedars
  lk: 'national_park',
  ma: 'houses',                  // the medina
  mv: 'desert_island',
  my: 'office_building',         // Petronas Towers
  om: 'castle',                  // Nizwa Fort
  qa: 'cityscape_at_dusk',       // Doha skyline
  sa: 'kaaba',
  sg: 'ferris_wheel',            // Singapore Flyer
  th: 'hindu_temple',
  tn: 'beach_with_umbrella',     // Hammamet
  tr: 'mosque',                  // Hagia Sophia
  us: 'statue_of_liberty',
};

const GULF = ['kw', 'ye', 'sy', 'ps', 'ly', 'dz', 'sd', 'mr'];
const EUROPE = ['es', 'de', 'nl', 'at', 'ch', 'cz', 'hu', 'gr', 'pt', 'be', 'pl', 'ro', 'rs', 'ba', 'al', 'hr', 'se', 'no', 'dk', 'fi', 'ie', 'ua', 'by', 'bg', 'sk', 'si', 'cy', 'mt'];
const ASIA = ['in', 'pk', 'bd', 'np', 'lk', 'vn', 'ph', 'kr', 'jp', 'kz', 'uz', 'az', 'am', 'ir', 'mm', 'la', 'bn', 'tw', 'hk', 'mo'];

export function landmarkFor(iso) {
  const k = String(iso || '').toLowerCase();
  if (LANDMARKS[k]) return LANDMARKS[k];
  if (GULF.includes(k)) return 'mosque';
  if (EUROPE.includes(k)) return 'classical_building';
  if (ASIA.includes(k)) return 'hindu_temple';
  return 'cityscape';
}

const TILT = (57 * Math.PI) / 180;
const SIN = Math.sin(TILT);
const COS = Math.cos(TILT);
const VW = 1000; // viewBox width units

// Build the projection for a crop of the world (degrees).
function makeProjection(crop) {
  const lngSpan = crop.e - crop.w;
  const latSpan = crop.n - crop.s;
  const H0 = (VW * latSpan) / lngSpan; // plane depth before the tilt
  const d = H0 * 1.45; // camera distance: more depth, still readable
  return {
    H0,
    project(lat, lng) {
      const u = (lng - crop.w) / lngSpan;
      const v = (crop.n - lat) / latSpan;
      const s = d / (d + (0.5 - v) * H0 * SIN);
      return { x: VW / 2 + (u - 0.5) * VW * s, y: (v - 0.5) * H0 * COS * s, s };
    },
  };
}

export default function WorldMap3D({
  pins = [],
  origin = { lat: 33.31, lng: 44.36 },
  onSelectPin,
  lang = 'ar',
  height = 420,
  originLabel,
}) {
  const en = lang === 'en';
  const [hover, setHover] = useState(null);
  const [narrow, setNarrow] = useState(false);
  const scrollRef = useRef(null);
  const centred = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 820px)');
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const art = useMemo(() => {
    const lats = [origin.lat, ...pins.map((p) => p.lat)];
    const lngs = [origin.lng, ...pins.map((p) => p.lng)];
    // Crop around the points, then widen to a 2.3:1 frame so the map reads as a map.
    const LAT_TOP = 78, LAT_BOTTOM = -56;
    let w = Math.min(...lngs) - 16, e = Math.max(...lngs) + 16;
    let s = Math.max(Math.min(...lats) - 14, LAT_BOTTOM);
    let n = Math.min(Math.max(...lats) + 20, LAT_TOP);
    const wantRatio = 2.3;
    if ((e - w) / (n - s) < wantRatio) {
      const need = (n - s) * wantRatio - (e - w);
      w -= need / 2; e += need / 2;
    } else {
      // Give the frame more latitude if there is room, never past the poles.
      let need = (e - w) / wantRatio - (n - s);
      const up = Math.min(need / 2, LAT_TOP - n);
      n += up; need -= up;
      s = Math.max(s - need, LAT_BOTTOM);
    }
    const crop = { w, e, s, n };
    const proj = makeProjection(crop);

    // Land, as round dots grouped into depth bands so far rows draw smaller.
    const BANDS = 7;
    const bands = Array.from({ length: BANDS }, () => ({ d: '', s: 0, n: 0 }));
    LAND_ROWS.forEach((row, ri) => {
      if (!row) return;
      const lat = GRID_TOP - ri * GRID_STEP;
      if (lat < crop.s - 1 || lat > crop.n + 1) return;
      const parts = row.split(',').map(Number);
      const v = (crop.n - lat) / (crop.n - crop.s);
      const bi = Math.min(BANDS - 1, Math.max(0, Math.floor(v * BANDS)));
      for (let k = 0; k < parts.length; k += 2) {
        for (let c = parts[k]; c < parts[k] + parts[k + 1]; c++) {
          const lng = -180 + GRID_STEP / 2 + c * GRID_STEP;
          if (lng < crop.w - 1 || lng > crop.e + 1) continue;
          const q = proj.project(lat, lng);
          bands[bi].d += 'M' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) + 'h.01';
          bands[bi].s += q.s;
          bands[bi].n += 1;
        }
      }
    });
    const dotBands = bands
      .filter((b) => b.n > 0)
      .map((b) => ({ d: b.d, w: Math.max(2.1, 4.6 * (b.s / b.n)) }));

    const home = proj.project(origin.lat, origin.lng);
    const base = narrow ? 56 : 38;
    const points = pins
      .map((p) => {
        const q = proj.project(p.lat, p.lng);
        const size = Math.max(base * 0.6, Math.min(base * 1.3, base * q.s));
        // ax/ay is where the landmark stands; it drifts off its exact spot only
        // when two countries would otherwise sit on top of each other.
        return { p, ...q, ax: q.x, ay: q.y, size, art: landmarkFor(p.iso) };
      })
      .sort((a, b) => a.y - b.y); // far first, so near landmarks overlap them

    // Push crowded landmarks apart (the Gulf would be one pile otherwise).
    // Baghdad is an obstacle that never moves: nothing may cover home.
    const HOME_R = 58;
    for (let it = 0; it < 40; it++) {
      points.forEach((pt) => {
        let dx = pt.ax - home.x, dy = (pt.ay - home.y) * 1.25;
        const dist = Math.hypot(dx, dy) || 0.01;
        const min = HOME_R + pt.size * 0.5;
        if (dist < min) {
          pt.ax += (dx / dist) * (min - dist);
          pt.ay += ((dy / dist) * (min - dist)) / 1.25;
        }
      });
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i], b = points[j];
          const min = (a.size + b.size) * 0.66;
          let dx = b.ax - a.ax, dy = (b.ay - a.ay) * 1.25;
          let dist = Math.hypot(dx, dy);
          if (dist > min || dist === 0) continue;
          const push = (min - dist) / 2;
          dx /= dist; dy /= dist;
          a.ax -= dx * push; a.ay -= (dy * push) / 1.25;
          b.ax += dx * push; b.ay += (dy * push) / 1.25;
        }
      }
      // Never drift too far from the real country.
      points.forEach((pt) => {
        const dx = pt.ax - pt.x, dy = pt.ay - pt.y;
        const max = pt.size * 2.6;
        const d = Math.hypot(dx, dy);
        if (d > max) { pt.ax = pt.x + (dx / d) * max; pt.ay = pt.y + (dy / d) * max; }
      });
    }
    points.sort((a, b) => a.ay - b.ay);

    const arcs = points.map(({ x, y, s }) => {
      const dx = x - home.x, dy = y - home.y;
      const len = Math.hypot(dx, dy) || 1;
      const lift = Math.min(len * 0.26, 120) + 14;
      return {
        d: 'M' + home.x.toFixed(1) + ' ' + home.y.toFixed(1) +
           ' Q' + (home.x + dx / 2).toFixed(1) + ' ' + (home.y + dy / 2 - lift).toFixed(1) +
           ' ' + x.toFixed(1) + ' ' + y.toFixed(1),
        w: Math.max(1, 1.8 * s),
      };
    });

    // Keep labels readable: drop one when it would sit on top of another.
    const ranked = [...points].sort(
      (a, b) => (b.p.visas || 0) + (b.p.packages || 0) - ((a.p.visas || 0) + (a.p.packages || 0))
    );
    const kept = [];
    ranked.forEach((pt) => {
      if (kept.every((k) => Math.hypot(k.ax - pt.ax, (k.ay - pt.ay) * 1.4) > (narrow ? 64 : 58))) kept.push(pt);
    });
    const labelled = new Set(kept.map((k) => k.p.iso));

    // Frame: everything that is drawn, plus headroom for the tallest landmark.
    const ys = [home.y - 70, ...points.map((q) => q.ay - q.size * 1.1), ...points.map((q) => q.y)];
    const top = Math.min(...ys) - 18;
    const bottom = Math.max(home.y, ...points.map((q) => Math.max(q.ay, q.y))) + 42;
    const xs = [home.x, ...points.flatMap((q) => [q.ax - q.size * 0.9, q.ax + q.size * 0.9, q.x])];
    const left = Math.min(0, Math.min(...xs) - 6);
    const right = Math.max(VW, Math.max(...xs) + 6);
    const frame = { x: left, y: top, w: right - left, h: bottom - top };
    return {
      proj, crop, dotBands, home, points, arcs, labelled, frame,
      viewBox: `${frame.x.toFixed(1)} ${frame.y.toFixed(1)} ${frame.w.toFixed(1)} ${frame.h.toFixed(1)}`,
    };
  }, [pins, origin.lat, origin.lng, narrow]);

  // Start the phone view on Baghdad, wherever it falls in the wide map.
  useEffect(() => {
    const el = scrollRef.current;
    if (!narrow || !el || centred.current || !art) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    centred.current = true;
    const fromLeft = ((art.home.x - art.frame.x) / art.frame.w) * el.scrollWidth - el.clientWidth / 2;
    const want = Math.max(0, Math.min(max, fromLeft));
    // In a right-to-left box, scrollLeft runs from -max (far left) up to 0.
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.scrollLeft = rtl ? want - max : want;
  }, [narrow, art]);

  if (!pins.length) return null;

  const { dotBands, home, points, arcs, labelled, viewBox, frame } = art;
  const homeText = originLabel || (en ? 'Baghdad' : 'بغداد');

  // On phones the map keeps its real width and the box scrolls sideways, so the
  // landmarks stay big instead of being squeezed into a thin strip.
  const svg = (
    <svg
      className="qa-wmap"
      viewBox={viewBox}
      style={narrow
        ? { display: 'block', width: frame.w * (height / frame.h), height, flex: 'none' }
        : { display: 'block', width: '100%', height: 'auto', maxHeight: height * 1.25 }}
      role="img"
      aria-label={en ? 'Flight map from Baghdad to our destinations' : 'خريطة الرحلات من بغداد إلى وجهاتنا'}
    >
      <defs>
        <radialGradient id="qa-wmap-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1d7c99" stopOpacity=".55" />
          <stop offset="100%" stopColor="#062433" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx={VW / 2} cy={home.y} rx={VW * 0.62} ry={Math.abs(home.y) + 220} fill="url(#qa-wmap-glow)" />

      {dotBands.map((b, i) => (
        <path key={i} d={b.d} stroke="#4e93ab" strokeWidth={b.w} strokeLinecap="round" fill="none" opacity={0.42 + i * 0.06} />
      ))}

      {arcs.map((a, i) => (
        <path
          key={i}
          className="qa-wmap-arc"
          d={a.d}
          fill="none"
          stroke="#55d8f5"
          strokeWidth={a.w}
          strokeLinecap="round"
          strokeDasharray="7 9"
          opacity=".75"
          style={{ animationDelay: (i % 7) * 0.4 + 's' }}
        />
      ))}

      {/* Landmarks */}
      {points.map(({ p, x, y, ax, ay, size, art: file }) => {
        const on = hover === p.iso;
        return (
          <g
            key={p.iso}
            className="qa-wmap-pin"
            onClick={() => onSelectPin && onSelectPin(p)}
            onMouseEnter={() => setHover(p.iso)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: onSelectPin ? 'pointer' : 'default' }}
            role={onSelectPin ? 'button' : undefined}
            tabIndex={onSelectPin ? 0 : undefined}
            onKeyDown={(e) => { if (onSelectPin && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelectPin(p); } }}
          >
            <title>{p.name}</title>
            <circle cx={x} cy={y} r="2.6" fill="#8fe6ff" />
            {Math.hypot(ax - x, ay - y) > 4 && (
              <line x1={x} y1={y} x2={ax} y2={ay} stroke="#8fe6ff" strokeWidth="1" opacity=".5" />
            )}
            <ellipse cx={ax} cy={ay} rx={size * 0.3} ry={size * 0.1} fill="#01151d" opacity=".4" />
            <image
              href={'/landmarks/' + file + '.webp'}
              x={ax - size / 2}
              y={ay - size * (on ? 1.04 : 0.96)}
              width={size}
              height={size}
              loading="lazy"
              style={{ transition: 'y .18s ease' }}
            />
            <circle cx={ax} cy={ay - size * 0.45} r={Math.max(18, size * 0.5)} fill="transparent" />
            {(labelled.has(p.iso) || on) && (
              <text
                x={ax}
                y={ay + 15}
                textAnchor="middle"
                fontSize={on ? 14 : 12.5}
                fontWeight="700"
                fill="#fff"
                stroke="#062433"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {p.name}
              </text>
            )}
          </g>
        );
      })}

      {/* Baghdad — always drawn last so home stays readable */}
      <g>
        <ellipse cx={home.x} cy={home.y} rx="18" ry="6" fill="#01151d" opacity=".45" />
        <image href="/landmarks/mosque.webp" x={home.x - 32} y={home.y - 64} width="64" height="64" />
        <circle className="qa-wmap-home-ring" cx={home.x} cy={home.y} r="9" fill="none" stroke="#faab18" strokeWidth="2.4" />
        <circle cx={home.x} cy={home.y} r="5.5" fill="#faab18" stroke="#fff" strokeWidth="1.8" />
        <text x={home.x} y={home.y + 24} textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff" stroke="#062433" strokeWidth="3.8" paintOrder="stroke">{homeText}</text>
      </g>
    </svg>
  );

  if (!narrow) return svg;
  return (
    <div
      className="qa-wmap-scroll"
      ref={scrollRef}
      style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', display: 'flex' }}
    >
      {svg}
    </div>
  );
}
