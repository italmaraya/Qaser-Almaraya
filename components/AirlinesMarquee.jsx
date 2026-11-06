'use client';

// Partner airlines, each logo sized by visual weight so they look balanced.
const AIRLINES = [{"slug": "flydubai", "name": "flydubai", "w": 152, "h": 42}, {"slug": "salamair", "name": "SalamAir", "w": 150, "h": 43}, {"slug": "flynas", "name": "flynas", "w": 108, "h": 54}, {"slug": "airarabia", "name": "Air Arabia", "w": 115, "h": 54}, {"slug": "qatar", "name": "Qatar Airways", "w": 138, "h": 46}, {"slug": "flyerbil", "name": "Fly Erbil", "w": 166, "h": 39}, {"slug": "chamwings", "name": "Cham Wings", "w": 154, "h": 41}, {"slug": "royal-jordanian", "name": "Royal Jordanian", "w": 154, "h": 42}, {"slug": "turkish", "name": "Turkish Airlines", "w": 124, "h": 52}, {"slug": "egyptair", "name": "EgyptAir", "w": 168, "h": 38}];

const GAP = 64; // px between logos

// Seamless, never-empty logo marquee. One "set" is the logo list repeated
// until it's wider than any screen; two identical sets slide by exactly one
// set width, so the loop has no visible jump or gap.
export default function AirlinesMarquee() {
  const listWidth = AIRLINES.reduce((s, a) => s + a.w + GAP, 0);
  const repeats = Math.max(1, Math.ceil(2600 / listWidth));
  const set = Array.from({ length: repeats }, () => AIRLINES).flat();
  const setWidth = listWidth * repeats;
  const seconds = Math.round(setWidth / 45); // ~45 px per second

  const renderSet = (key, hidden) => (
    <div key={key} className="qam-set" aria-hidden={hidden || undefined}>
      {set.map((a, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={'/assets/airlines/' + a.slug + '.webp'} alt={hidden || i >= AIRLINES.length ? '' : a.name} title={a.name} width={a.w} height={a.h} loading="lazy" decoding="async" style={{ '--w': a.w, '--h': a.h }} />
      ))}
    </div>
  );

  return (
    <div className="qam" dir="ltr" data-keep-dir="" data-no-i18n="">
      <style>{`
.qam{position:relative;overflow:hidden;padding:30px 0 34px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.qam-track{display:flex;width:max-content;animation:qam-slide var(--qam-dur) linear infinite;will-change:transform}
.qam:hover .qam-track{animation-play-state:paused}
.qam-set{display:flex;align-items:center;gap:${GAP}px;padding-inline-end:${GAP}px;flex:none}
.qam-set img{display:block;flex:none;width:calc(var(--w) * 1px);height:calc(var(--h) * 1px);opacity:.9;filter:drop-shadow(0 2px 6px rgba(1,42,55,.18));transition:opacity .2s,transform .2s}
.qam-set img:hover{opacity:1;transform:translateY(-2px) scale(1.04)}
@keyframes qam-slide{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media(max-width:820px){.qam{padding:20px 0 24px}.qam-set{gap:36px;padding-inline-end:36px}.qam-set img{width:calc(var(--w) * .7px);height:calc(var(--h) * .7px)}}
@media(prefers-reduced-motion:reduce){.qam-track{animation:none}}
`}</style>
      <div className="qam-track" style={{ '--qam-dur': seconds + 's' }}>
        {renderSet('a', false)}
        {renderSet('b', true)}
      </div>
    </div>
  );
}
