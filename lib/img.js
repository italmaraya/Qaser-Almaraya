// Responsive images for the public site.
//
// Package and hero photos are stored full size (1920 px, up to ~1.2 MB) in
// Vercel Blob. These helpers ask Next's image optimiser for a copy sized to
// the slot and the screen, so a phone downloads a few hundred KB instead of
// several MB. If the optimiser ever refuses a request, onError swaps the
// <img> back to the original file, so a photo is never left blank.
//
// Only the public site uses this; the dashboard keeps plain <img> tags.

const BLOB = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i;
const LOCAL = /^\/(?!_next\/)[^/]/;
// Must be listed in Next's deviceSizes/imageSizes (these are the defaults).
const ALLOWED = [384, 640, 750, 828, 1080, 1200, 1920];

export function canOptimize(url) {
  if (!url || typeof url !== 'string') return false;
  if (/\.(svg|gif)(\?|#|$)/i.test(url)) return false;
  return BLOB.test(url) || LOCAL.test(url);
}

function pick(w) {
  return ALLOWED.find((a) => a >= w) || ALLOWED[ALLOWED.length - 1];
}

export function optimized(url, width, quality = 70) {
  if (!canOptimize(url)) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${pick(width)}&q=${quality}`;
}

function restoreOriginal(e) {
  const img = e.currentTarget;
  const orig = img.getAttribute('data-orig');
  if (!orig || img.getAttribute('data-fallback')) return;
  img.setAttribute('data-fallback', '1');
  img.removeAttribute('srcset');
  img.src = orig;
}

/**
 * Props for an <img>: src, srcSet, sizes and a fallback to the original.
 * `sizes` describes how wide the slot is, e.g. '(max-width: 820px) 100vw, 400px'.
 */
export function imgProps(url, sizes, widths = [384, 640, 1080, 1920]) {
  if (!url) return {};
  if (!canOptimize(url)) return { src: url };
  return {
    src: optimized(url, widths[Math.min(1, widths.length - 1)]),
    srcSet: widths.map((w) => `${optimized(url, w)} ${pick(w)}w`).join(', '),
    sizes,
    'data-orig': url,
    onError: restoreOriginal,
  };
}
