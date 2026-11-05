import React from 'react';

// Side view of a modern twin-engine narrow-body airliner (A320/737 class),
// nose to the right, rendered with gradient shading so it reads as a photo-real
// cut-out at ~130 px wide. Static artwork only: the parent handles motion.

const FUSELAGE =
  'M22 52C25 47.5 38 44.6 58 44H190C216 44 240 48 251 59C247 65 233 68 212 68H108C78 68 44 58 22 52Z';

// Cabin window x positions, with gaps left for the rear door and over-wing exits.
const WINDOWS = Array.from({ length: 31 }, (_, i) => 68 + i * 4.4).filter(
  (x) => x < 123 || x > 137
);

export default function FlyingPlaneArt({ width = 120, ...props }) {
  const height = width * (110 / 260);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 260 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      {...props}
    >
      <defs>
        {/* fuselage: top highlight, soft mid tone, belly shadow with reflected light */}
        <linearGradient id="qafp-body" x1="0" y1="44" x2="0" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#dfe7ec" />
          <stop offset="0.13" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#f3f6f8" />
          <stop offset="0.7" stopColor="#dbe3e8" />
          <stop offset="0.9" stopColor="#aebdc7" />
          <stop offset="1" stopColor="#c2ced6" />
        </linearGradient>
        <linearGradient id="qafp-radome" x1="0" y1="46" x2="0" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#eef2f5" />
          <stop offset="1" stopColor="#b9c6ce" />
        </linearGradient>
        <linearGradient id="qafp-fin" x1="0" y1="7" x2="0" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#35c2e2" />
          <stop offset="0.5" stopColor="#049dc5" />
          <stop offset="1" stopColor="#0380a4" />
        </linearGradient>
        <linearGradient id="qafp-stab" x1="0" y1="56" x2="0" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#d6dfe5" />
          <stop offset="1" stopColor="#9fb0bb" />
        </linearGradient>
        <linearGradient id="qafp-wing" x1="162" y1="66" x2="94" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9eafba" />
          <stop offset="0.35" stopColor="#bac8d1" />
          <stop offset="1" stopColor="#d8e1e7" />
        </linearGradient>
        <linearGradient id="qafp-nac" x1="0" y1="73" x2="0" y2="89" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#9fb0ba" />
          <stop offset="0.3" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#dde5ea" />
          <stop offset="0.88" stopColor="#8a9ca7" />
          <stop offset="1" stopColor="#a7b7c1" />
        </linearGradient>
        <linearGradient id="qafp-lip" x1="0" y1="73" x2="0" y2="89" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8e9fa9" />
          <stop offset="0.35" stopColor="#f8fafb" />
          <stop offset="1" stopColor="#6f8290" />
        </linearGradient>
        <linearGradient id="qafp-intake" x1="0" y1="74" x2="0" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2f4754" />
          <stop offset="1" stopColor="#08161d" />
        </linearGradient>
        <linearGradient id="qafp-exh" x1="0" y1="77" x2="0" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8d9ca5" />
          <stop offset="0.5" stopColor="#5a6a74" />
          <stop offset="1" stopColor="#3b4a53" />
        </linearGradient>
        <linearGradient id="qafp-glass" x1="0" y1="48" x2="0" y2="57" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4d6b7a" />
          <stop offset="0.5" stopColor="#163340" />
          <stop offset="1" stopColor="#0a2230" />
        </linearGradient>
        <clipPath id="qafp-clip">
          <path d={FUSELAGE} />
        </clipPath>
        <clipPath id="qafp-finclip">
          <path d="M88 44L56.5 8.5C55 6.6 49 6.6 47.5 8.5L53 44Z" />
        </clipPath>
        <filter id="qafp-shadow" x="-8%" y="-15%" width="116%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.2" floodColor="#012a37" floodOpacity="0.22" />
        </filter>
        <filter id="qafp-blur" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>

      <g filter="url(#qafp-shadow)">
        {/* vertical stabiliser with rudder line, amber trailing stripe, dorsal fillet */}
        <path d="M88 44L56.5 8.5C55 6.6 49 6.6 47.5 8.5L53 44Z" fill="url(#qafp-fin)" />
        <g clipPath="url(#qafp-finclip)">
          <path d="M51.5 6L57.5 44H61L55 6Z" fill="#faab18" />
          <path d="M61 44L55 6H56.4L62.5 44Z" fill="#ffffff" opacity="0.85" />
          <path d="M66 44L50.5 9" stroke="#02789a" strokeWidth="0.5" opacity="0.7" />
          <path d="M88 44L56.5 8.5" stroke="#7fdcf0" strokeWidth="0.8" opacity="0.8" />
          <rect x="40" y="38" width="60" height="6" fill="#012a37" opacity="0.14" />
        </g>
        <path d="M106 44C98 44 90 42 83.8 39.3L88 44Z" fill="#0b8fb5" />

        {/* fuselage and clipped surface detail */}
        <path d={FUSELAGE} fill="url(#qafp-body)" />
        <g clipPath="url(#qafp-clip)">
          <path d="M237.5 40C240 48 240 56 235.5 72H262V40Z" fill="url(#qafp-radome)" opacity="0.55" />
          <path d="M237.5 40C240 48 240 56 235.5 72" stroke="#b7c5cd" strokeWidth="0.5" />
          <ellipse cx="150" cy="47.6" rx="95" ry="1.6" fill="#ffffff" opacity="0.8" filter="url(#qafp-blur)" />
          <ellipse cx="134" cy="67" rx="34" ry="4.5" fill="#012a37" opacity="0.22" filter="url(#qafp-blur)" />
          <path d="M231 63.2C222 64.3 216 64.6 208 64.6H108C80 64.6 50 55.6 28 49.6" stroke="#034a63" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M231 60.6C222 61.7 216 62 208 62H108C80 62 50 53 28 47" stroke="#049dc5" strokeWidth="0.8" strokeLinecap="round" />
        </g>

        {/* horizontal stabiliser (near side) */}
        <path d="M70 62.5L18 74H9L36 56Z" fill="url(#qafp-stab)" />
        <path d="M70 62.5L18 74" stroke="#edf2f5" strokeWidth="0.7" />

        {/* cockpit window strip */}
        <path d="M217 48.4L229 49.9L235 51.7L238.6 56.6L233 56.3L218 54Z" fill="url(#qafp-glass)" />
        <path d="M224.2 49.3L224.8 55M230.6 50.4L231.6 56" stroke="#dfe6ea" strokeWidth="0.7" />
        <path d="M219 49.6L229.5 51" stroke="#8fb0bf" strokeWidth="0.5" opacity="0.7" />

        {/* cabin windows and doors */}
        {WINDOWS.map((x) => (
          <rect key={x} x={x} y="51.8" width="2.1" height="3" rx="0.7" fill="#0f2b36" />
        ))}
        <rect x="126" y="51.2" width="2.4" height="5" rx="0.8" stroke="#aebcc5" strokeWidth="0.5" />
        <rect x="132" y="51.2" width="2.4" height="5" rx="0.8" stroke="#aebcc5" strokeWidth="0.5" />
        <rect x="205" y="47.6" width="5.2" height="11.4" rx="1.2" stroke="#aebcc5" strokeWidth="0.55" />
        <rect x="60" y="47.6" width="5.2" height="10.8" rx="1.2" stroke="#aebcc5" strokeWidth="0.55" />
        <rect x="206.6" y="51.8" width="2.1" height="3" rx="0.7" fill="#0f2b36" />
        <rect x="61.6" y="51.8" width="2.1" height="3" rx="0.7" fill="#0f2b36" />

        {/* belly fairing */}
        <path d="M180 67.6C172 70.6 102 71 94 67.6Z" fill="#aab9c3" />

        {/* near wing (underside), flap-track fairings, leading-edge highlight */}
        <path d="M162 66.5L104 98H90L108 69.5Z" fill="url(#qafp-wing)" />
        <path d="M108 69.5L90 98" stroke="#012a37" strokeWidth="0.6" opacity="0.18" />
        <ellipse cx="103" cy="78" rx="4.6" ry="1.5" transform="rotate(-58 103 78)" fill="#c9d5dc" />
        <ellipse cx="97" cy="88" rx="4" ry="1.3" transform="rotate(-58 97 88)" fill="#c9d5dc" />
        <path d="M162 66.5L104 98" stroke="#f2f6f8" strokeWidth="0.9" />

        {/* engine pylon, nacelle, intake and core nozzle */}
        <path d="M133 75L139 70.5H154L149 75Z" fill="#8d9ea9" />
        <g transform="translate(3 1)">
        <path d="M121 77.5L115.5 78.8V83.6L121 85Z" fill="url(#qafp-exh)" />
        <path d="M153 81C153 76.5 151.5 73 148 73L126 74.2C122.5 74.4 121 77 121 81C121 85 122.5 87.6 126 87.8L148 89C151.5 89 153 85.5 153 81Z" fill="url(#qafp-nac)" />
        <path d="M121 81C121 77 122.5 74.4 126 74.2L128 74.1C124.5 74.5 123.5 77.5 123.5 81C123.5 84.5 124.5 87.5 128 87.9L126 87.8C122.5 87.6 121 85 121 81Z" fill="#6f8290" opacity="0.6" />
        <ellipse cx="152.4" cy="81" rx="2.6" ry="8" fill="url(#qafp-lip)" />
        <ellipse cx="152.7" cy="81" rx="1.7" ry="6.7" fill="url(#qafp-intake)" />
        <ellipse cx="153" cy="81" rx="0.5" ry="1.9" fill="#c6d1d8" />
        </g>

        {/* sharklet rising from the near wing tip */}
        <path d="M104.2 98L100 86L98.2 86.6L95 98.6Z" fill="url(#qafp-fin)" />
        <path d="M104.2 98L100 86" stroke="#5fd0ea" strokeWidth="0.5" />

      </g>
    </svg>
  );
}
