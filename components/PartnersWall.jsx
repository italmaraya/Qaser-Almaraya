'use client';

// The partner wall: one moving row per partner family, each logo in its own
// colours on a white tile. Airlines travel one way and hotels the other, so the two rows
// read as separate networks instead of one long strip.
//
// A logo's w/h is its drawn size inside the tile, picked by visual weight so
// a wide wordmark and a tall roundel look equally large.
// Coloured artwork lives in /assets/airlines-color/. Fly Erbil has no coloured
// file yet, so its white artwork is drawn dark (mono) until one arrives.
const AIRLINES = [
  { slug: 'flydubai', name: 'flydubai', w: 127, h: 26 },
  { slug: 'salamair', name: 'SalamAir', w: 124, h: 27 },
  { slug: 'flynas', name: 'flynas', w: 86, h: 38 },
  { slug: 'airarabia', name: 'Air Arabia', w: 94, h: 35 },
  { slug: 'qatar', name: 'Qatar Airways', w: 98, h: 34 },
  { slug: 'flyerbil', name: 'Fly Erbil', w: 116, h: 28, mono: true },
  { slug: 'chamwings', name: 'Cham Wings', w: 99, h: 33 },
  { slug: 'royal-jordanian', name: 'Royal Jordanian', w: 78, h: 42 },
  { slug: 'turkish', name: 'Turkish Airlines', w: 113, h: 29 },
  { slug: 'egyptair', name: 'EgyptAir', w: 128, h: 19 },
];

// Hotel chains, once we carry their logos: each entry needs
// /assets/hotels/<slug>.webp, and the row appears on its own.
const HOTELS = [];

// The airlines are dealt into two rows that travel opposite ways, so ten
// logos read as a network instead of one thin strip.
const evens = AIRLINES.filter((_, i) => i % 2 === 0);
const odds = AIRLINES.filter((_, i) => i % 2 === 1);

const ROWS = [
  { key: 'airlines-a', base: '/assets/airlines-color/', items: evens, reverse: false, label: 'شركات الطيران الشريكة' },
  { key: 'airlines-b', base: '/assets/airlines-color/', items: odds, reverse: true, label: 'شركات الطيران الشريكة' },
  { key: 'hotels', base: '/assets/hotels/', items: HOTELS, reverse: true, label: 'سلاسل الفنادق الشريكة' },
];

const GAP = 20; // px between tiles
const TILE = 150; // tile width; the logo is centred inside it

function Row({ row }) {
  // One "set" is the list repeated until it is wider than any screen; two
  // identical sets slide by exactly one set width, so the loop never jumps
  // and never leaves a gap.
  const listWidth = row.items.length * (TILE + GAP);
  const repeats = Math.max(1, Math.ceil(2600 / listWidth));
  const set = Array.from({ length: repeats }, () => row.items).flat();
  const seconds = Math.round((listWidth * repeats) / 40); // ~40 px per second

  const renderSet = (key, hidden) => (
    <div key={key} className="qpw-set" aria-hidden={hidden || undefined}>
      {set.map((a, i) => (
        <span key={i} className="qpw-tile" title={a.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={(a.mono ? '/assets/airlines/' : row.base) + a.slug + '.webp'}
            className={a.mono ? 'qpw-mono' : undefined}
            alt={hidden || i >= row.items.length ? '' : a.name}
            width={a.w}
            height={a.h}
            loading="lazy"
            decoding="async"
            style={{ '--w': a.w, '--h': a.h }}
          />
        </span>
      ))}
    </div>
  );

  return (
    <div className="qpw-row" role="group" aria-label={row.label}>
      <div className={'qpw-track' + (row.reverse ? ' qpw-rev' : '')} style={{ '--qpw-dur': seconds + 's' }}>
        {renderSet('a', false)}
        {renderSet('b', true)}
      </div>
    </div>
  );
}

export default function PartnersWall() {
  const rows = ROWS.filter((r) => r.items.length);
  if (!rows.length) return null;

  return (
    <div className="qpw" dir="ltr" data-keep-dir="" data-no-i18n="">
      <style>{`
.qpw{position:relative;display:flex;flex-direction:column;gap:16px;padding:24px 0 32px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.qpw-row{overflow:hidden}
.qpw-track{display:flex;width:max-content;animation:qpw-slide var(--qpw-dur) linear infinite;will-change:transform}
.qpw-rev{animation-direction:reverse}
.qpw-row:hover .qpw-track{animation-play-state:paused}
.qpw-set{display:flex;align-items:stretch;gap:${GAP}px;padding-inline-end:${GAP}px;flex:none}
/* Each logo keeps its real colours on its own white tile. */
.qpw-tile{flex:none;display:grid;place-items:center;width:${TILE}px;height:72px;background:#fff;border-radius:6px;box-shadow:0 1px 2px rgba(10,31,40,.12);transition:transform .2s,box-shadow .2s}
.qpw-tile:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(10,31,40,.22)}
.qpw-tile img{display:block;width:calc(var(--w) * 1px);height:calc(var(--h) * 1px);object-fit:contain}
.qpw-tile img.qpw-mono{filter:brightness(0);opacity:.78}
@media(max-width:820px){.qpw{padding:16px 0 24px;gap:12px}.qpw-set{gap:12px;padding-inline-end:12px}.qpw-tile{width:112px;height:56px}.qpw-tile img{width:calc(var(--w) * .76px);height:calc(var(--h) * .76px)}}
@keyframes qpw-slide{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){.qpw-track{animation:none}}
`}</style>
      {rows.map((row) => (
        <Row key={row.key} row={row} />
      ))}
    </div>
  );
}
