'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import createGlobe from 'cobe';

// A light dotted globe for the destination guide (Owner, 8 Nov 2026: "a globe
// like rahal"). cobe draws the dots in WebGL (≈6 KB); the pins are ordinary
// links laid over the canvas, so they can be tapped, focused and read by
// screen readers, and they open that country's guide. The globe turns slowly,
// can be dragged, and a hovered card turns it to that country. If WebGL is not
// available the globe hides itself and the country cards below do the job.

// Guide city of each country (lat, lng).
export const GUIDE_COORDS = {
  tr: [41.01, 28.98], tn: [36.81, 10.18], om: [23.59, 58.38], eg: [27.92, 34.33], my: [3.14, 101.69],
  mv: [4.18, 73.51], id: [-8.34, 115.09], th: [13.76, 100.5], sg: [1.35, 103.82], lb: [33.89, 35.5],
  ae: [25.2, 55.27], jo: [31.95, 35.91], bh: [26.23, 50.59], sa: [21.39, 39.86], cn: [23.13, 113.26],
  ma: [31.63, -7.99], us: [40.71, -74.01], it: [41.9, 12.5], gb: [51.51, -0.13], ge: [41.72, 44.83],
  lk: [6.93, 79.86], fr: [48.86, 2.35], qa: [25.29, 51.53], kh: [13.36, 103.86],
};
const BAGHDAD = [33.31, 44.37];

const rad = (d) => (d * Math.PI) / 180;
// Same sphere point cobe uses for a marker.
function toVec([lat, lng]) {
  const r = rad(lat);
  const a = rad(lng) - Math.PI;
  const c = Math.cos(r);
  return [-c * Math.cos(a), Math.sin(r), c * Math.sin(a)];
}
// Rotate like cobe's shader (phi around the vertical axis, then theta).
function project(v, phi, theta) {
  const [x, y, z] = v;
  const cp = Math.cos(phi), sp = Math.sin(phi), ct = Math.cos(theta), st = Math.sin(theta);
  const x1 = cp * x + sp * z;
  const z1 = -sp * x + cp * z;
  const y2 = ct * y - st * z1;
  const z2 = st * y + ct * z1;
  return [x1, y2, z2];
}
// phi that brings a longitude to the front.
const phiFor = (lng) => Math.PI - (rad(lng) - Math.PI / 2);

export default function GuideGlobe({ countries, lang = 'ar', focus = null }) {
  const en = lang === 'en';
  const canvasRef = useRef(null);
  const boxRef = useRef(null);
  const pinsRef = useRef({});
  const state = useRef({ phi: phiFor(BAGHDAD[1]), theta: 0.28, target: null, drag: null, vel: 0.0032, size: 0 });
  const [ok, setOk] = useState(true);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    if (focus && GUIDE_COORDS[focus]) state.current.target = phiFor(GUIDE_COORDS[focus][1]);
  }, [focus]);

  const isoKey = countries.map((c) => c.iso).join(',');
  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return undefined;
    let globe = null;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const measure = () => {
      state.current.size = box.offsetWidth;
      canvas.width = state.current.size * dpr;
      canvas.height = state.current.size * dpr;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: state.current.size * dpr,
        height: state.current.size * dpr,
        phi: state.current.phi,
        theta: state.current.theta,
        dark: 0,
        diffuse: 3,
        mapSamples: 16000,
        mapBrightness: 6,
        mapBaseBrightness: 0.04,
        baseColor: [0.55, 0.85, 0.95],   // light sky, like the Instagram posts
        markerColor: [0.98, 0.67, 0.09],
        glowColor: [0.86, 0.95, 1],
        opacity: 0.95,
        markers: [],   // the pins are HTML links laid over the canvas
        onRender: (s) => {
          const st = state.current;
          if (st.target != null) {
            // shortest turn to the target longitude
            let d = ((st.target - st.phi + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
            st.phi += d * 0.08;
            if (Math.abs(d) < 0.002) st.target = null;
          } else if (!st.drag && !reduce) st.phi += st.vel;
          s.phi = st.phi;
          s.theta = st.theta;
          s.width = st.size * dpr;
          s.height = st.size * dpr;
          // move the HTML pins with the globe
          const R = st.size / 2;
          for (const iso in pinsRef.current) {
            const el = pinsRef.current[iso];
            const ll = iso === 'home' ? BAGHDAD : GUIDE_COORDS[iso];
            if (!el || !ll) continue;
            const [x, y, z] = project(toVec(ll), st.phi, st.theta);
            const vis = z > 0.12;
            el.style.transform = `translate(${R + x * R * 0.8}px, ${R - y * R * 0.8}px)`;
            el.style.opacity = vis ? String(Math.min(1, z * 2)) : '0';
            el.style.pointerEvents = vis ? 'auto' : 'none';
            el.tabIndex = vis ? 0 : -1;
          }
        },
      });
      requestAnimationFrame(() => { canvas.style.opacity = '1'; });
    } catch (e) {
      setOk(false);
    }
    return () => { ro.disconnect(); if (globe) globe.destroy(); };
  }, [isoKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const down = (e) => { state.current.drag = { x: e.clientX, phi: state.current.phi }; state.current.target = null; };
  const move = (e) => {
    const d = state.current.drag;
    if (!d) return;
    state.current.phi = d.phi + (e.clientX - d.x) / 160;
  };
  const up = () => { state.current.drag = null; };

  if (!ok) return null;
  return (
    <div className="qs-globe" data-no-i18n="">
      <div className="qs-globe-box" ref={boxRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}>
        <canvas ref={canvasRef} className="qs-globe-canvas" aria-hidden="true" />
        <span className="qs-globe-pin home" ref={(el) => { pinsRef.current.home = el; }} aria-hidden="true">
          <i /><b>{en ? 'Baghdad' : 'بغداد'}</b>
        </span>
        {countries.filter((c) => GUIDE_COORDS[c.iso]).map((c) => (
          <Link
            key={c.iso}
            href={'/guide/' + c.iso}
            className={'qs-globe-pin' + (hover === c.iso || focus === c.iso ? ' on' : '')}
            ref={(el) => { pinsRef.current[c.iso] = el; }}
            onMouseEnter={() => setHover(c.iso)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(c.iso)}
            onBlur={() => setHover(null)}
            aria-label={(en ? 'Travel guide: ' : 'دليل السفر إلى ') + (en ? c.en : c.ar)}
          >
            <i /><b>{en ? c.en : c.ar}</b>
          </Link>
        ))}
      </div>
      <p className="qs-globe-hint">{en ? 'Drag the globe, then tap a pin to open its guide.' : 'حرّك الكرة واضغط على أي دبوس لفتح دليل الدولة.'}</p>
    </div>
  );
}
