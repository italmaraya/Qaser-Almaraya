'use client';
import React from 'react';

/*
 * Hand-drawn two-tone icon set for the "company goals" cards.
 * Shared grid: 32×32 viewBox, 1.8 stroke, round caps/joins.
 * Strokes use currentColor; soft fills are currentColor at low opacity,
 * so the same icon works on the cyan and the gold badges.
 */

const SW = 1.8;
const SOFT = 0.16;

function Base({ size, label, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={SW}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      style={{ display: 'block', flex: 'none' }}
    >
      {children}
    </svg>
  );
}

/* small plane glyph used by several icons, drawn pointing up-right, centred at 0,0 */
const PLANE_UR =
  'M6.2-6.2c.9-.9 2.2-.9 2.4-.4.5.2.5 1.5-.4 2.4L5.4-1.4l1.3 6.1-1.5 1.5-2.7-4.9-2.6 2.6.3 2.2-1.1 1.1-1.7-2.9-2.9-1.7 1.1-1.1 2.2.3 2.6-2.6-4.9-2.7 1.5-1.5 6.1 1.3Z';

/* 1 — خدمات سياحية متكاملة: rolling suitcase with a departing plane */
export function GoalServices({ size = 32, label = 'خدمات سياحية متكاملة' }) {
  return (
    <Base size={size} label={label}>
      {/* suitcase body */}
      <rect x="3.5" y="13" width="17" height="14.5" rx="3" fill="currentColor" fillOpacity={SOFT} />
      {/* telescopic handle */}
      <path d="M8 13V9.8A2.3 2.3 0 0 1 10.3 7.5h3.4A2.3 2.3 0 0 1 16 9.8V13" />
      {/* strap + wheels */}
      <path d="M12 13v14.5" strokeOpacity={0.5} />
      <path d="M7.5 27.5v2M16.5 27.5v2" />
      {/* plane taking off */}
      <g transform="translate(24.4 7.4) scale(.8)">
        <path d={PLANE_UR} fill="currentColor" fillOpacity={0.9} stroke="none" />
      </g>
      {/* trail */}
      <path d="M18.3 13.4 20.9 10.8" strokeDasharray="1.2 2.1" strokeOpacity={0.7} />
    </Base>
  );
}

/* 2 — رضا العملاء وبناء الثقة: traveller with a heart badge */
export function GoalTrust({ size = 32, label = 'رضا العملاء وبناء الثقة' }) {
  return (
    <Base size={size} label={label}>
      {/* head */}
      <circle cx="13" cy="9.5" r="5" fill="currentColor" fillOpacity={SOFT} />
      {/* shoulders, open on the right to make room for the heart */}
      <path d="M3.5 27.5c0-5.8 4.1-9.5 9.5-9.5 1.5 0 2.9.3 4.1.8" />
      {/* heart */}
      <path
        d="M23.2 29.2 18.1 24a3.3 3.3 0 0 1 0-4.6 3.1 3.1 0 0 1 4.5 0l.6.6.6-.6a3.1 3.1 0 0 1 4.5 0 3.3 3.3 0 0 1 0 4.6Z"
        fill="currentColor"
        fillOpacity={SOFT}
      />
    </Base>
  );
}

/* 3 — توسع محلي ودولي: globe with a plane on an outbound orbit */
export function GoalExpansion({ size = 32, label = 'توسع محلي ودولي' }) {
  return (
    <Base size={size} label={label}>
      <circle cx="13" cy="18.5" r="10" fill="currentColor" fillOpacity={SOFT} />
      {/* meridian + equator */}
      <ellipse cx="13" cy="18.5" rx="4.2" ry="10" strokeOpacity={0.6} />
      <path d="M3 18.5h20" strokeOpacity={0.6} />
      {/* orbit */}
      <path d="M23.4 27.4A13.6 13.6 0 0 0 25.4 11.8" strokeDasharray="1.8 2.4" strokeOpacity={0.8} />
      {/* plane */}
      <g transform="translate(26.2 6.8) scale(.8)">
        <path d={PLANE_UR} fill="currentColor" fillOpacity={0.9} stroke="none" />
      </g>
    </Base>
  );
}

/* 4 — الابتكار والتطوير التقني: phone running a booking app, with a confirmed check */
export function GoalTech({ size = 32, label = 'الابتكار والتطوير التقني' }) {
  return (
    <Base size={size} label={label}>
      {/* screen soft fill */}
      <rect x="7" y="3" width="14" height="26" rx="3" fill="currentColor" fillOpacity={SOFT} stroke="none" />
      {/* phone outline, broken where the check badge sits */}
      <path d="M15.5 29H10a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v9.5" />
      {/* speaker */}
      <path d="M12 6.5h4" strokeOpacity={0.7} />
      {/* plane on screen */}
      <g transform="translate(14 14.5) scale(.62)">
        <path d={PLANE_UR} fill="currentColor" fillOpacity={0.9} stroke="none" />
      </g>
      {/* check badge */}
      <circle cx="23.5" cy="23.5" r="6" fill="currentColor" fillOpacity={SOFT} />
      <path d="m20.8 23.6 1.9 1.9 3.9-3.9" />
    </Base>
  );
}

/* 5 — ترويج السياحة المحلية: Taq Kasra, the Arch of Ctesiphon near Baghdad */
export function GoalHeritage({ size = 32, label = 'ترويج السياحة المحلية' }) {
  return (
    <Base size={size} label={label}>
      {/* façade with the great arch cut out */}
      <path
        d="M3.5 28.5V15.5H7V7.5h18v8h3.5v13Z M10.5 28.5V15a5.5 5.5 0 0 1 11 0v13.5Z"
        fill="currentColor"
        fillOpacity={SOFT}
        fillRule="evenodd"
      />
      {/* blind arches on the shoulder wings */}
      <path d="M4.1 22v-2.2a1.15 1.15 0 0 1 2.3 0V22M25.6 22v-2.2a1.15 1.15 0 0 1 2.3 0V22" strokeOpacity={0.6} />
      {/* ground */}
      <path d="M1.5 28.5h29" strokeOpacity={0.6} />
    </Base>
  );
}

/* 6 — توفير تجربة سفر آمنة: shield with a check */
export function GoalSafety({ size = 32, label = 'توفير تجربة سفر آمنة' }) {
  return (
    <Base size={size} label={label}>
      <path
        d="M16 3.5 5.5 7.3v8.2c0 6.4 4.4 11.1 10.5 13 6.1-1.9 10.5-6.6 10.5-13V7.3Z"
        fill="currentColor"
        fillOpacity={SOFT}
      />
      <path d="m11.3 16.4 3.2 3.2 6.3-6.3" />
    </Base>
  );
}
