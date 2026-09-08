'use client';
import React from 'react';

export default function MascotLoader({ assetBase = '/assets' }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(255,255,255,.72)',
        backdropFilter: 'blur(14px)',
      }}
    >
      <style>{'@keyframes qa-bob{0%,100%{transform:translateY(-7%)}50%{transform:translateY(7%)}}@keyframes qa-ring{to{transform:rotate(360deg)}}'}</style>
      <div style={{ position: 'relative', width: 132, height: 132, display: 'grid', placeItems: 'center' }}>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid rgba(4,157,197,.2)',
            borderTopColor: '#049dc5',
            animation: 'qa-ring .9s linear infinite',
          }}
        />
        <img
          src={assetBase + '/mascot-skylo-head.webp'}
          alt=""
          style={{ width: 92, height: 92, borderRadius: '50%', objectFit: 'cover', animation: 'qa-bob 1.2s ease-in-out infinite' }}
        />
      </div>
    </div>
  );
}
