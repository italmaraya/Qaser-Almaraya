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

export default function PackageCard({ title, destination, image, nights, groupType, departs, price, includes = [], badge, onDetails, hotels = [], flights = [], lang = 'ar', style }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('flights');
  const [flightIdx, setFlightIdx] = useState(0);
  const [hotelIdx, setHotelIdx] = useState(0);
  const hasFlights = flights.length > 0;
  const hasHotels = hotels.length > 0;
  const canToggle = hasFlights || hasHotels;

  return (
    <div dir="rtl" style={{ background: '#fff', border: '1px solid #ececed', borderRadius: 18, boxShadow: '0 2px 8px rgba(29,39,51,.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style }}>
      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#eaf8fd' }}>
        {image ? (
          <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', gap: 6, color: '#049dc5', fontSize: 13 }}>
            <Icon name="image" size={26} />صورة الوجهة
          </span>
        )}
        {image ? <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(1,42,55,.55), transparent 60%)' }} /> : null}
        <div style={{ position: 'absolute', bottom: 16, insetInline: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: image ? '#fff' : '#036f8c', fontSize: 19, fontWeight: 700 }}>{destination}</span>
          {badge ? <span style={{ padding: '4px 12px', borderRadius: 999, background: '#faab18', color: '#012a37', fontSize: 12, fontWeight: 700 }}>{badge}</span> : null}
        </div>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1d2733' }}>{title}</h4>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#7b8087' }}>
          {nights ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="moon" size={15} />{nights}</span> : null}
          {groupType ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="users" size={15} />{groupType}</span> : null}
          {departs ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="calendar-days" size={15} />{departs}</span> : null}
        </div>
        {includes.length ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {includes.map((i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#3d4650' }}>
                <Icon name="check" size={16} style={{ color: '#049dc5', flex: 'none' }} />{i}
              </li>
            ))}
          </ul>
        ) : null}
        <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#7b8087' }}>يبدأ من <b style={{ fontSize: 18, color: '#036f8c' }}>{price}</b></span>
          <button onClick={onDetails} className="qa-btn qa-cyan" style={{ padding: '9px 18px', fontSize: 13.5 }}>تفاصيل الباقة</button>
        </div>

        {canToggle ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
              border: '1px solid #cfe9f2', background: open ? '#eaf8fd' : '#fff', color: '#036f8c', fontSize: 13.5, fontWeight: 700,
            }}
          >
            <Icon name="plane" size={15} style={{ transform: 'rotate(90deg)' }} />
            {lang === 'en' ? 'Check flights & hotels' : 'تحقق من الطيران والفنادق'}
            <Icon name={open ? 'chevron-up' : 'chevron-down'} size={15} />
          </button>
        ) : null}

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
    </div>
  );
}
