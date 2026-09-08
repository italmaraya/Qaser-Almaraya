'use client';
import React from 'react';
import Icon from './Icon';

export default function PackageCard({ title, destination, image, nights, groupType, departs, price, includes = [], badge, onDetails, style }) {
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
      </div>
    </div>
  );
}
