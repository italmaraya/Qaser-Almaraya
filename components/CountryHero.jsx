'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { COUNTRY_GEO } from '../lib/geoData';
import { findCountryIso, routeMapSvg, distanceKm, BAGHDAD } from '../lib/visaPdf';
import { destinationTz } from './WorldClocks';

// Correct Arabic count: تأشيرة واحدة / تأشيرتان / 3 تأشيرات / 11 تأشيرة
export function visaCountAr(n) {
  if (n === 1) return 'تأشيرة واحدة متاحة';
  if (n === 2) return 'تأشيرتان متاحتان';
  if (n <= 10) return n + ' تأشيرات متاحة';
  return n + ' تأشيرة متاحة';
}

// "لـ" + name in proper Arabic: السعودية → للسعودية, تركيا → لتركيا
export function forCountryAr(name) {
  const n = String(name || '').trim();
  return n.startsWith('ال') ? 'لل' + n.slice(2) : 'ل' + n;
}

function tzDiffHours(tz) {
  try {
    const off = (zone) => {
      const p = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date());
      const g = (t) => Number(p.find((x) => x.type === t).value);
      return (Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute')) - Date.now()) / 60000;
    };
    return Math.round((off(tz) - off('Asia/Baghdad')) / 30) / 2;
  } catch {
    return null;
  }
}

/**
 * Top banner for a country's visa list: country photo, animated dotted route
 * from Baghdad, passport stamp and quick facts.
 */
export default function CountryHero({ country, count, fastestDays, lang = 'ar', onPdf, downloading }) {
  const en = lang === 'en';
  const name = en ? country.country_name_en || country.country_name_ar : country.country_name_ar;
  const photo = country.pdf_banner_url || country.card_image_url || '';
  const flag = /^(https?:|\/)/.test(country.flag_code || '') ? country.flag_code : country.flag_code ? '/assets/flags/' + country.flag_code + '.png' : '';

  const info = useMemo(() => {
    const iso = findCountryIso(country);
    const g = iso && COUNTRY_GEO[iso];
    if (!g || iso === 'iq') return null;
    const km = distanceKm([BAGHDAD[0], BAGHDAD[1]], [g[0], g[1]]);
    const hours = km / 820 + 0.5;
    const hh = Math.floor(hours), mm = Math.round(((hours - hh) * 60) / 5) * 5;
    const tz = destinationTz(iso);
    const diff = tz ? tzDiffHours(tz) : null;
    const map = routeMapSvg([g[0], g[1]], '', en, {
      dot: 'rgba(255,255,255,.32)', bg: '', arc: '#faab18', label: '#fff', labelStroke: 'rgba(0,0,0,.35)',
      aspect: 2.45, animate: true, minSpan: 130, cls: 'qch-map', planeScale: 0.5, pinScale: 0.6,
    });
    return { km, hh, mm, diff, currency: g[2], map };
  }, [country, en]);

  const chips = [];
  if (info) {
    chips.push(['📍', en ? 'From Baghdad' : 'من بغداد', Math.round(info.km / 10) * 10 + (en ? ' km' : ' كم')]);
    chips.push(['✈️', en ? 'Direct flight' : 'مدة الطيران', '≈ ' + info.hh + (en ? 'h' : ' س') + (info.mm ? ' ' + info.mm + (en ? 'm' : ' د') : '')]);
    if (info.diff !== null) chips.push(['🕐', en ? 'Time difference' : 'فرق التوقيت', info.diff === 0 ? (en ? 'Same as Baghdad' : 'نفس توقيت بغداد') : (info.diff > 0 ? '+' : '−') + Math.abs(info.diff) + (en ? 'h' : ' س')]);
    if (info.currency) chips.push(['💱', en ? 'Currency' : 'العملة', info.currency]);
  }
  if (fastestDays) chips.push(['⚡', en ? 'Fastest processing' : 'أسرع إصدار', fastestDays + (en ? ' working days' : ' أيام عمل')]);

  return (
    <section className="qch" style={{ backgroundImage: photo ? `url("${photo}")` : undefined }}>
      <style>{`
.qch{position:relative;width:100vw;margin-inline:calc(50% - 50vw);min-height:340px;background:#036f8c center/cover no-repeat;color:#fff;overflow:hidden;isolation:isolate}
.qch:before{content:"";position:absolute;inset:0;z-index:0;background:linear-gradient(90deg,rgba(2,40,54,.92) 0%,rgba(2,40,54,.78) 45%,rgba(2,40,54,.35) 100%),linear-gradient(to top,rgba(2,40,54,.55),transparent 60%)}
[dir=ltr] .qch:before{background:linear-gradient(270deg,rgba(2,40,54,.92) 0%,rgba(2,40,54,.78) 45%,rgba(2,40,54,.35) 100%),linear-gradient(to top,rgba(2,40,54,.55),transparent 60%)}
.qch-in{position:relative;z-index:2;max-width:1320px;margin:0 auto;padding:28px clamp(18px,4vw,48px) 34px;display:grid;grid-template-columns:1.1fr .9fr;gap:24px;align-items:center}
.qch-map{position:absolute;z-index:1;inset-inline-end:0;top:0;height:100%;width:58%;opacity:.95;-webkit-mask-image:linear-gradient(to left,#000 55%,transparent);mask-image:linear-gradient(to left,#000 55%,transparent)}
[dir=ltr] .qch-map{-webkit-mask-image:linear-gradient(to right,#000 55%,transparent);mask-image:linear-gradient(to right,#000 55%,transparent)}
.qch-copy{display:flex;flex-direction:column;gap:14px}
.qch-back{color:rgba(255,255,255,.85);font-size:13.5px;font-weight:600;text-decoration:none;align-self:flex-start}
.qch-title{display:flex;align-items:center;gap:14px}
.qch-flag{width:58px;height:58px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,.3);flex:none}
.qch h1{margin:0;font-size:clamp(26px,3.2vw,44px);line-height:1.15;color:#fff}
.qch-sub{font-size:14px;color:rgba(255,255,255,.8)}
.qch-chips{display:flex;flex-wrap:wrap;gap:8px}
.qch-chip{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:14px;padding:8px 12px}
.qch-chip span{font-size:11px;color:rgba(255,255,255,.75);display:block}
.qch-chip b{font-size:14px;display:block;white-space:nowrap}
.qch-pdf{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;background:#fff;color:#036f8c;border:0;border-radius:999px;padding:11px 20px;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit;box-shadow:0 8px 22px rgba(0,0,0,.18)}
.qch-stamp{position:absolute;z-index:1;bottom:-18px;inset-inline-start:34%;width:170px;height:170px;color:rgba(255,255,255,.14);transform:rotate(-14deg);pointer-events:none}
@media (max-width:860px){.qch-in{grid-template-columns:1fr}.qch-map{width:100%;opacity:.45}.qch-stamp{display:none}}
`}</style>
      {info && <div dangerouslySetInnerHTML={{ __html: info.map }} style={{ display: 'contents' }} />}
      <svg className="qch-stamp" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="3.5" />
        <circle cx="60" cy="60" r="48" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
        <text x="60" y="52" textAnchor="middle" fontSize="12" fontWeight="700" fill="currentColor">{name}</text>
        <text x="60" y="74" textAnchor="middle" fontSize="18" fontWeight="700" fill="currentColor" fontFamily="IBM Plex Sans, sans-serif">VISA</text>
        <text x="60" y="92" textAnchor="middle" fontSize="6.5" letterSpacing="1.5" fill="currentColor" fontFamily="IBM Plex Sans, sans-serif" fontWeight="700">QASER ALMARAYA</text>
      </svg>
      <div className="qch-in">
        <div className="qch-copy">
          <Link href="/visa" className="qch-back">{en ? '← Back to visas' : '← رجوع إلى التأشيرات'}</Link>
          <div className="qch-title">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {flag && <img className="qch-flag" src={flag} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
            <div>
              <div className="qch-sub">{en ? 'Visas for' : 'تأشيرات'} {name}</div>
              <h1>{en ? `${count} visa option${count === 1 ? '' : 's'} for ${name}` : `${visaCountAr(count)} ${forCountryAr(name)}`}</h1>
            </div>
          </div>
          {chips.length > 0 && (
            <div className="qch-chips">
              {chips.map((c) => (
                <div key={c[1]} className="qch-chip"><span style={{ fontSize: 17, display: 'inline' }}>{c[0]}</span><div><span>{c[1]}</span><b>{c[2]}</b></div></div>
              ))}
            </div>
          )}
          <button type="button" className="qch-pdf" onClick={onPdf} disabled={downloading} style={{ opacity: downloading ? 0.6 : 1 }}>
            📄 {downloading ? (en ? 'Preparing…' : '...جارٍ التحضير') : en ? `Download PDF of all ${name} visas` : `تحميل PDF لكل تأشيرات ${name}`}
          </button>
        </div>
      </div>
    </section>
  );
}
