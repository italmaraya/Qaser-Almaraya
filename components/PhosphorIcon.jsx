import { PHOSPHOR } from '../lib/phosphor';

// Designer-made icon set (Phosphor, duotone weight, MIT). Paths live in
// lib/phosphor.js on a 256×256 grid; colour follows currentColor.

export function phosphorPaths(name) {
  const list = PHOSPHOR[name] || [];
  return list.map(([d, o], i) => <path key={i} d={d} opacity={o < 1 ? o : undefined} />);
}

export default function PhosphorIcon({ name, size = 32, label, style }) {
  if (!PHOSPHOR[name]) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      style={{ display: 'block', flex: 'none', ...style }}
    >
      {phosphorPaths(name)}
    </svg>
  );
}
