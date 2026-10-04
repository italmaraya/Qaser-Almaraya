'use client';
import { useEffect, useRef, useState } from 'react';

// Shrink the picture in the browser so the upload stays small and fast.
function shrink(file, max = 1800) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.85).split(',')[1]);
    };
    img.onerror = () => reject(new Error('تعذّر فتح الصورة'));
    img.src = url;
  });
}

// "Scan" button: choose a picture (or paste a screenshot with Ctrl+V),
// it is read once and the values come back through onResult(fields).
export default function ScanFill({ onResult }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const input = useRef(null);

  async function run(file) {
    if (!file) return;
    setBusy(true); setMsg('');
    try {
      const image = await shrink(file);
      const r = await fetch('/api/admin/packages/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, mediaType: 'image/jpeg' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'فشل المسح');
      const filled = onResult(d.fields || {});
      setMsg(filled ? `✓ تمت تعبئة ${filled} حقلاً فارغاً. راجع القيم قبل الحفظ.` : 'لم أجد قيماً جديدة لتعبئة الحقول الفارغة.');
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  }

  // Ctrl+V with a screenshot copied from Excel
  useEffect(() => {
    const h = (e) => {
      const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
      if (f) { e.preventDefault(); run(f); }
    };
    window.addEventListener('paste', h);
    return () => window.removeEventListener('paste', h);
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#f7fcfe', border: '1px dashed #9fd3e3', borderRadius: 10, padding: '10px 14px' }}>
      <button type="button" disabled={busy} onClick={() => input.current && input.current.click()}
        style={{ padding: '9px 16px', borderRadius: 8, border: 0, background: '#049dc5', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>
        {busy ? 'جارٍ القراءة…' : '📷 مسح صورة وتعبئة الحقول'}
      </button>
      <input ref={input} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; run(f); }} />
      <span style={{ fontSize: 12.5, color: '#3d4650' }}>اختر صورة لجدول Excel أو الصق لقطة شاشة (Ctrl+V). تُعبَّأ الحقول الفارغة فقط ولا يُمسّ ما كتبته.</span>
      {msg && <span style={{ fontSize: 13, fontWeight: 700, color: msg.startsWith('✓') ? '#1a7f47' : '#c02643', width: '100%' }}>{msg}</span>}
    </div>
  );
}
