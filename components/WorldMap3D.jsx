'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { GRID_STEP, GRID_TOP, LAND_ROWS } from '../lib/geoData';
import { WORLD_SHAPES } from '../lib/worldShapes';

// Night map of the world: real country outlines drawn in gold light over a dark
// sea, city-light speckle inside the land, and still flight lines running from
// Baghdad to every country we serve. Borders are Natural Earth 110m (public
// domain) in lib/worldShapes.js; the speckle reuses the land grid in
// lib/geoData.js. Everything is plain SVG and nothing moves, so phones stay
// smooth — there is no WebGL and no per-frame work anywhere on this page.

const TILT = (54 * Math.PI) / 180;
const SIN = Math.sin(TILT);
const COS = Math.cos(TILT);
const VW = 1000; // viewBox width units

function makeProjection(crop) {
  const lngSpan = crop.e - crop.w;
  const latSpan = crop.n - crop.s;
  const H0 = (VW * latSpan) / lngSpan;
  const d = H0 * 1.6;
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
  const scrollRef = useRef(null);
  const centred = useRef(false);
  const [boxW, setBoxW] = useState(0);
  const uid = useId();

  // What matters is the width of the box the map sits in, not the window:
  // on the packages page the map shares the row with a text column.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setBoxW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setBoxW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // A narrow box pans sideways instead of squeezing the map into a thin strip.
  const narrow = boxW > 0 && boxW < 900;

  const art = useMemo(() => {
    const lats = [origin.lat, ...pins.map((p) => p.lat)];
    const lngs = [origin.lng, ...pins.map((p) => p.lng)];
    const LAT_TOP = 78, LAT_BOTTOM = -56;
    let w = Math.min(...lngs) - 18, e = Math.max(...lngs) + 18;
    let s = Math.max(Math.min(...lats) - 16, LAT_BOTTOM);
    let n = Math.min(Math.max(...lats) + 20, LAT_TOP);
    const wantRatio = 2.3;
    if ((e - w) / (n - s) < wantRatio) {
      const need = (n - s) * wantRatio - (e - w);
      w -= need / 2; e += need / 2;
    } else {
      let need = (e - w) / wantRatio - (n - s);
      const up = Math.min(need / 2, LAT_TOP - n);
      n += up; need -= up;
      s = Math.max(s - need, LAT_BOTTOM);
    }
    const crop = { w, e, s, n };
    const proj = makeProjection(crop);

    // Country outlines, projected point by point.
    const served = new Set(pins.map((p) => String(p.iso || '').toLowerCase()));
    let landPath = '', servedPath = '', homePath = '';
    Object.entries(WORLD_SHAPES).forEach(([iso, c]) => {
      let d = '';
      c.p.split(';').forEach((ring) => {
        const nums = ring.split(' ');
        let inside = false;
        let seg = '';
        for (let i = 0; i < nums.length; i += 2) {
          const lng = +nums[i], lat = +nums[i + 1];
          if (lng > crop.w - 4 && lng < crop.e + 4 && lat > crop.s - 4 && lat < crop.n + 4) inside = true;
          const q = proj.project(lat, lng);
          seg += (i === 0 ? 'M' : 'L') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
        }
        if (inside) d += seg + 'Z';
      });
      if (!d) return;
      if (iso === 'iq') homePath += d;
      else if (served.has(iso)) servedPath += d;
      else landPath += d;
    });

    // City lights: the land grid as faint dots, in two depth bands.
    const near = [];
    const far = [];
    LAND_ROWS.forEach((row, ri) => {
      if (!row) return;
      const lat = GRID_TOP - ri * GRID_STEP;
      if (lat < crop.s || lat > crop.n) return;
      const parts = row.split(',').map(Number);
      for (let k = 0; k < parts.length; k += 2) {
        for (let c = parts[k]; c < parts[k] + parts[k + 1]; c++) {
          const lng = -180 + GRID_STEP / 2 + c * GRID_STEP;
          if (lng < crop.w || lng > crop.e) continue;
          // A deterministic nudge keeps the speckle from reading as a grid.
          const h = (c * 73856093) ^ (ri * 19349663);
          const jx = ((h & 255) / 255 - 0.5) * GRID_STEP * 0.9;
          const jy = (((h >> 8) & 255) / 255 - 0.5) * GRID_STEP * 0.9;
          const q = proj.project(lat + jy, lng + jx);
          (q.s >= 1 ? near : far).push('M' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) + 'h.01');
        }
      }
    });
    const lights = [
      { d: far.join(''), w: 1.2, o: 0.5 },
      { d: near.join(''), w: 1.8, o: 0.66 },
    ];

    const home = proj.project(origin.lat, origin.lng);
    const points = pins
      .map((p) => ({ p, ...proj.project(p.lat, p.lng) }))
      .sort((a, b) => a.y - b.y);

    const arcs = points.map(({ x, y, s }) => {
      const dx = x - home.x, dy = y - home.y;
      const len = Math.hypot(dx, dy) || 1;
      const lift = Math.min(len * 0.24, 110) + 10;
      return {
        d: 'M' + home.x.toFixed(1) + ' ' + home.y.toFixed(1) +
           ' Q' + (home.x + dx / 2).toFixed(1) + ' ' + (home.y + dy / 2 - lift).toFixed(1) +
           ' ' + x.toFixed(1) + ' ' + y.toFixed(1),
        w: Math.max(0.8, 1.3 * s),
      };
    });

    // Labels: drop one when it would sit on another.
    const ranked = [...points].sort(
      (a, b) => (b.p.visas || 0) + (b.p.packages || 0) - ((a.p.visas || 0) + (a.p.packages || 0))
    );
    const kept = [];
    ranked.forEach((pt) => {
      if (kept.every((k) => Math.hypot(k.x - pt.x, (k.y - pt.y) * 1.8) > 48)) kept.push(pt);
    });
    const labelled = new Set(kept.map((k) => k.p.iso));

    const ys = [home.y, ...points.map((q) => q.y)];
    const top = Math.min(...ys, 0) - 72;
    const bottom = Math.max(...ys) + 58;
    const frame = { x: 0, y: top, w: VW, h: bottom - top };
    return {
      proj, crop, landPath, servedPath, homePath, lights, home, points, arcs, labelled, frame,
      viewBox: `0 ${frame.y.toFixed(1)} ${VW} ${frame.h.toFixed(1)}`,
    };
  }, [pins, origin.lat, origin.lng]);

  // Start the phone view on Baghdad, wherever it falls in the wide map.
  useEffect(() => {
    const el = scrollRef.current;
    if (!narrow || !el || centred.current) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    centred.current = true;
    const fromLeft = (art.home.x / VW) * el.scrollWidth - el.clientWidth / 2;
    const want = Math.max(0, Math.min(max, fromLeft));
    // In a right-to-left box, scrollLeft runs from -max (far left) up to 0.
    el.scrollLeft = getComputedStyle(el).direction === 'rtl' ? want - max : want;
  }, [narrow, art, boxW]);

  if (!pins.length) return null;

  const { landPath, servedPath, homePath, lights, home, points, arcs, labelled, viewBox, frame } = art;
  const homeText = originLabel || (en ? 'Baghdad' : 'بغداد');
  const gold = 'url(#' + uid + '-gold)';

  const svg = (
    <svg
      className="qa-wmap"
      viewBox={viewBox}
      style={narrow
        ? { display: 'block', width: frame.w * (height / frame.h), height, flex: 'none' }
        : { display: 'block', width: '100%', height: 'auto', maxHeight: height * 1.3 }}
      role="img"
      aria-label={en ? 'Flight map from Baghdad to our destinations' : 'خريطة الرحلات من بغداد إلى وجهاتنا'}
    >
      <defs>
        <filter id={uid + '-gold'} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={uid + '-sea'} cx="50%" cy="58%" r="62%">
          <stop offset="0%" stopColor="#0c3550" />
          <stop offset="100%" stopColor="#041726" />
        </radialGradient>
      </defs>

      <rect x="0" y={frame.y} width={VW} height={frame.h} fill={`url(#${uid}-sea)`} />

      <g filter={gold}>
        <path d={landPath} fill="#06253c" stroke="#b98c38" strokeWidth=".65" strokeLinejoin="round" opacity=".7" />
        <path d={servedPath} fill="#0d4158" stroke="#ffc85e" strokeWidth="1.2" strokeLinejoin="round" />
        <path d={homePath} fill="#2a6476" stroke="#ffe3a6" strokeWidth="1.5" strokeLinejoin="round" />
      </g>

      {lights.map((l, i) => (
        <path key={i} d={l.d} stroke="#ffc05c" strokeWidth={l.w} strokeLinecap="round" fill="none" opacity={l.o} />
      ))}

      <g>
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill="none" stroke="#49e0d2" strokeWidth={a.w} strokeLinecap="round" opacity=".45" />
        ))}
      </g>

      {/* Destinations */}
      {points.map(({ p, x, y, s }) => {
        const on = hover === p.iso;
        const r = Math.max(2.6, 3.4 * s);
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
            <circle cx={x} cy={y} r={r * 3.4} fill="#49e0d2" opacity={on ? 0.3 : 0.16} />
            <circle cx={x} cy={y} r={r} fill="#aef7ef" stroke="#1b9f93" strokeWidth=".6" />
            <circle cx={x} cy={y} r={14} fill="transparent" />
            {(labelled.has(p.iso) || on) && (
              <text
                x={x}
                y={y - r * 2.6}
                textAnchor="middle"
                fontSize={on ? 13 : 11.5}
                fontWeight="700"
                fill="#eaf7ff"
                stroke="#041726"
                strokeWidth="2.6"
                paintOrder="stroke"
              >
                {p.name}
              </text>
            )}
          </g>
        );
      })}

      {/* Baghdad */}
      <g>
        <circle cx={home.x} cy={home.y} r="22" fill="#ffc24d" opacity=".18" />
        <circle cx={home.x} cy={home.y} r="11" fill="#ffc24d" opacity=".3" />
        <circle cx={home.x} cy={home.y} r="4.6" fill="#fff3d4" stroke="#faab18" strokeWidth="1.4" />
        <text x={home.x} y={home.y + 22} textAnchor="middle" fontSize="14.5" fontWeight="800" fill="#ffd98a" stroke="#041726" strokeWidth="3.2" paintOrder="stroke">{homeText}</text>
      </g>
    </svg>
  );

  return (
    <div
      className="qa-wmap-scroll"
      ref={scrollRef}
      style={narrow
        ? { overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', display: 'flex' }
        : { width: '100%' }}
    >
      {svg}
    </div>
  );
}
