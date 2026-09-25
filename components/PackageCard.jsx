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
        border: `1.5px solid ${selected ? '#049dc5' : '#ececed'}`,
        background: selected ? '#eaf8fd' : '#fff', borderRadius: 14, padding: 14,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div onClick={onSelect} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1d2733' }}>
          {airline || (lang === 'en' ? 'Airline' : 'شركة الطيران')}
          {legData.flightNo ? <span style={{ color: '#7b8087', fontWeight: 500 }}> · {legData.flightNo}</span> : null}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: f.diff ? '#049dc5' : '#7b8087' }}>
          {f.diff ? (f.diff > 0 ? '+' : '') + f.diff.toLocaleString() + ' ' + (lang === 'en' ? 'IQD' : 'د.ع') : (lang === 'en' ? 'Included' : 'مشمول')}
        </span>
      </div>

      {hasReturn ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLeg('out'); }}
            style={{
              flex: 1, cursor: 'pointer', fontFamily: 'inherit', padding: '5px 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              border: `1px solid ${active === 'out' ? '#049dc5' : '#ececed'}`, background: active === 'out' ? '#049dc5' : '#fff', color: active === 'out' ? '#fff' : '#3d4650', fontSize: 11.5, fontWeight: 700,
            }}
          >
            <Icon name="plane-takeoff" size={12} />{lang === 'en' ? 'Departure' : 'ذهاب'}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLeg('ret'); }}
            style={{
              flex: 1, cursor: 'pointer', fontFamily: 'inherit', padding: '5px 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              border: `1px solid ${active === 'ret' ? '#049dc5' : '#ececed'}`, background: active === 'ret' ? '#049dc5' : '#fff', color: active === 'ret' ? '#fff' : '#3d4650', fontSize: 11.5, fontWeight: 700,
            }}
          >
            <Icon name="plane-landing" size={12} />{lang === 'en' ? 'Return' : 'عودة'}
          </button>
        </div>
      ) : null}

      {hasRoute ? (
        <div onClick={onSelect} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: '0 0 auto', minWidth: 70, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1d2733' }}>{legData.depart || '--:--'}</div>
            <div style={{ fontSize: 11.5, color: '#7b8087' }}>{legData.from || (lang === 'en' ? 'Origin' : 'الانطلاق')}</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ position: 'relative', width: '100%', height: 1, background: '#cfe9f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plane" size={16} style={{ color: '#049dc5', background: '#fff', transform: active === 'ret' ? 'rotate(-90deg)' : 'rotate(90deg)' }} />
            </div>
            {legData.duration ? <span style={{ fontSize: 10.5, color: '#7b8087' }}>{legData.duration}</span> : null}
          </div>
          <div style={{ flex: '0 0 auto', minWidth: 70, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1d2733' }}>{legData.arrive || '--:--'}</div>
            <div style={{ fontSize: 11.5, color: '#7b8087' }}>{legData.to || (lang === 'en' ? 'Destination' : 'الوصول')}</div>
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
        cursor: 'pointer', border: `1.5px solid ${selected ? '#049dc5' : '#ececed'}`,
        background: selected ? '#eaf8fd' : '#fff', borderRadius: 14, padding: 12,
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      {h.imageUrl ? (
        <img src={h.imageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flex: 'none' }} />
      ) : (
        <div style={{ width: 56, height: 56, borderRadius: 10, background: '#eaf8fd', display: 'grid', placeItems: 'center', flex: 'none' }}>
          <Icon name="building-2" size={20} style={{ color: '#049dc5' }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1d2733' }}>{nm(h.nameAr, h.nameEn)}</span>
        {h.location ? (
          <span style={{ fontSize: 12, color: '#7b8087', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="map-pin" size={12} />{h.location}
          </span>
        ) : null}
        {amenities.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {amenities.slice(0, 4).map((a) => (
              <span key={a} style={{ fontSize: 10.5, color: '#3d4650', background: '#f4f4f4', borderRadius: 999, padding: '2px 9px' }}>{a}</span>
            ))}
          </div>
        ) : null}
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: h.diff ? '#049dc5' : '#7b8087', flex: 'none' }}>
        {h.diff ? (h.diff > 0 ? '+' : '') + h.diff.toLocaleString() + ' ' + (lang === 'en' ? 'IQD' : 'د.ع') : (lang === 'en' ? 'Included' : 'مشمول')}
      </span>
    </div>
  );
}

export default function PackageCard({ title, destination, image, nights, groupType, departs, price, includes = [], badge, onDetails, hotels = [], flights = [], lang = 'ar', rating = 4.8, style, urgency = null }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('flights');
  const [flightIdx, setFlightIdx] = useState(0);
  const [hotelIdx, setHotelIdx] = useState(0);
  const hasFlights = flights.length > 0;
  const hasHotels = hotels.length > 0;
  const canToggle = hasFlights || hasHotels;
  const roundedRating = Math.round(rating);

  return (
    <div dir={lang === 'en' ? 'ltr' : 'rtl'} className="qa-pkg-card qa-hover-lift" style={{ background: '#fff', border: badge ? '3px solid #049dc5' : '1px solid #ececed', borderRadius: 24, boxShadow: badge ? '0 8px 26px rgba(4,157,197,.22)' : '0 2px 10px rgba(29,39,51,.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style }}>
      <div className="qa-pkg-hero" style={{ position: 'relative', background: '#0d2b36' }}>
        {image ? (
          <img src={image} alt={title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', gap: 6, color: '#7fd4ee', fontSize: 13 }}>
            <Icon name="image" size={26} />صورة الوجهة
          </span>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(1,20,28,.9) 0%, rgba(1,20,28,.35) 42%, transparent 68%)' }} />

        {urgency && urgency.label && (
          <span className="qa-pkg-badge" style={{ position: 'absolute', top: 14, insetInlineStart: 14, display: 'inline-flex', alignItems: 'center', gap: 5, background: urgency.soldOut ? '#1d2733' : urgency.hot ? '#e0364f' : '#faab18', color: '#fff', borderRadius: 999, fontWeight: 700, boxShadow: '0 4px 12px rgba(1,42,55,.25)', zIndex: 2 }}>
            {urgency.soldOut ? '⛔' : '⏳'} {urgency.label}
          </span>
        )}
        <span className="qa-pkg-badge" style={{ position: 'absolute', top: 14, insetInlineEnd: 14, display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', borderRadius: 999, fontWeight: 700, color: '#1d2733', boxShadow: '0 4px 12px rgba(1,42,55,.25)' }}>
          <Icon name="star" size={12} style={{ color: '#faab18' }} />{rating}
        </span>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDetails?.(); }}
          aria-label={lang === 'en' ? 'Package details' : 'تفاصيل الباقة'}
          className="qa-pkg-arrow-btn"
          style={{
            position: 'absolute', bottom: 16, insetInlineEnd: 16, borderRadius: '50%',
            background: '#fff', border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(1,42,55,.3)',
          }}
        >
          <Icon name="arrow-up-right" size={16} style={{ color: '#036f8c' }} />
        </button>

        <div className="qa-pkg-hero-text" style={{ position: 'absolute', bottom: 14, insetInlineStart: 14, insetInlineEnd: 56, display: 'flex', flexDirection: 'column', gap: 3, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'flex', gap: 1 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Icon key={i} name="star" size={10} style={{ color: i < roundedRating ? '#faab18' : 'rgba(255,255,255,.35)' }} />
              ))}
            </span>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,.75)' }}>{rating} {lang === 'en' ? 'Out of 5' : 'من ٥'}</span>
          </div>
          <h4 className="qa-pkg-title" style={{ margin: 0, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{title}</h4>
          {nights ? <span className="qa-pkg-subtitle" style={{ color: 'rgba(255,255,255,.8)' }}>{destination}{destination && nights ? ' · ' : ''}{nights}</span> : (
            <span className="qa-pkg-subtitle" style={{ color: 'rgba(255,255,255,.8)' }}>{destination}</span>
          )}
        </div>
      </div>
      <div className="qa-pkg-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="qa-pkg-meta" style={{ display: 'flex', flexWrap: 'wrap', color: '#7b8087' }}>
          {groupType ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="users" size={14} />{groupType}</span> : null}
          {departs ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="calendar-days" size={14} />{departs}</span> : null}
        </div>
        {includes.length ? (
          <ul className="qa-pkg-includes" style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' }}>
            {includes.map((i) => (
              <li key={i} style={{ display: 'flex', gap: 8, color: '#3d4650' }}>
                <Icon name="check" size={15} style={{ color: '#049dc5', flex: 'none' }} />{i}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="qa-pkg-footer" style={{ marginTop: 'auto', borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <span className="qa-pkg-price-label" style={{ color: '#9aa0a6' }}>{lang === 'en' ? 'Starting from' : 'يبدأ من'}</span>
              <span className="qa-pkg-price" style={{ fontWeight: 800, color: '#036f8c', whiteSpace: 'nowrap' }}>{price}</span>
            </div>
            <button
              onClick={onDetails}
              className="qa-btn qa-cyan qa-pkg-cta"
              style={{ fontWeight: 700, whiteSpace: 'nowrap', flex: 'none', borderRadius: 999 }}
            >
              تفاصيل الباقة
            </button>
          </div>

          {canToggle ? (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="qa-pkg-toggle"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                width: '100%', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                border: `1px solid ${open ? '#049dc5' : '#e7eef1'}`, background: open ? '#eaf8fd' : '#f8fbfc',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', flex: 'none', boxShadow: '0 1px 3px rgba(29,39,51,.12)' }}>
                  <Icon name="plane" size={13} style={{ color: '#049dc5', transform: 'rotate(90deg)' }} />
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#036f8c' }}>
                  {lang === 'en' ? 'Check flights & hotels' : 'تحقق من الطيران والفنادق'}
                </span>
              </span>
              <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} style={{ color: '#036f8c', flex: 'none' }} />
            </button>
          ) : null}
        </div>

        {open && canToggle ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #ececed', paddingTop: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {hasFlights ? (
                <button
                  type="button"
                  onClick={() => setTab('flights')}
                  style={{
                    flex: 1, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 10px', borderRadius: 999,
                    border: `1px solid ${tab === 'flights' ? '#049dc5' : '#ececed'}`,
                    background: tab === 'flights' ? '#049dc5' : '#fff', color: tab === 'flights' ? '#fff' : '#3d4650', fontSize: 13, fontWeight: 700,
                  }}
                >
                  {lang === 'en' ? 'Flights' : 'الرحلات'}
                </button>
              ) : null}
              {hasHotels ? (
                <button
                  type="button"
                  onClick={() => setTab('hotels')}
                  style={{
                    flex: 1, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 10px', borderRadius: 999,
                    border: `1px solid ${tab === 'hotels' ? '#049dc5' : '#ececed'}`,
                    background: tab === 'hotels' ? '#049dc5' : '#fff', color: tab === 'hotels' ? '#fff' : '#3d4650', fontSize: 13, fontWeight: 700,
                  }}
                >
                  {lang === 'en' ? 'Hotels' : 'الفنادق'}
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

            <button onClick={onDetails} className="qa-btn qa-cyan" style={{ padding: '9px 18px', fontSize: 13.5 }}>
              {lang === 'en' ? 'Continue with this choice' : 'المتابعة بهذا الاختيار'}
            </button>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .qa-pkg-card { transition: transform .22s ease, box-shadow .22s ease; }
        .qa-hover-lift:hover { transform: translateY(-5px); box-shadow: 0 16px 34px rgba(29,39,51,.14); }
        .qa-pkg-hero { aspect-ratio: 3 / 4; }
        .qa-pkg-badge { padding: 5px 11px; font-size: 12.5px; }
        .qa-pkg-arrow-btn { width: 34px; height: 34px; }
        .qa-pkg-title { font-size: 17px; }
        .qa-pkg-subtitle { font-size: 12.5px; }
        .qa-pkg-body { padding: 20px; gap: 12px; }
        .qa-pkg-meta { gap: 16px; font-size: 13px; }
        .qa-pkg-includes { gap: 6px; }
        .qa-pkg-includes li { font-size: 13px; }
        .qa-pkg-footer { gap: 12px; padding-top: 14px; }
        .qa-pkg-price-label { font-size: 11.5px; }
        .qa-pkg-price { font-size: 18.5px; }
        .qa-pkg-cta { padding: 12px 22px; font-size: 14px; }
        .qa-pkg-toggle { padding: 10px 12px; }

        @media (max-width: 640px) {
          .qa-pkg-hero { aspect-ratio: 4 / 3; }
          .qa-pkg-badge { padding: 4px 9px; font-size: 11px; }
          .qa-pkg-arrow-btn { width: 28px; height: 28px; }
          .qa-pkg-title { font-size: 14.5px; }
          .qa-pkg-subtitle { font-size: 11px; }
          .qa-pkg-body { padding: 14px; gap: 9px; }
          .qa-pkg-meta { gap: 10px; font-size: 12px; }
          .qa-pkg-includes { gap: 4px; }
          .qa-pkg-includes li { font-size: 12px; }
          .qa-pkg-footer { gap: 9px; padding-top: 10px; }
          .qa-pkg-price-label { font-size: 10.5px; }
          .qa-pkg-price { font-size: 16px; }
          .qa-pkg-cta { padding: 10px 16px; font-size: 13px; }
          .qa-pkg-toggle { padding: 8px 10px; }
        }
      `}</style>
    </div>
  );
}
