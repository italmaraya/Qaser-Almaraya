'use client';

// Partner airlines, each logo sized by visual weight so they look balanced.
const AIRLINES = [{"slug": "flydubai", "name": "flydubai", "w": 152, "h": 42}, {"slug": "salamair", "name": "SalamAir", "w": 150, "h": 43}, {"slug": "flynas", "name": "flynas", "w": 108, "h": 54}, {"slug": "airarabia", "name": "Air Arabia", "w": 115, "h": 54}, {"slug": "qatar", "name": "Qatar Airways", "w": 138, "h": 46}, {"slug": "flyerbil", "name": "Fly Erbil", "w": 166, "h": 39}, {"slug": "chamwings", "name": "Cham Wings", "w": 154, "h": 41}, {"slug": "royal-jordanian", "name": "Royal Jordanian", "w": 154, "h": 42}, {"slug": "turkish", "name": "Turkish Airlines", "w": 124, "h": 52}, {"slug": "egyptair", "name": "EgyptAir", "w": 168, "h": 38}];

// One static, wrapping row of partner logos (the sliding marquee was removed
// on 6 Nov 2026: no looping decoration on the site).
export default function AirlinesMarquee() {
  return (
    <div className="qam" dir="ltr" data-keep-dir="" data-no-i18n="">
      <style>{`
.qam{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:26px 48px;max-width:1240px;margin:0 auto;padding:30px 32px 38px}
.qam img{display:block;flex:none;width:calc(var(--w) * 1px);height:calc(var(--h) * 1px);opacity:.92}
@media(max-width:820px){.qam{gap:18px 28px;padding:20px 16px 26px}.qam img{width:calc(var(--w) * .7px);height:calc(var(--h) * .7px)}}
`}</style>
      {AIRLINES.map((a) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={a.slug} src={'/assets/airlines/' + a.slug + '.webp'} alt={a.name} title={a.name} width={a.w} height={a.h} loading="lazy" decoding="async" style={{ '--w': a.w, '--h': a.h }} />
      ))}
    </div>
  );
}
