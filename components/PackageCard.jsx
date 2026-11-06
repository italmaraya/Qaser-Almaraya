'use client';
import React, { useState } from 'react';
import Icon from './Icon';

function FlightRow({ f, lang, selected, onSelect }) {
  const nm = (ar, en) => (lang === 'en' && en ? en : ar);
  const airline = nm(f.nameAr, f.nameEn);
  const hasReturn = !!(f.retFromCity || f.retToCity || f.retDepartTime || f.retArriveTime);
  const [leg, setLeg] = useState('out');
  const active = leg === 'ret' && hasReturn ? 'ret' : 'out';

  const legData = active === 'ret'
    ? { from: f.retFromCity, to: f.retToCity, depart: f.retDepartTime, arrive: f.retArriveTime, duration: f.retDuration, flightNo: f.retFlightNo }
    : { from: f.outFromCity, to: f.outToCity, depart: f.outDepartTime, arrive: f.outArriveTime, duration: f.outDuration, flightNo: f.outFlightNo };
  const hasRoute = legData.from || legData.to || legData.depart || legData.arrive;

  return (
    <div
      style={{
        border: `1px solid ${selected ? 'var(--q-cyan,#049dc5)' : 'var(--q-line,#e6e9eb)'}`,
        background: selected ? 'var(--q-cyan-soft,#eaf8fd)' : '#fff', borderRadius: 'var(--q-r-sm,8px)', padding: 14,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div onClick={onSelect} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--q-ink,#1d2733)' }}>
          {airline || (lang === 'en' ? 'Airline' : 'شركة الطيران')}
          {legData.flightNo ? <span style={{ color: 'var(--q-ink-2,#5f666e)', fontWeight: 500 }}> · {legData.flightNo}</span> : null}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: f.diff ? 'var(--q-cyan-dark,#036f8c)' : 'var(--q-ink-2,#5f666e)' }}>
          {f.diff ? (f.diff > 0 ? '+' : '') + f.diff.toLocaleString() + ' ' + (lang === 'en' ? 'IQD' : 'د.ع') : (lang === 'en' ? 'Included' : 'مشمول')}
        </span>
      </div>

      {hasReturn ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLeg('out'); }}
            style={{
              flex: 1, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              border: `1px solid ${active === 'out' ? 'var(--q-cyan,#049dc5)' : 'var(--q-line,#e6e9eb)'}`, background: active === 'out' ? 'var(--q-cyan,#049dc5)' : '#fff', color: active === 'out' ? '#fff' : '#3d4650', fontSize: 11.5, fontWeight: 700,
            }}
          >
            <Icon name="plane-takeoff" size={12} />{lang === 'en' ? 'Departure' : 'ذهاب'}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLeg('ret'); }}
            style={{
              flex: 1, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              border: `1px solid ${active === 'ret' ? 'var(--q-cyan,#049dc5)' : 'var(--q-line,#e6e9eb)'}`, background: active === 'ret' ? 'var(--q-cyan,#049dc5)' : '#fff', color: active === 'ret' ? '#fff' : '#3d4650', fontSize: 11.5, fontWeight: 700,
            }}
          >
            <Icon name="plane-landing" size={12} />{lang === 'en' ? 'Return' : 'عودة'}
          </button>
        </div>
      ) : null}

      {hasRoute ? (
        <div onClick={onSelect} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: '0 0 auto', minWidth: 70, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--q-ink,#1d2733)' }}>{legData.depart || '--:--'}</div>
            <div style={{ fontSize: 11.5, color: 'var(--q-ink-2,#5f666e)' }}>{legData.from || (lang === 'en' ? 'Origin' : 'الانطلاق')}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ position: 'relative', width: '100%', height: 1, background: 'var(--q-line,#e6e9eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plane" size={16} style={{ color: 'var(--q-cyan,#049dc5)', background: '#fff', transform: active === 'ret' ? 'rotate(-90deg)' : 'rotate(90deg)' }} />
            </div>
            {legData.duration ? <span style={{ fontSize: 10.5, color: 'var(--q-ink-2,#5f666e)' }}>{legData.duration}</span> : null}
          </div>
          <div style={{ flex: '0 0 auto', minWidth: 70, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--q-ink,#1d2733)' }}>{legData.arrive || '--:--'}</div>
            <div style={{ fontSize: 11.5, color: 'var(--q-ink-2,#5f666e)' }}>{legData.to || (lang === 'en' ? 'Destination' : 'الوصول')}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HotelRow({ h, lang, selected, onSelect }) {
  const nm = (ar, en) => (lang === 'en' && en ? en : ar);
  const amenities = (lang === 'en' && h.amenitiesEn?.length ? h.amenitiesEn : h.amenitiesAr) || [];
  return (
    <div
      onClick={onSelect}
      style={{
        cursor: 'pointer', border: `1px solid ${selected ? 'var(--q-cyan,#049dc5)' : 'var(--q-line,#e6e9eb)'}`,
        background: selected ? 'var(--q-cyan-soft,#eaf8fd)' : '#fff', borderRadius: 'var(--q-r-sm,8px)', padding: 12,
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      {h.imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={h.imageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 'var(--q-r-sm,8px)', objectFit: 'cover', flex: 'none' }} />
      ) : (
        <div style={{ width: 56, height: 56, borderRadius: 'var(--q-r-sm,8px)', background: 'var(--q-surface-2,#f6f8f9)', display: 'grid', placeItems: 'center', flex: 'none' }}>
          <Icon name="building-2" size={20} style={{ color: 'var(--q-cyan,#049dc5)' }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--q-ink,#1d2733)' }}>{nm(h.nameAr, h.nameEn)}</span>
        {h.location ? (
          <span style={{ fontSize: 12, color: 'var(--q-ink-2,#5f666e)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="map-pin" size={12} />{h.location}
          </span>
        ) : null}
        {amenities.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {amenities.slice(0, 4).map((a) => (
              <span key={a} style={{ fontSize: 11, color: '#3d4650', background: 'var(--q-surface-2,#f6f8f9)', border: '1px solid var(--q-line,#e6e9eb)', borderRadius: 999, padding: '2px 9px' }}>{a}</span>
            ))}
          </div>
        ) : null}
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: h.diff ? 'var(--q-cyan-dark,#036f8c)' : 'var(--q-ink-2,#5f666e)', flex: 'none' }}>
        {h.diff ? (h.diff > 0 ? '+' : '') + h.diff.toLocaleString() + ' ' + (lang === 'en' ? 'IQD' : 'د.ع') : (lang === 'en' ? 'Included' : 'مشمول')}
      </span>
    </div>
  );
}

// `nights` arrives either already worded ("7 ليالٍ") or as a bare count (7).
// A bare count gets its unit word; anything else is trimmed and passed through.
function nightsText(nights, lang) {
  if (nights === null || nights === undefined) return '';
  const raw = String(nights).trim();
  if (!raw) return '';
  if (!/^\d+$/.test(raw)) return raw;
  const n = Number(raw);
  if (!(n > 0)) return '';
  if (lang === 'en') return n === 1 ? '1 night' : `${n} nights`;
  if (n === 1) return 'ليلة واحدة';
  if (n === 2) return 'ليلتان';
  if (n <= 10) return `${n} ليالٍ`;
  return `${n} ليلة`;
}

export default function PackageCard({ title, destination, image, nights, groupType, departs, price, includes = [], badge, onDetails, hotels = [], flights = [], lang = 'ar', style, urgency = null, priceFromLabel = false }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('flights');
  const [flightIdx, setFlightIdx] = useState(0);
  const [hotelIdx, setHotelIdx] = useState(0);
  const hasFlights = flights.length > 0;
  const hasHotels = hotels.length > 0;
  const canToggle = hasFlights || hasHotels;
  const en = lang === 'en';

  const heading = String(destination || title || '').trim();
  const subTitle = (() => {
    const t = String(title || '').trim();
    if (!t || !heading || t === heading || heading.includes(t)) return '';
    return t;
  })();

  // A badge is only drawn on the photo when it carries real, time-sensitive
  // seat data (last seats, sold out). A recurring weekly schedule is useful
  // information but not urgency, so it reads as plain text in the meta line
  // instead of a shouting yellow pill on every single card.
  const hotBadge = urgency && urgency.label && (urgency.soldOut || urgency.hot) ? urgency : null;
  const scheduleNote = urgency && urgency.label && !hotBadge ? String(urgency.label).trim() : '';

  // One quiet meta line: duration · group type · departure · schedule · badge words.
  // Each part is dropped when its data is missing, so no label is ever orphaned.
  // The duration is skipped when the sub-title already spells it out, so the
  // same number is never printed twice on one card.
  const nightsLabel = nightsText(nights, lang);
  const subHasDuration = !!nightsLabel && /\d/.test(subTitle) && /(ليال|ليلة|ليلت|night|day|يوم|أيام|ايام)/i.test(subTitle);
  const metaParts = [
    subHasDuration ? '' : nightsLabel,
    String(groupType || '').trim(),
    String(departs || '').trim(),
    scheduleNote,
    String(badge || '').trim(),
  ].filter(Boolean);

  const shownIncludes = (includes || []).filter((i) => String(i || '').trim()).slice(0, 3);
  const extraIncludes = (includes || []).filter((i) => String(i || '').trim()).length - shownIncludes.length;

  const detailsLabel = en ? 'Package details' : 'تفاصيل الباقة';

  return (
    <div dir={en ? 'ltr' : 'rtl'} className="qa-pkg-card" style={{ background: '#fff', border: '1px solid var(--q-line,#e6e9eb)', borderRadius: 'var(--q-r,12px)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0, ...style }}>
      {/* Image + text are one focusable region that opens the package. */}
      <button type="button" onClick={onDetails} aria-label={heading ? `${detailsLabel} — ${heading}` : detailsLabel} className="qa-pkg-link">
        <div className="qa-pkg-hero" style={{ position: 'relative', background: 'var(--q-surface-2,#f6f8f9)', overflow: 'hidden' }}>
          {image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={image} alt={heading || title || ''} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 28%' }} />
          ) : (
            <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--q-ink-3,#9aa0a6)', fontSize: 13 }}>
              <Icon name="image" size={24} />
            </span>
          )}

          {/* The only badge on the card: real, time-sensitive seat data. */}
          {hotBadge ? (
            <span
              className="qa-pkg-badge"
              style={{
                position: 'absolute', top: 12, insetInlineStart: 12, display: 'inline-flex', alignItems: 'center', gap: 5,
                background: hotBadge.soldOut ? 'var(--q-ink,#1d2733)' : '#e0364f',
                color: '#fff',
                borderRadius: 999, fontWeight: 700, zIndex: 2,
              }}
            >
              <Icon name={hotBadge.soldOut ? 'ban' : 'clock'} size={12} />{hotBadge.label}
            </span>
          ) : null}
        </div>

        <div className="qa-pkg-body">
          {heading ? <h3 className="qa-pkg-dest">{heading}</h3> : null}
          {subTitle ? <span className="qa-pkg-sub">{subTitle}</span> : null}
          {metaParts.length ? <span className="qa-pkg-meta">{metaParts.join(' · ')}</span> : null}

          {shownIncludes.length ? (
            <ul className="qa-pkg-includes">
              {shownIncludes.map((i) => (
                <li key={i}>
                  <Icon name="check" size={15} style={{ color: 'var(--q-cyan,#049dc5)', flex: 'none' }} />{i}
                </li>
              ))}
              {extraIncludes > 0 ? (
                <li className="qa-pkg-more">{en ? `+${extraIncludes} more` : `+${extraIncludes} أخرى`}</li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </button>

      <div className="qa-pkg-foot">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span className="qa-pkg-price-label">
            {priceFromLabel ? (en ? 'Starting from' : 'يبدأ من') : (en ? 'per person' : 'للفرد')}
          </span>
          <span className="qa-pkg-price">{price}</span>
        </div>
        <button type="button" onClick={onDetails} className="qa-pkg-cta">{detailsLabel}</button>
      </div>

      {canToggle ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="qa-pkg-toggle"
          aria-expanded={open}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Icon name="plane" size={15} style={{ color: 'var(--q-cyan,#049dc5)', flex: 'none' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--q-cyan-dark,#036f8c)' }}>
              {en ? 'Check flights & hotels' : 'تحقق من الطيران والفنادق'}
            </span>
          </span>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} style={{ color: 'var(--q-cyan-dark,#036f8c)', flex: 'none' }} />
        </button>
      ) : null}

      {open && canToggle ? (
        <div className="qa-pkg-panel">
          <div style={{ display: 'flex', gap: 8 }}>
            {hasFlights ? (
              <button
                type="button"
                onClick={() => setTab('flights')}
                style={{
                  flex: 1, cursor: 'pointer', fontFamily: 'inherit', padding: '9px 10px', borderRadius: 999,
                  border: `1px solid ${tab === 'flights' ? 'var(--q-cyan,#049dc5)' : 'var(--q-line,#e6e9eb)'}`,
                  background: tab === 'flights' ? 'var(--q-cyan,#049dc5)' : '#fff', color: tab === 'flights' ? '#fff' : '#3d4650', fontSize: 13, fontWeight: 700,
                }}
              >
                {en ? 'Flights' : 'الرحلات'}
              </button>
            ) : null}
            {hasHotels ? (
              <button
                type="button"
                onClick={() => setTab('hotels')}
                style={{
                  flex: 1, cursor: 'pointer', fontFamily: 'inherit', padding: '9px 10px', borderRadius: 999,
                  border: `1px solid ${tab === 'hotels' ? 'var(--q-cyan,#049dc5)' : 'var(--q-line,#e6e9eb)'}`,
                  background: tab === 'hotels' ? 'var(--q-cyan,#049dc5)' : '#fff', color: tab === 'hotels' ? '#fff' : '#3d4650', fontSize: 13, fontWeight: 700,
                }}
              >
                {en ? 'Hotels' : 'الفنادق'}
              </button>
            ) : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tab === 'flights' && hasFlights && flights.map((f, idx) => (
              <FlightRow key={idx} f={f} lang={lang} selected={flightIdx === idx} onSelect={() => setFlightIdx(idx)} />
            ))}
            {tab === 'hotels' && hasHotels && hotels.map((h, idx) => (
              <HotelRow key={idx} h={h} lang={lang} selected={hotelIdx === idx} onSelect={() => setHotelIdx(idx)} />
            ))}
          </div>

          <button type="button" onClick={onDetails} className="qa-pkg-continue">
            {en ? 'Continue with this choice' : 'المتابعة بهذا الاختيار'}
          </button>
        </div>
      ) : null}

      <style jsx>{`
        .qa-pkg-card { transition: border-color .18s ease, box-shadow .18s ease; }
        .qa-pkg-card:hover { border-color: #cfd6da; box-shadow: 0 6px 18px rgba(1,42,55,.07); }

        .qa-pkg-link {
          display: block; width: 100%; min-width: 0; margin: 0; padding: 0;
          border: 0; background: transparent; font-family: inherit; color: inherit;
          text-align: start; cursor: pointer;
        }
        .qa-pkg-link:focus-visible,
        .qa-pkg-cta:focus-visible,
        .qa-pkg-toggle:focus-visible,
        .qa-pkg-continue:focus-visible { outline: 2px solid var(--q-cyan,#049dc5); outline-offset: 3px; }

        .qa-pkg-hero { aspect-ratio: 3 / 2; }
        .qa-pkg-badge { padding: 5px 11px; font-size: 12.5px; }

        .qa-pkg-body { display: flex; flex-direction: column; gap: 8px; padding: 16px 20px 18px; min-width: 0; }
        .qa-pkg-dest {
          margin: 0; font-size: 22px; font-weight: 700; color: var(--q-ink,#1d2733); line-height: 1.32;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; overflow-wrap: anywhere;
        }
        .qa-pkg-sub { font-size: 14px; color: var(--q-ink-2,#5f666e); line-height: 1.5; overflow-wrap: anywhere; }
        .qa-pkg-meta { font-size: 13px; color: var(--q-ink-2,#5f666e); line-height: 1.6; overflow-wrap: anywhere; }

        .qa-pkg-includes { margin: 2px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
        .qa-pkg-includes li { display: flex; gap: 8px; align-items: flex-start; font-size: 14px; color: #3d4650; line-height: 1.5; }
        .qa-pkg-includes li.qa-pkg-more { font-size: 13px; color: var(--q-ink-3,#9aa0a6); padding-inline-start: 23px; }

        .qa-pkg-foot {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 14px 20px 18px; border-top: 1px solid var(--q-line,#e6e9eb);
        }
        .qa-pkg-price-label { font-size: 13px; color: var(--q-ink-3,#9aa0a6); }
        .qa-pkg-price { font-size: 28px; font-weight: 800; color: var(--q-cyan-dark,#036f8c); white-space: nowrap; line-height: 1.15; }
        .qa-pkg-cta {
          flex: none; display: inline-flex; align-items: center; justify-content: center;
          min-height: 46px; padding: 0 18px; border-radius: 999px;
          border: 1px solid var(--q-cyan,#049dc5); background: transparent; color: var(--q-cyan-dark,#036f8c);
          font-family: inherit; font-size: 14px; font-weight: 700; white-space: nowrap; cursor: pointer;
          transition: background .16s ease;
        }
        .qa-pkg-cta:hover { background: var(--q-cyan-soft,#eaf8fd); }

        .qa-pkg-toggle {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          width: 100%; padding: 13px 20px; border: 0; border-top: 1px solid var(--q-line,#e6e9eb);
          border-radius: 0; background: transparent; font-family: inherit; cursor: pointer;
        }
        .qa-pkg-panel {
          display: flex; flex-direction: column; gap: 12px;
          padding: 14px 20px 18px; border-top: 1px solid var(--q-line,#e6e9eb);
        }
        .qa-pkg-continue {
          display: inline-flex; align-items: center; justify-content: center; min-height: 46px;
          padding: 0 18px; border: 1px solid var(--q-cyan,#049dc5); border-radius: 999px;
          background: var(--q-cyan,#049dc5); color: #fff;
          font-family: inherit; font-size: 13.5px; font-weight: 700; cursor: pointer;
        }

        @media (max-width: 640px) {
          .qa-pkg-badge { padding: 4px 9px; font-size: 11px; }
          .qa-pkg-body { padding: 14px 14px 14px; gap: 7px; }
          .qa-pkg-dest { font-size: 18px; }
          .qa-pkg-sub { font-size: 13px; }
          .qa-pkg-meta { font-size: 13px; }
          .qa-pkg-includes li { font-size: 13px; }
          .qa-pkg-includes li.qa-pkg-more { font-size: 12.5px; }
          .qa-pkg-foot { padding: 12px 14px 14px; gap: 10px; }
          .qa-pkg-price-label { font-size: 12px; }
          .qa-pkg-price { font-size: 22px; }
          .qa-pkg-cta { font-size: 13px; padding: 0 14px; }
          .qa-pkg-toggle { padding: 12px 14px; }
          .qa-pkg-panel { padding: 12px 14px 14px; }
        }
      `}</style>
    </div>
  );
}
