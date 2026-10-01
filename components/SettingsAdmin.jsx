'use client';
import { useEffect, useState } from 'react';

const input = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #ececed', fontSize: 15, fontFamily: 'inherit', direction: 'ltr' };

// Dashboard → الإعدادات: site-wide exchange rate.
export default function SettingsAdmin() {
  const [rate, setRate] = useState('');
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings').then((r) => r.json()).then((d) => setRate(String(d.usd_iqd_rate || ''))).catch(() => {});
  }, []);

  async function save() {
    setBusy(true); setErr(''); setSaved(false);
    try {
      const r = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usd_iqd_rate: Number(rate) }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'تعذّر الحفظ');
      setRate(String(d.usd_iqd_rate)); setSaved(true);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }}>
      <div style={{ background: '#f3fafc', border: '1px solid #d9e9ef', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <b style={{ fontSize: 15, color: '#036f8c' }}>💱 سعر صرف الدولار</b>
        <span style={{ fontSize: 13, color: '#3d4650', lineHeight: 1.8 }}>
          كم ديناراً عراقياً يساوي الدولار الواحد. يُستخدم تلقائياً في: الباقات المسعّرة بالدولار، تحويل التكاليف الداخلية بالدولار، وزر تبديل العملة للزوار.
          عند الحفظ تتحدّث جميع الأسعار على الموقع فوراً دون تعديل يدوي. تُقرَّب أسعار العملاء إلى أقرب 1,000 دينار.
        </span>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
          1 دولار أمريكي =
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" min="1" step="1" style={input} value={rate} onChange={(e) => { setRate(e.target.value); setSaved(false); }} placeholder="مثال: 1310" />
            <span style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>د.ع</span>
          </div>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={save} disabled={busy || !rate} style={{ padding: '9px 18px', borderRadius: 8, border: 0, background: '#049dc5', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{busy ? 'جارٍ الحفظ…' : 'حفظ سعر الصرف'}</button>
          {saved && <span style={{ color: '#1a7f47', fontSize: 13, fontWeight: 700 }}>✓ تم الحفظ — الأسعار بالدولار تحدّثت على الموقع</span>}
          {err && <span style={{ color: '#c02643', fontSize: 13 }}>{err}</span>}
        </div>
      </div>
    </div>
  );
}
