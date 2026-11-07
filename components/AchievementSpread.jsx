'use client';
import Icon from './Icon';
import React, { useEffect, useRef, useState } from 'react';

export default function AchievementSpread({ items = [], active, onSelect, assetBase = '/assets' }) {
  const index = Math.max(0, items.findIndex((i) => i.id === active));
  const current = items[index] || items[0];
  const total = items.length;
  const pad2 = (n) => String(n).padStart(2, '0');
  const img = (src) => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) return src;
    return assetBase + '/' + String(src).replace(/^assets\//, '');
  };

  const rowRef = useRef(null);
  const btnRefs = useRef([]);
  const [mascotLeft, setMascotLeft] = useState(null);

  useEffect(() => {
    const btn = btnRefs.current[index];
    const row = rowRef.current;
    if (btn && row) {
      const rowRect = row.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setMascotLeft(btnRect.left - rowRect.left + btnRect.width / 2);
    }
  }, [index, total]);

  if (!current) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, padding: '64px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#faab18' }}>إنجازاتنا</span>
        <h2 style={{ margin: 0, fontSize: 38, fontWeight: 700, color: 'var(--qs-brand-deep,#049dc5)' }}>إنجازاتنا ومشاركاتنا</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,.95fr)', gap: 44, alignItems: 'center' }}>
        <div style={{ position: 'relative', paddingTop: 24 }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              insetInlineStart: 28,
              zIndex: 2,
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: 'var(--qs-band,#049dc5)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              border: '4px solid #fff',
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{current.year}</span>
            <span style={{ fontSize: 12, fontWeight: 600, marginTop: 3 }}>{current.stamp}</span>
          </div>

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              background: '#fff',
              border: '1px solid var(--qs-line,#ececed)',
              borderRadius: 'var(--tw-radius,16px)',
              overflow: 'hidden',
              boxShadow: 'var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))',
            }}
          >
            <img
              src={img(current.photo || current.image || current.img)}
              alt={current.title || ''}
              style={{ display: 'block', width: '100%', aspectRatio: '4/3', objectFit: 'cover' }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                padding: '14px 20px',
                borderTop: '1px solid var(--qs-line,#ececed)',
                fontSize: 14,
                color: 'var(--qs-ink-2,#5f666e)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name="map-pin" size={14} />
                {current.place}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--qs-body,#3d4650)' }}>
                {pad2(total)} / {pad2(index + 1)}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 27, fontWeight: 700, color: 'var(--qs-brand-deep,#049dc5)' }}>{current.title}</h3>
          {(Array.isArray(current.body) ? current.body : [current.body]).filter(Boolean).map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 16, lineHeight: 1.8, color: 'var(--qs-body,#3d4650)', textWrap: 'pretty' }}>
              {p}
            </p>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, height: 56 }}>
          <img
            src={img('mascot-skylo-head.webp')}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: mascotLeft != null ? mascotLeft : '50%',
              transform: 'translateX(-50%)',
              transition: 'left 320ms cubic-bezier(.4,0,.2,1)',
              width: 56,
              height: 56,
              borderRadius: '50%',
            }}
          />
        </div>

        <div ref={rowRef} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          {items.map((it, i) => {
            const isActive = it.id === current.id;
            return (
              <button
                key={it.id}
                ref={(el) => (btnRefs.current[i] = el)}
                type="button"
                onClick={() => onSelect && onSelect(it.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  minWidth: 130,
                  padding: '12px 16px',
                  borderRadius: 'var(--tw-radius-sm,10px)',
                  border: isActive ? '2px solid var(--qs-brand-deep,#049dc5)' : '1px solid var(--qs-line,#ececed)',
                  background: '#fff',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: isActive ? 'var(--qs-brand-deep,#049dc5)' : 'var(--qs-ink-2,#5f666e)' }}>
                  {it.year} · {pad2(i + 1)}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--qs-ink,#1d2733)' }}>{it.short || it.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
